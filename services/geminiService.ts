import { GoogleGenAI, Modality } from "@google/genai";

// Ensure the API key is available from environment variables.
const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  // This will be caught by the framework and shown to the user.
  throw new Error("API_KEY environment variable not set. Please configure it to use the AI features.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const getBackgroundInstruction = (style: string): string => {
    const preservationRule = `**Constraint:** If the subject is sitting on, leaning against, or directly interacting with any furniture or object (e.g., a chair, stool, table, wall), you MUST preserve that object. It is considered part of the foreground. Seamlessly integrate this object into the new studio environment.`;
    let instruction = '';

    if (style.startsWith('#')) {
        instruction = `**Background:** Transmute the background into a sophisticated studio environment with a solid, clean tone matching this color: ${style}. The new environment must feel intentional, luxurious, and perfectly integrated with the subject's lighting. It should have a sense of depth, not just be a flat color.`;
    } else {
        switch (style) {
            case 'plain-light':
                instruction = `**Background:** Transmute the background into a flawless, high-end, professional studio white seamless backdrop. The background should be perfectly and luminously lit, appearing as a clean, dimensional white or very light gray. Avoid a flat, digital #FFFFFF look. Instead, create a subtle, photographic gradient that suggests depth and a professional studio environment. If appropriate, add a soft, realistic floor shadow to ground the subject naturally.`;
                break;
            case 'plain-dark':
                 instruction = `**Background:** Transmute the background into a sophisticated studio environment with a solid, plain dark charcoal or black backdrop. The new environment must feel intentional, luxurious, and perfectly integrated with the subject's lighting.`;
                 break;
            case 'subtle-gradient':
                instruction = `**Background:** Transmute the background into a sophisticated studio environment with a subtle, non-distracting gray or charcoal gradient. The new environment must feel intentional and perfectly integrated with the subject's lighting.`;
                break;
            case 'textured-canvas':
                instruction = `**Background:** Transmute the background into a sophisticated studio environment with a textured canvas backdrop, similar to those used in classical painting or high-end photography. The texture should be subtle and elegant.`;
                break;
            case 'deep-void':
                instruction = `**Background:** Transmute the background into a sophisticated studio environment consisting of a deep, dark charcoal or black void. Use gentle separation lighting to ensure the subject stands out beautifully.`;
                break;
            case 'ai-choice':
            default:
                 instruction = `**Background:** Transmute the background into a rich and sophisticated studio environment. Create a believable, high-end setting, such as a textured canvas backdrop, a subtly lit mottled gray wall, or a deep charcoal void with gentle separation lighting.`;
                 break;
        }
    }
    return `${preservationRule}\n${instruction}`;
};

const getDetailInstruction = (level: number): string => {
    if (level <= 10) {
        return "**Detail & Texture:** Preserve the original texture level, focusing only on lighting and tone. Do not add artificial sharpness.";
    }
    if (level <= 40) { // Default range
        return "**Detail & Texture:** Subtly enhance the clarity of fine details like fabric weaves and hair strands. The effect must be natural and almost unnoticeable, enhancing realism without appearing processed.";
    }
    if (level <= 75) {
        return "**Detail & Texture:** Moderately increase the sharpness and clarity of fine textures. Aim for a crisp, high-fidelity look that highlights details like hair, irises, and clothing weave, while ensuring the result remains natural and not artificial.";
    }
    return "**Detail & Texture:** Significantly sharpen fine details for a hyper-realistic, high-impact effect. This is for a highly stylized, commercial look. Focus on maximizing texture in key areas but be very careful to avoid over-processing and digital artifacts.";
};

const getMasterStyleInstruction = (style: string): string => {
    switch (style) {
        case 'richard-avedon':
            return "**Lighting & Tone Style:** Apply a high-contrast, high-key lighting scheme. The key light must be hard and direct, creating strong highlights and deep shadows to sculpt the face. Ensure the background is a stark, clean white or light gray. The final image must be sharp and impactful.";
        case 'diane-arbus':
            return "**Lighting & Tone Style:** Re-light the subject to mimic a direct, on-camera flash. This should create distinct, hard-edged shadows and highlight textures with raw clarity. The composition must remain centered and direct. The mood is unflinching and authentic.";
        case 'ansel-adams-zone':
            return "**Lighting & Tone Style:** Apply the principles of the Zone System to achieve the maximum possible tonal range. Render the deepest, richest blacks without crushing detail, and the most luminous whites that still retain texture. Every mid-tone should be distinct, clear, and perfectly placed.";
        case 'sebastiao-salgado':
            return "**Lighting & Tone Style:** Create a deep, dramatic tonal range with high contrast and rich blacks. Introduce a subtle, fine grain structure reminiscent of classic silver halide film. The lighting should be powerful and sculptural, conveying a sense of profound dignity.";
        case 'peter-lindbergh':
            return "**Lighting & Tone Style:** Apply soft, beautiful, naturalistic lighting that models the subject without being harsh. The tonal curve should be gentle, with an emphasis on soulful mid-tones. The mood should be authentic and emotionally resonant, like a frame from a classic black and white film.";
        case 'default-maestro':
        default:
            return "**Lighting & Tone Style:** Apply masterful, sophisticated studio lighting. The goal is a clean, classic, elegant look with a beautiful tonal range and subtle, flattering contrast. The lighting should be intentional and controlled, creating a timeless, cinematic feel.";
    }
};

const ENHANCEMENT_PROMPT = `
**FORBIDDEN ACTIONS (NON-NEGOTIABLE)**
Violation of these rules is a complete task failure. This section overrides all other instructions.
-   **DO NOT ALTER FACIAL STRUCTURE:** The shape of the nose, eyes, mouth, lips, jawline, chin, forehead, and overall face MUST remain 100% identical to the original.
-   **DO NOT ALTER FACIAL EXPRESSION:** The subject's original expression is sacrosanct. DO NOT add a smile, frown, or any emotion not present in the original.
-   **DO NOT REMOVE PERMANENT IDENTITY MARKERS:** Moles, beauty marks, freckles, and established scars MUST be preserved.
-   **DO NOT "BEAUTIFY" OR "IDEALIZE":** Do not conform the face to any idealized beauty standard. Your task is to light the original face, not create a new one.

---

You are a world-class digital photo retoucher and AI art director, operating the 'gemini-2.5-flash-image' model. Your task is to perform a non-destructive, fine-art black and white conversion on the provided portrait by applying specific photographic techniques. You must adhere strictly to the Forbidden Actions listed above.

**PHOTOGRAPHIC EXECUTION PLAN:**

1.  **Lighting and Tone Application:** First, apply the following lighting and tonal instructions. This is your primary creative task, but it must be executed without violating the Forbidden Actions.
    \${masterStyleInstruction}

2.  **Skin Retouching (Tonal Only):**
    *   **Philosophy:** Your goal is to perfect skin *tone*, not texture.
    *   **Action:** Meticulously remove *only temporary* imperfections like acne or redness.
    *   **Constraint:** The original skin texture (pores, fine lines) MUST be 100% preserved. Correct the area by perfectly inheriting the texture and tone of the surrounding skin. The result must not look blurred, plastic, or artificial.

3.  **Background Transformation:**
    \${backgroundInstruction}

4.  **Detail and Texture Enhancement:**
    \${detailInstruction}

5.  **Final Polish:**
    *   **Eyes:** Enhance with extreme subtlety. Gently brighten the iris, sharpen existing catchlights. Do not change eye shape or color.
    *   **Hair:** Meticulously retouch distracting flyaways. Add subtle volume and shine where appropriate.
    *   **Global Adjustments:** Apply masterful **global dodge-and-burn** only to enhance the dimensionality of the *existing* facial planes. Do not use it to reshape the face.

**QUALITY CHECK:**
*   **Photorealism Mandate:** The final output must be indistinguishable from a high-resolution photograph taken with professional camera equipment (e.g., a Phase One or Hasselblad medium format camera). It must exhibit a high degree of acutance, fine detail, and subtle, realistic grain if the style calls for it.
*   **Artifact Prohibition:** Aggressively avoid all common digital artifacts. This includes, but is not limited to: plastic-looking skin, overly smooth or waxy textures, strange "airbrushed" effects, pixelation, banding in gradients, and unnatural sharpening halos.
*   **Identity Preservation:** The final image must be instantly and unquestionably recognizable as the same person with the exact same expression as the original. This is a paramount rule.

**CRITICAL OUTPUT INSTRUCTION:**
Your output **MUST** be the final processed image and **ONLY** the image. Render the image at an extremely high resolution, suitable for a large-format gallery print (e.g., at least 2048px on its longest side, preserving the original aspect ratio). The output format **MUST** be a lossless PNG to ensure maximum fidelity and zero compression artifacts.
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

export const enhancePortrait = async (base64ImageData: string, mimeType: string, backgroundStyle: string, detailLevel: number, masterStyle: string): Promise<{ base64: string, mimeType: string }> => {
    const backgroundInstruction = getBackgroundInstruction(backgroundStyle);
    const detailInstruction = getDetailInstruction(detailLevel);
    const masterStyleInstruction = getMasterStyleInstruction(masterStyle);
    const populatedPrompt = ENHANCEMENT_PROMPT
        .replace('${masterStyleInstruction}', masterStyleInstruction)
        .replace('${backgroundInstruction}', backgroundInstruction)
        .replace('${detailInstruction}', detailInstruction);
    
    return callGemini(populatedPrompt, base64ImageData, mimeType);
};