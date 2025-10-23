import { GoogleGenAI, Modality, HarmCategory, HarmBlockThreshold, Type } from "@google/genai";
import { FaceBox } from "./imageService";

// A utility function to convert a File object to a base64 string
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = error => reject(error);
    });
};

const getBackgroundInstruction = (style: string): string => {
    switch (style) {
        case 'plain-light':
            return 'Create a clean, seamless, professional studio backdrop in a soft white or light grey. It should have subtle depth, not a flat digital white.';
        case 'plain-dark':
            return 'Create a clean, seamless, professional studio backdrop in a deep charcoal or dark grey. It should have subtle depth, not a flat digital black.';
        case 'subtle-gradient':
            return 'Create a studio backdrop with a very gentle and smooth gradient, typically from a medium grey to a lighter or darker tone, to add depth and focus on the subject. The effect must be subtle and professional.';
        case 'textured-canvas':
            return 'Create a studio backdrop that emulates a physical textured canvas, like those used in high-end portrait studios. The texture must be extremely subtle, elegant, and visible only on close inspection. It must not distract from the subject.';
        case 'deep-void':
            return 'Create a pure, deep black studio background. The lighting on the subject should have a natural falloff into the void, creating a sense of infinite space without any visible backdrop details.';
        case 'ai-choice':
            return 'Analyze the subject and the master style and choose the most fitting professional studio backdrop (light, dark, or gradient) to create a balanced and powerful composition.';
        default:
            if (style.startsWith('#')) {
                return `Create a clean, seamless, professional studio backdrop using the solid hex color ${style}. Ensure it has subtle depth and does not look like a flat digital color fill.`;
            }
            return 'Analyze the subject and the master style and choose the most fitting professional studio backdrop (light, dark, or gradient) to create a balanced and powerful composition.';
    }
};

const getMasterStyleInstruction = (style: string, detailLevel: number): string => {
    let styleInstruction = '';
    switch (style) {
        case 'richard-avedon':
            styleInstruction = 'Apply a high-contrast, minimalist lighting style inspired by Richard Avedon. Use a hard key light to create sharp, defined shadows and bright highlights. The overall mood should be stark, dramatic, and powerful.';
            break;
        case 'peter-lindbergh':
            styleInstruction = 'Apply a cinematic, narrative lighting style inspired by Peter Lindbergh. Use soft, natural-looking light sources. The mood should be soulful, authentic, and evocative, with rich mid-tones and a slightly raw feel.';
            break;
        case 'maestro-signature':
        default:
            styleInstruction = 'Apply a balanced, elegant, and timeless studio lighting setup. The lighting should be soft but directional, sculpting the subject\'s features gracefully. The mood is one of quiet confidence and sophistication.';
            break;
    }

    let detailInstruction = '';
    if (detailLevel < 33) {
        detailInstruction = 'The final texture should be soft and smooth, with a slightly ethereal quality. Prioritize tonal harmony over sharp detail.';
    } else if (detailLevel > 66) {
        detailInstruction = 'The final texture should be crisp and highly detailed. Emphasize micro-textures in skin, fabric, and hair for a hyper-realistic and sharp finish.';
    } else {
        detailInstruction = 'The final texture should be natural and balanced, with a lifelike level of detail that is neither overly soft nor artificially sharp.';
    }

    return `${styleInstruction} ${detailInstruction}`;
};


interface EnhanceImageParams {
    imageFile: File;
    masterStyle: string;
    detailLevel: number;
    backgroundStyle: string;
    addNegativeSpace: boolean;
    maintainProps: boolean;
}

export const enhanceImage = async ({
    imageFile,
    masterStyle,
    detailLevel,
    backgroundStyle,
    addNegativeSpace,
    maintainProps,
}: EnhanceImageParams): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const model = 'gemini-2.5-flash-image';

    const base64Data = await fileToBase64(imageFile);
    const imagePart = {
        inlineData: {
            data: base64Data,
            mimeType: imageFile.type,
        },
    };

    const backgroundInstruction = getBackgroundInstruction(backgroundStyle);
    const masterStyleInstruction = getMasterStyleInstruction(masterStyle, detailLevel);

    let stepCounter = 3; // Start after context analysis and background removal

    let compositionalFramingInstruction = '';
    if (addNegativeSpace) {
        stepCounter++;
        compositionalFramingInstruction = `
**Step ${stepCounter}: Mandatory Compositional Framing**
- Critically analyze the composition. If the subject is tightly cropped (e.g., head is closer than 10% of the image height to the top edge, or body is too close to side edges), you **MUST** expand the canvas to add "breathing room." This is not optional.
- **Authenticity Mandate:** To ensure the final photograph feels authentic, you must:
    - **Analyze Source Image:** First, analyze the original, unedited areas for unique characteristics: film grain, digital noise, and subtle lens imperfections.
    - **Replicate Characteristics:** Second, meticulously replicate these exact characteristics in any newly generated areas. The new space must not be perfectly clean; it must match the original's texture and noise profile.
- The added space must seamlessly match the chosen background style (color, gradient, or texture) while also incorporating the replicated grain and noise. This expansion should be just enough to achieve a professional, balanced composition.
        `;
    } else {
        stepCounter++;
        compositionalFramingInstruction = `
**Step ${stepCounter}: Compositional Integrity**
- You are strictly **FORBIDDEN** from altering the original image's crop, aspect ratio, or dimensions. 
- All enhancements must occur *within* the original frame. Do not add any new canvas space. The original composition must be preserved exactly.
        `;
    }

    let contextInstruction = '';
    if (maintainProps) {
        contextInstruction = `
**Step 1: Subject & Context Analysis (Chain-of-Thought)**
- **1a. Identify Subject:** Identify the primary human subject(s).
- **1b. Analyze Pose & Contact:** Trace the subject's pose and points of physical contact.
- **1c. Identify Interactive Objects:** Identify any objects the subject is directly holding, wearing, or touching (e.g., a book, hat, instrument). These are essential props.
- **1d. Identify Supporting Objects:** Identify objects structurally essential for the pose (e.g., the chair they sit on, the wall they lean against). These are essential surfaces.
- **1e. Differentiate:** Meticulously differentiate these essential items from the general background.
- **1f. Define the Composite Subject:** The human subject(s) PLUS these essential props and surfaces are the "composite subject". They are equally important and must be preserved with the same fidelity. Their removal is a failure of the task.

**Step 2: Background & Clutter Removal**
- Meticulously remove EVERYTHING that is NOT part of the defined "composite subject". The goal is to perfectly isolate the composite subject on a clean slate.
        `;
    } else {
        contextInstruction = `
**Step 1: Aggressive Subject Isolation**
- Your ONLY task in this step is to isolate the primary human subject(s).
- Meticulously and aggressively remove EVERYTHING else. This includes all props (even if held, like a book or phone), all accessories not permanently attached to the body (like hats or scarves, but not prescription glasses), all furniture (chairs, tables), and the entire original background.
- The result of this step must be the human form, and only the human form, on a clean slate.

**Step 2: Background Removal (Confirmation)**
- This step is a confirmation. Ensure the background is completely gone and only the isolated human remains.
        `;
    }

    const prompt = `
**Guiding Principle:**
You are an expert photo retoucher and digital artist, acting as an assistant to a professional photographer. Your task is to enhance their portraits into high-end, black and white studio masterpieces.

**Identity Preservation Mandate (ABSOLUTE PRIORITY):**
- The subject's identity is SACROSANCT. You MUST NOT alter the subject's facial features (eyes, nose, mouth, facial structure), expression, identity, or body posture.
- The final portrait MUST be instantly recognizable as the same person from the original photograph, in the exact same pose.
- Any enhancement that compromises recognizability is a failure. This rule overrides all other stylistic instructions.

**ENHANCEMENT WORKFLOW:**

${contextInstruction}

**Step 3: Studio Backdrop Creation**
- Create a new, professional studio backdrop behind the isolated subject/composite subject.
- The style of the backdrop is determined by the following user selection: "${backgroundInstruction}"

**Step 4: Realistic Grounding & Shadow Generation**
- Analyze the lighting on the subject from the original photograph to understand the direction and quality of the light sources.
- Cast new, soft, physically realistic shadows from the subject/composite subject onto the new studio floor/backdrop. The shadows must be directionally accurate based on your lighting analysis. This grounds the subject in the new environment.

**Step 5: Master Style Application**
- Apply the chosen master photographic style to the lighting and mood of the entire subject/composite subject.
- Ensure all elements are lit consistently and cohesively under this new style.
- Instruction: "${masterStyleInstruction}"

**Step 6: High-End Skin Retouching**
- Perform high-end skin retouching. Emulate a "frequency separation" technique: smooth out blemishes and uneven tones while meticulously preserving and enhancing natural, high-fidelity skin micro-texture (pores, fine lines). The result must look real, never plastic or airbrushed.

${compositionalFramingInstruction}

**Step ${stepCounter + 1}: Pre-Flight Check (Self-Correction)**
- **CRITICAL:** Before generating the final image, perform a self-correction check.
- Compare the enhanced subject's facial features and structure directly against the original input image.
- If you detect any deviation, distortion, or loss of likeness, you MUST undo the last change and re-apply the lighting and retouching effects with less intensity until the subject's identity is perfectly preserved.

**Step ${stepCounter + 2}: Final Image Generation**
- Synthesize all the previous steps into a single, cohesive, gallery-print quality black and white photograph.
- The final image must be high-resolution (target 4096px), free of digital artifacts, and appear as if captured in a professional studio.
- Ensure all rules, especially the Identity Preservation Mandate, have been followed.
- Generate only the final image, with no additional text, watermarks, or signatures.
    `;

    const safetySettings = [
        {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
        },
    ];

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: {
                parts: [
                    imagePart,
                    { text: prompt },
                ],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
            safetySettings,
        });

        const candidate = response.candidates?.[0];

        // Happy path: Image data is present
        if (candidate?.content?.parts) {
            for (const part of candidate.content.parts) {
                if (part.inlineData) {
                    const base64ImageBytes: string = part.inlineData.data;
                    const imageUrl = `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
                    return imageUrl;
                }
            }
        }

        // Error diagnosis path
        if (response.promptFeedback?.blockReason) {
            // Prompt was blocked before generation
            throw new Error(`Your request was blocked. Reason: ${response.promptFeedback.blockReason}. Please adjust your settings or try a different image.`);
        }
        
        if (candidate?.finishReason && candidate.finishReason !== 'STOP') {
            // Generation finished for a reason other than 'STOP' (e.g., SAFETY)
            throw new Error(`Image generation failed. Reason: ${candidate.finishReason}. Please try a different image or adjust your settings.`);
        }

        // If we get here, the response was successful but contained no image, which is unexpected.
        console.warn("Gemini API returned a successful response but no image data was found.", response);
        throw new Error("The API returned an empty response. This could be a temporary issue. Please try again.");

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        if (error instanceof Error) {
             throw new Error(`Failed to enhance the image: ${error.message}`);
        }
        throw new Error("Failed to enhance the image due to an unknown error.");
    }
};

interface RefineImageWithContextParams {
    targetImageFile: File;
    referenceImageFiles: File[];
    prompt: string;
}

export const refineImageWithContext = async ({
    targetImageFile,
    referenceImageFiles,
    prompt: userPrompt,
}: RefineImageWithContextParams): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const model = 'gemini-2.5-flash-image';

    const base64Target = await fileToBase64(targetImageFile);
    const parts: any[] = [{
        inlineData: {
            data: base64Target,
            mimeType: targetImageFile.type,
        },
    }];

    for (const file of referenceImageFiles) {
        const base64Ref = await fileToBase64(file);
        parts.push({
            inlineData: {
                data: base64Ref,
                mimeType: file.type,
            },
        });
    }
    
    let referenceInstruction = '';
    if (referenceImageFiles.length > 0) {
        referenceInstruction = `2.  **Reference Images:** All subsequent images are provided as visual context. Use them to intelligently complete missing areas in the first image if they are visible in the reference photos.`;
    }

    const prompt = `
**Guiding Principle:**
You are an expert photo retoucher and digital artist. Your task is to perform a specific edit on the *first* image provided, based on the user's text instructions.

**Identity Preservation Mandate (ABSOLUTE PRIORITY):**
- The subject's identity is SACROSANCT. You MUST NOT alter the subject's facial features (eyes, nose, mouth, facial structure), expression, identity, or body posture, unless explicitly and safely requested by the user's prompt (e.g., "close their eyes").

**Input Analysis:**
1.  **Primary Image:** The very first image in the input is the target image to be edited. All edits apply only to this image.
${referenceInstruction}
3.  **User's Goal:** The user wants to achieve the following: "${userPrompt}"

**Execution Workflow:**
- **If the user's request involves completing missing parts of the primary image (e.g., "add the top of their head," "fix the cropped shoulder"):**
    - Meticulously analyze the reference images to find the missing visual information.
    - If the information is present in the reference images, use it to seamlessly reconstruct the missing area in the primary image.
    - The reconstruction must perfectly match the lighting, texture, style, and quality of the primary image.
    - **Crucial Constraint:** Do not invent details. If the missing part is not clearly visible in any of the reference images, do not attempt to fill it in.
- **If the user's request is a stylistic change (e.g., "add more film grain," "make the shadows deeper"):**
    - Apply this stylistic change to the primary image. The reference images should be ignored for this type of task.
- **For all requests:**
    - The final output must be a photograph.
    - Preserve the high-end, professional quality of the original black and white portrait.

**Final Instruction:**
- Generate only the final, edited version of the *first* image. Do not include text, watermarks, or signatures.
    `;
    
    parts.push({ text: prompt });

    const safetySettings = [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    ];

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: { parts },
            config: {
                responseModalities: [Modality.IMAGE],
            },
            safetySettings,
        });

        const candidate = response.candidates?.[0];

        if (candidate?.content?.parts) {
            for (const part of candidate.content.parts) {
                if (part.inlineData) {
                    const base64ImageBytes: string = part.inlineData.data;
                    const imageUrl = `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
                    return imageUrl;
                }
            }
        }

        if (response.promptFeedback?.blockReason) {
            throw new Error(`Your request was blocked. Reason: ${response.promptFeedback.blockReason}. Please adjust your prompt or image.`);
        }
        
        if (candidate?.finishReason && candidate.finishReason !== 'STOP') {
            throw new Error(`Image generation failed. Reason: ${candidate.finishReason}. Please try again.`);
        }

        console.warn("Gemini API returned a successful response but no image data was found.", response);
        throw new Error("The API returned an empty response. This could be a temporary issue. Please try again.");

    } catch (error) {
        console.error("Error calling Gemini API for refinement:", error);
        if (error instanceof Error) {
             throw new Error(`Failed to refine the image: ${error.message}`);
        }
        throw new Error("Failed to refine the image due to an unknown error.");
    }
};

export const detectFaces = async (imageFile: File): Promise<FaceBox[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const model = 'gemini-2.5-pro';

    const base64Data = await fileToBase64(imageFile);
    const imagePart = {
        inlineData: { data: base64Data, mimeType: imageFile.type },
    };

    const prompt = `
Analyze the provided image and identify all human faces.
For each face detected, provide a bounding box with its coordinates.
The coordinates must be relative to the image dimensions (from 0.0 to 1.0).
The bounding box should be defined by the top-left corner (x, y) and its width and height.
Return the data as a JSON object that adheres to the provided schema.
If no human faces are found, return a JSON object with an empty "faces" array.
`;

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            faces: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        x: { type: Type.NUMBER, description: 'The x-coordinate of the top-left corner.' },
                        y: { type: Type.NUMBER, description: 'The y-coordinate of the top-left corner.' },
                        width: { type: Type.NUMBER, description: 'The width of the bounding box.' },
                        height: { type: Type.NUMBER, description: 'The height of the bounding box.' },
                    },
                    required: ['x', 'y', 'width', 'height'],
                },
            },
        },
        required: ['faces'],
    };

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: { parts: [imagePart, { text: prompt }] },
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
        });
        
        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText);
        return result.faces || [];
    } catch (error) {
        console.error("Error detecting faces:", error);
        throw new Error("Could not detect faces in the image.");
    }
};
