import { GoogleGenAI, Modality, HarmCategory, HarmBlockThreshold } from "@google/genai";

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

    let stepCounter = 6;

    let compositionalFramingInstruction = '';
    if (addNegativeSpace) {
        stepCounter++;
        compositionalFramingInstruction = `
**Step ${stepCounter}: Compositional Framing & Authenticity**
- Critically analyze the composition's negative space. If the subject is too close to the frame's edges, creating a cramped or unbalanced feel, intelligently expand the canvas to add "breathing room."
- **Authenticity Mandate:** To ensure the final photograph feels authentic and not digitally manipulated, you must:
    - **Analyze Source Image:** First, analyze the original, unedited areas of the portrait for its unique characteristics: film grain, digital noise, and subtle lens imperfections.
    - **Replicate Characteristics:** Second, meticulously replicate these exact characteristics in any newly generated areas (the "breathing room"). The new space must not be perfectly clean; it must have the same texture and noise profile as the rest of the image.
- The added space must seamlessly match the chosen background style (color, gradient, or texture), while also incorporating the replicated grain and noise.
- This expansion should be just enough to achieve a professional, balanced composition. Do not alter the scale or content of the original image; only add new space around it.
- This rule is for compositional balance, not for forcing a specific aspect ratio.
        `;
    }

    let contextInstruction = '';
    if (maintainProps) {
        contextInstruction = `
**Step 1: Subject & Context Analysis (Chain-of-Thought)**
- **1a. Identify Subject:** First, identify the primary human subject(s).
- **1b. Analyze Pose & Contact:** Second, trace the subject's pose and their points of physical contact with their environment.
- **1c. Identify Interactive Objects:** Third, identify any objects the subject is directly holding, wearing, or touching (e.g., a book, a hat, a musical instrument). These are essential props.
- **1d. Identify Supporting Objects:** Fourth, identify any objects that are structurally essential for the subject's pose (e.g., the chair they are sitting on, the wall they are leaning against, the floor they are standing on). These are essential contextual surfaces.
- **1e. Differentiate from Background:** Fifth, meticulously differentiate these essential props and surfaces from the general, non-interactive background. For example, if a person is sitting on a park bench, the bench is an essential contextual object, but the trees and sky behind them are the background to be removed.
- **1f. Define the Composite Subject:** The human subject(s) PLUS these essential props and contextual surfaces are now considered the "composite subject" to be isolated.

**Step 2: Background & Clutter Removal**
- Meticulously remove EVERYTHING that is NOT part of the defined "composite subject".
- The goal is to perfectly isolate the composite subject on a clean slate, ready for the new studio environment.
        `;
    } else {
        contextInstruction = `
**Step 1: Subject Analysis**
- Critically analyze the input image to identify ONLY the primary human subject(s).

**Step 2: Full Background & Prop Removal**
- Meticulously remove EVERYTHING that is not the human subject. This includes all objects, props, chairs, tables, and the entire original background.
- The goal is to perfectly isolate ONLY the human subject on a clean slate.
        `;
    }

    stepCounter++;
    const selfCorrectionInstruction = `
**Step ${stepCounter}: Pre-Flight Check (Self-Correction)**
- **CRITICAL:** Before generating the final image, perform a self-correction check.
- Compare the enhanced subject's facial features and structure directly against the original input image.
- If you detect any deviation, distortion, or loss of likeness, you MUST undo the last change and re-apply the lighting and retouching effects with less intensity until the subject's identity is perfectly preserved.
    `;

    stepCounter++;
    const finalGenerationInstruction = `
**Step ${stepCounter}: Final Image Generation**
- Synthesize all the previous steps into a single, cohesive, gallery-print quality black and white photograph.
- The final image must be high-resolution (target 4096px), free of digital artifacts, and appear as if captured in a professional studio.
- Ensure all rules, especially the Identity Preservation Mandate, have been followed.
- Generate only the final image, with no additional text, watermarks, or signatures.
    `;

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
- Create a new, professional studio backdrop behind the isolated composite subject.
- The style of the backdrop is determined by the following user selection: "${backgroundInstruction}"

**Step 4: Realistic Grounding & Shadow Generation**
- Analyze the lighting on the subject from the original photograph to understand the direction and quality of the light sources.
- Cast new, soft, physically realistic shadows from the composite subject (person and props) onto the new studio floor/backdrop. The shadows must be directionally accurate based on your lighting analysis. This grounds the subject in the new environment.

**Step 5: Master Style Application**
- Apply the chosen master photographic style to the lighting and mood of the entire composite subject.
- Ensure the subject and their contextual objects are lit consistently and cohesively under this new style, making them feel naturally part of the same scene.
- Instruction: "${masterStyleInstruction}"

**Step 6: High-End Skin Retouching**
- Perform high-end skin retouching. Emulate a "frequency separation" technique: smooth out blemishes and uneven tones while meticulously preserving and enhancing natural, high-fidelity skin micro-texture (pores, fine lines). The result must look real, never plastic or airbrushed.

${compositionalFramingInstruction}

${selfCorrectionInstruction}

${finalGenerationInstruction}
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

interface RefineImageParams {
    imageFile: File;
    prompt: string;
}

export const refineImage = async ({
    imageFile,
    prompt: userPrompt,
}: RefineImageParams): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const model = 'gemini-2.5-flash-image';

    const base64Data = await fileToBase64(imageFile);
    const imagePart = {
        inlineData: {
            data: base64Data,
            mimeType: imageFile.type,
        },
    };

    const prompt = `
**Guiding Principle:**
You are an expert photo retoucher and digital artist. The user has provided a black and white studio portrait they created. Your task is to apply the following edit based on their text instruction, while maintaining the overall high-end quality and photographic style.

**CORE RULE - NON-NEGOTIABLE:**
- DO NOT alter the subject's facial features, expression, identity, or posture in any way. The final portrait must be clearly recognizable as the same person from the original photograph. This is the most important rule.

**User's Refinement Instruction:**
"${userPrompt}"

**Final Instruction:**
Apply this change subtly and professionally. Generate only the final, edited image, with no additional text, watermarks, or signatures. The output must be a high-resolution, photographic image.
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

interface GenerateRefinedPromptParams {
    imageFile: File;
    prompt: string;
}

export const generateRefinedPrompt = async ({
    imageFile,
    prompt: userPrompt,
}: GenerateRefinedPromptParams): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    
    const base64Data = await fileToBase64(imageFile);
    const imagePart = {
        inlineData: {
            data: base64Data,
            mimeType: imageFile.type,
        },
    };

    const systemInstruction = `You are a world-class photographic prompt engineer. Your task is to take a user's simple, conversational request for an image edit and expand it into a detailed, professional, and actionable prompt for an image generation AI.

The image generation AI you are writing for is an expert photo retoucher. It understands photographic terms (e.g., lighting, composition, film stock, color grading, texture).

**Your Process:**
1.  **Analyze the Image:** Look at the provided black and white portrait. Understand its current style, lighting, and composition.
2.  **Analyze the User Request:** Understand the user's intent, even if it's simple (e.g., "make it moody," "add a retro filter").
3.  **Synthesize and Expand:** Combine your analysis into a new, detailed prompt.
    *   Translate vague terms into specific instructions. "Moody" could become "deepen the shadows, add a subtle vignette, and enhance the contrast in the mid-tones to create a dramatic, chiaroscuro effect."
    *   "Retro filter" could become "apply a subtle sepia tone, introduce a fine-grained film texture reminiscent of Kodak Tri-X 400, and slightly soften the highlights to emulate a vintage silver gelatin print."
    *   Be creative and descriptive.
4.  **Preserve Core Rules:** Remind the AI to preserve the subject's identity, features, and pose. This is critical.

**Output Format:**
- Your output MUST be ONLY the new, detailed prompt text. Do not include any other explanations, greetings, or markdown formatting. Just the raw text for the next AI.`;

    const contents = {
        parts: [
            imagePart,
            { text: `Here is the user's request: "${userPrompt}"` },
        ],
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: contents,
            config: {
                systemInstruction: systemInstruction,
                thinkingConfig: {
                    thinkingBudget: 32768,
                },
            },
        });

        return response.text.trim();
    } catch (error) {
        console.error("Error generating refined prompt with gemini-2.5-pro:", error);
        if (error instanceof Error) {
            throw new Error(`The advanced model failed to process your request: ${error.message}`);
        }
        throw new Error("The advanced model failed to process your request due to an unknown error.");
    }
};