import { GoogleGenAI, Modality } from "@google/genai";

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
        case 'default-gevurah':
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
}

export const enhanceImage = async ({
    imageFile,
    masterStyle,
    detailLevel,
    backgroundStyle,
    addNegativeSpace,
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

    let compositionalFramingInstruction = '';
    if (addNegativeSpace) {
        compositionalFramingInstruction = `
**Step 7: Compositional Framing**
- Critically analyze the composition's negative space. If the subject is too close to the frame's edges, creating a cramped or unbalanced feel, intelligently expand the canvas to add "breathing room."
- The added space must seamlessly match the chosen background style (color, gradient, or texture).
- This expansion should be just enough to achieve a professional, balanced composition. Do not alter the scale or content of the original image; only add new space around it.
- This rule is for compositional balance, not for forcing a specific aspect ratio.
        `;
    }

    const prompt = `
**Guiding Principle:**
You are an expert photo retoucher and digital artist, acting as an assistant to a professional photographer. Your task is to enhance their portraits into high-end, black and white studio masterpieces by following a strict set of rules. Your primary goal is to assist, not to reimagine. The photographer's original composition and subject must be preserved with the utmost respect.

**FORBIDDEN ACTIONS - NON-NEGOTIABLE:**
- DO NOT alter the subject's facial features, expression, or identity in any way. This is the most important rule.
- DO NOT change the subject's pose, clothing, or physical characteristics.
- DO NOT alter the original image's composition, framing, or aspect ratio. Preserve the photographer's shot style intent.

**ENHANCEMENT WORKFLOW:**

**Step 1: Subject & Context Analysis**
- Critically analyze the input image.
- Identify the primary human subject(s).
- Identify any objects the subject is directly interacting with (e.g., sitting on a chair, leaning on a table, holding a prop). These are considered part of the subject's context and MUST be preserved.

**Step 2: Background & Clutter Removal**
- This is a critical step. REMOVE EVERYTHING in the background that is not part of the subject's immediate context. This includes walls, floors, carpets, environmental textures, other furniture, and any form of visual clutter.
- The goal is a clean slate, isolating the subject and their contextual objects.

**Step 3: Studio Backdrop Creation**
- Create a new, professional studio backdrop behind the isolated subject.
- The style of the backdrop is determined by the following user selection: "${backgroundInstruction}"

**Step 4: Realistic Grounding & Shadow Generation**
- Analyze the lighting on the subject from the original photograph to understand the direction and quality of the light sources.
- Cast new, soft, physically realistic shadows from the subject and their contextual objects onto the new studio floor/backdrop. The shadows must be directionally accurate based on your lighting analysis. This grounds the subject in the new environment.

**Step 5: Master Style Application**
- Apply the chosen master photographic style to the lighting and mood of the overall image.
- Instruction: "${masterStyleInstruction}"

**Step 6: High-End Skin Retouching**
- Perform high-end skin retouching. Emulate a "frequency separation" technique: smooth out blemishes and uneven tones while meticulously preserving and enhancing natural, high-fidelity skin micro-texture (pores, fine lines). The result must look real, never plastic or airbrushed.

${compositionalFramingInstruction}

**FINAL QUALITY MANDATE:**
- The final output must be a gallery-print quality, high-resolution (target 4096px) black and white photograph.
- There must be zero digital artifacts, blurriness, or pixelation.
- The final image must look like it was captured in a professional international photo studio.
- DO NOT add any text, watermarks, or signatures.
    `;

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
        });

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                const base64ImageBytes: string = part.inlineData.data;
                const imageUrl = `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
                return imageUrl;
            }
        }
        throw new Error("No image was generated by the API.");

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("Failed to enhance the image. Please try again.");
    }
};