import { GoogleGenAI, Modality } from "@google/genai";

// Ensure the API key is available from environment variables.
const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  // This will be caught by the framework and shown to the user.
  throw new Error("API_KEY environment variable not set. Please configure it to use the AI features.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const getMasterStyleInstruction = (style: string, detailLevel: number): string => {
    let stylePrompt = '';
    switch (style) {
        case 'richard-avedon':
            stylePrompt = `**Artistic Style:** Emulate the style of Richard Avedon. This means high-contrast, stark, and minimalist. Use a hard key light to create dramatic shadows and highlights. The overall mood should be bold, direct, and graphic.`;
            break;
        case 'peter-lindbergh':
            stylePrompt = `**Artistic Style:** Emulate the style of Peter Lindbergh. This means cinematic, soulful, and narrative-driven. Use soft, natural-looking light that wraps around the subject. Emphasize authentic emotion and texture over perfect polish. The mood is often introspective and deeply human.`;
            break;
        case 'default-gevurah':
        default:
            stylePrompt = `**Artistic Style:** Apply the Gevurah Pictures signature style. This is a balanced, elegant, and timeless fine-art look. The lighting should be soft but directional, creating a gentle three-dimensional form. The mood is sophisticated and composed.`;
            break;
    }

    let detailPrompt = '';
    if (detailLevel <= 33) {
        detailPrompt = `**Texture & Detail:** Render with a soft, ethereal quality. Tonal transitions should be exceptionally smooth. Emulate the effect of a subtle diffusion filter to create a gentle glow in the highlights without losing essential sharpness.`;
    } else if (detailLevel > 33 && detailLevel <= 66) {
        detailPrompt = `**Texture & Detail:** Render with a natural, balanced texture. Preserve the true texture of skin and fabrics with photographic realism. The image should be sharp and clear without feeling over-processed.`;
    } else {
        detailPrompt = `**Texture & Detail:** Render with a crisp, highly detailed finish. Emphasize micro-contrast to make textures like fabric weaves, hair strands, and skin pores pop with clarity. The image should be tack-sharp and have a strong tactile quality.`;
    }

    return `\n${stylePrompt}\n${detailPrompt}\n`;
}


const getBackgroundInstruction = (style: string): string => {
    if (style.startsWith('#')) {
        return `**Action:** Apply the tone ${style} uniformly and softly to create a clean studio backdrop. The new environment must feel intentional and perfectly integrated with the subject's lighting.`;
    }
    
    switch (style) {
        case 'plain-light':
            return `**Action:** Use a soft white or light gray tone with subtle depth to create a clean studio backdrop.`;
        case 'plain-dark':
             return `**Action:** Use rich black or charcoal tones that maintain visibility of edges and form to create a clean studio backdrop.`;
        case 'subtle-gradient':
            return `**Action:** Apply a gentle transition from light to dark behind the subject to create a clean studio backdrop that enhances focus.`;
        case 'textured-canvas':
            return `**Action:** Create a studio backdrop with a very light, minimal, and elegant canvas texture. Avoid any clutter or visual noise.`;
        case 'deep-void':
            return `**Action:** Create a smooth, pure black background with studio-grade falloff lighting.`;
        case 'ai-choice':
        default:
             return `**Action:** Choose the most balanced, clean studio backdrop automatically.`;
    }
};

const ENHANCEMENT_PROMPT = `
**Guiding Principle:** Your role is that of an expert assistant, not a creative re-imaginer. Your goal is to enhance the existing photograph according to the precise rules below, preserving the core soul and identity of the original image.

**Primary Objective:** You are a master technical photo editor executing a strict transformation protocol. Your task is to convert any provided image of a person into a high-end, clean, complete, and professionally composed black and white studio portrait.

**Forbidden Actions:** You are strictly forbidden from altering the subject's facial features, expression, or physical structure. The person must remain 100% recognizable. This is the most important rule.

---

**EXECUTION PROTOCOL (STRICT ORDER)**

**1. Scene Analysis & Preservation:**
-   **Identify and Isolate:** Perfectly identify the human subject and any object they are physically interacting with (e.g., a chair they are sitting on, a table they lean on).
-   **Mandatory Preservation:** These elements (subject, clothing, interactive objects) are designated as the "foreground." They MUST be preserved with full detail and integrity.

**2. Generative Completion & Composition:**
-   **CRITICAL COMPLETION RULE:** Examine the "foreground" elements. If any interactive object (like the chair) is cropped by the original frame, you MUST realistically extend and complete it using generative fill. The completion must be seamless, respecting lighting and perspective. The final image must not have awkwardly cropped furniture.
-   **COMPOSITION RULE:** Analyze the overall composition. If the subject feels cramped by the original framing, intelligently expand the canvas to create a balanced and professional negative space. The final composition must feel intentional, spacious, and uncropped.

**3. Background Sanitization:**
-   **Action:** Completely remove all original background elements and clutter. This includes walls, floors, carpets, and any object NOT identified in Step 1.

**4. Studio Environment Construction:**
-   **Instruction:** \${backgroundInstruction}
-   **Universal Requirement:** The constructed background must be clean, polished, and minimalist.

**5. Master Style Application:**
-   **Instruction:** \${masterStyleInstruction}

**6. Composition & Grounding:**
-   **Action:** Composite the completed "foreground" onto the new studio background.
-   **Shadow Realism:** Generate soft, realistic shadows cast by the subject and their interactive objects onto the new background. This is critical for grounding the scene and creating a believable sense of depth.

**7. Final Image Mastering:**
-   **Tonal Transformation:** Convert the entire composition to black and white.
-   **Fine-Art Enhancement:** Enhance contrast, texture, and clarity. Ensure smooth tonal transitions from the deepest blacks to the most luminous whites.
-   **Skin Retouching:** Remove *only temporary* skin blemishes (e.g., acne). Preserve all natural skin texture and permanent features. The result must look photographic, not plastic.

---

**FINAL QUALITY MANDATE:**
-   **Result:** The final image must be a high-resolution (target 3000px on the longest edge), photorealistic, and impeccably clean studio portrait.
-   **Quality:** Free of digital artifacts, blurriness, or pixelation.
-   **Output Format:** Render a lossless PNG image, preserving the original aspect ratio unless modified by the Composition Rule. Your output MUST be only the final image.
`;

const callGemini = async (prompt: string, base64ImageData: string, mimeType: string): Promise<{ base64: string, mimeType: string }> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    {
                        inlineData: {
                            data: base64ImageData,
                            mimeType: mimeType,
                        },
                    },
                    {
                        text: prompt,
                    },
                ],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        const imagePart = response.candidates?.[0]?.content?.parts?.[0];
        if (imagePart && imagePart.inlineData && imagePart.inlineData.mimeType.startsWith('image/')) {
            return { base64: imagePart.inlineData.data, mimeType: imagePart.inlineData.mimeType };
        }
        
        throw new Error("No image was returned from the AI. The model may not have been able to process this specific image.");

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("Failed to process the image with the AI service. Please check your connection or try a different image.");
    }
}

export const enhancePortrait = async (base64ImageData: string, mimeType: string, masterStyle: string, backgroundStyle: string, detailLevel: number): Promise<{ base64: string, mimeType: string }> => {
    const backgroundInstruction = getBackgroundInstruction(backgroundStyle);
    const masterStyleInstruction = getMasterStyleInstruction(masterStyle, detailLevel);
    
    const populatedPrompt = ENHANCEMENT_PROMPT
        .replace('${backgroundInstruction}', backgroundInstruction)
        .replace('${masterStyleInstruction}', masterStyleInstruction);
    
    return callGemini(populatedPrompt, base64ImageData, mimeType);
};