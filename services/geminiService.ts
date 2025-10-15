import { GoogleGenAI, Modality } from "@google/genai";

// Ensure the API key is available from environment variables.
const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  // This will be caught by the framework and shown to the user.
  throw new Error("API_KEY environment variable not set. Please configure it to use the AI features.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const getBackgroundInstruction = (style: string): string => {
    if (style.startsWith('#')) {
        return `**Critically, you must replace or transmute the existing background into a sophisticated studio environment with a solid, clean tone matching this color: ${style}.** The new environment must feel intentional, luxurious, and perfectly integrated with the subject's lighting. It should have a sense of depth, not just be a flat color.`;
    }

    switch (style) {
        case 'plain-light':
            return `**Critically, you must replace or transmute the existing background into a flawless, high-end, professional studio white seamless backdrop, fit for a celebrity portrait (e.g., Denzel Washington by a master photographer).** The background should be perfectly and luminously lit, appearing as a clean, dimensional white or very light gray. Avoid a flat, digital #FFFFFF look. Instead, create a subtle, photographic gradient that suggests depth and a professional studio environment. If appropriate, add a soft, realistic floor shadow to ground the subject naturally. The final effect must be luxurious, clean, and supremely professional.`;
        case 'plain-dark':
             return `**Critically, you must replace or transmute the existing background into a sophisticated studio environment with a solid, plain dark charcoal or black backdrop.** The new environment must feel intentional, luxurious, and perfectly integrated with the subject's lighting, creating a dramatic and focused portrait look.`;
        case 'subtle-gradient':
            return `**Critically, you must replace or transmute the existing background into a sophisticated studio environment with a subtle, non-distracting gray or charcoal gradient.** The new environment must feel intentional, luxurious, and perfectly integrated with the subject's lighting.`;
        case 'textured-canvas':
            return `**Critically, you must replace or transmute the existing background into a sophisticated studio environment with a textured canvas backdrop, similar to those used in classical painting or high-end photography.** The texture should be subtle and elegant. The new environment must feel intentional, luxurious, and perfectly integrated with the subject's lighting.`;
        case 'deep-void':
            return `**Critically, you must replace or transmute the existing background into a sophisticated studio environment consisting of a deep, dark charcoal or black void. Use gentle separation lighting to ensure the subject stands out beautifully.** The new environment must feel intentional, luxurious, and perfectly integrated with the subject's lighting.`;
        case 'ai-choice':
        default:
             return `**Critically, you must replace or transmute the existing background into a rich and sophisticated studio environment.** Do not simply make it a flat color. Create a believable, high-end setting, such as a textured canvas backdrop, a subtly lit mottled gray wall, or a deep charcoal void with gentle separation lighting. The new environment must feel intentional, luxurious, and perfectly integrated with the subject's lighting.`;
    }
};

const getDetailInstruction = (level: number): string => {
    if (level <= 10) {
        return "Preserve the original texture level, focusing only on lighting and tone. Do not add artificial sharpness.";
    }
    if (level <= 40) { // Default range
        return "Subtly enhance the clarity of fine details like skin pores, fabric weaves, and hair strands. The effect must be natural and almost unnoticeable, enhancing realism without appearing processed.";
    }
    if (level <= 75) {
        return "Moderately increase the sharpness and clarity of fine textures. Aim for a crisp, high-fidelity look that highlights details like hair, irises, and clothing weave, while ensuring the result remains natural and not artificial.";
    }
    return "Significantly sharpen fine details for a hyper-realistic, high-impact effect. This is for a highly stylized, commercial look. Focus on maximizing texture in key areas but be very careful to avoid over-processing and digital artifacts.";
};

const getMasterStyleInstruction = (style: string): string => {
    switch (style) {
        case 'richard-avedon':
            return "Emulate the iconic style of Richard Avedon. This means high-contrast, high-key lighting that sculpts the subject against a stark, minimalist background (usually white or light gray). The portrait must be sharp, direct, and psychologically penetrating. The focus is entirely on the subject's character and expression.";
        case 'diane-arbus':
            return "Emulate the unique style of Diane Arbus. The composition should be direct, centered, and confrontational. Use lighting that mimics a direct, on-camera flash, creating distinct shadows and highlighting textures with raw clarity. The mood is about capturing an authentic, unflinching moment, preserving every unique detail of the subject.";
        case 'ansel-adams-zone':
            return "Apply the principles of Ansel Adams' Zone System to this portrait. The primary goal is achieving the maximum possible tonal range. Render the deepest, richest blacks without crushing detail, and the most luminous whites that still retain texture. Every mid-tone should be distinct and clear. The final image must possess breathtaking depth and clarity.";
        case 'sebastiao-salgado':
            return "Emulate the grand, epic style of Sebastião Salgado. The image must have a deep, dramatic tonal range with high contrast. Introduce a subtle, fine grain structure reminiscent of classic silver halide film. The lighting should be powerful and sculptural, and the overall mood must convey a sense of profound dignity and weight.";
        case 'peter-lindbergh':
            return "Emulate the cinematic, narrative style of Peter Lindbergh. The portrait should feel like a frame from a black and white film. Use soft, naturalistic lighting that beautifully models the subject without being harsh. The mood should be soulful, authentic, and emotionally resonant. Avoid overly sharp, digital-looking retouching; instead, preserve natural skin texture for a feeling of honest beauty. The focus is on storytelling and capturing the subject's inner life.";
        case 'default-maestro':
        default:
            return "As the Monochrome Maestro, your default style is one of timeless, cinematic elegance. Create a sophisticated, high-end studio look with masterful lighting and subtle retouching. The goal is a clean, classic, 'old-money' aesthetic.";
    }
};

const ENHANCEMENT_PROMPT = `You are a world-renowned digital artist and AI art director, specializing in high-fashion and fine-art portraiture, functioning as the 'gemini-2.5-flash-image' model. Your task is to analyze an uploaded portrait and transform it into a luxurious, fine-art black-and-white studio photograph, guided by a specific artistic style.

**MASTER ARTISTIC STYLE:**
\${masterStyleInstruction}

**NON-NEGOTIABLE CORE RULES: ABSOLUTE PRESERVATION OF THE SUBJECT'S IDENTITY**
-   **Facial and Body Structure:** You are **strictly forbidden** from altering the subject's core facial features (nose, eyes, mouth shape, jawline), body shape, or any permanent characteristic. Do not slim, reshape, or modify the person's fundamental appearance. The subject's identity must remain 100% intact. This is your most critical instruction. Any change to the person's structure is a failure.
-   **Expression and Character:** The subject's original expression is sacrosanct. You are **strictly forbidden** from altering their expression—do not add a smile, a frown, or any other emotional nuance that was not present in the original photograph. Unique features (including character-defining lines or wrinkles) must be perfectly preserved.

Your goal is to elevate the image into a timeless masterpiece by enhancing the lighting, environment, and surface textures **AROUND** the subject, while leaving the subject themselves fundamentally unchanged.

**KEY TRANSFORMATION STEPS:**

1.  **Analyze & Re-Light:** Based on the chosen artistic style, identify the original lighting and rebuild the light and shadow balance to achieve the desired mood and contrast—be it the starkness of Avedon or the tonal range of Adams.
2.  **Studio Environment Transformation:** \${backgroundInstruction} This background must complement the chosen artistic style.
3.  **Professional Subject Retouching (Surface-Level Only):**
    *   **Skin:** Perform meticulous, professional skin retouching to achieve a **high-end, smooth texture** that is the hallmark of master photographers. The goal is flawless, luminous skin that still looks completely real.
        *   **Blemish Removal:** Your primary task here is the intelligent and complete removal of *temporary* skin imperfections. This includes acne, pimples, minor shaving cuts, temporary redness, and small insect bites. The texture, tone, and luminosity of the corrected area must blend seamlessly with the surrounding skin, creating a smooth surface.
        *   **Preservation of Permanent Features:** It is absolutely critical that you **do not** remove permanent or defining characteristics. This includes moles, beauty marks, freckles, birthmarks, and established scars. These are part of the subject's identity and must be preserved. Mistaking a beauty mark for a blemish is a critical failure.
        *   **Texture & Tonality:** The key to a smooth look is perfecting the *tonal transitions* on the skin. Emulate a frequency separation technique to even out blotchiness and create creamy, smooth gradations of light and shadow. While you are smoothing tones, you must **preserve a believable, high-fidelity micro-texture.** Pores and fine, natural skin patterns are essential for realism. The final result must be flawlessly smooth but authentically human skin, completely free of any "plastic," "waxy," or "overly blurred" appearance. The goal is skin that looks healthy and professionally photographed for a luxury magazine, not artificially perfected.
    *   **Eyes:** Enhance the eyes with utmost subtlety. Gently brighten the iris to bring out detail, sharpen existing catchlights to add life, and naturally clean up the sclera (whites of the eyes). The effect must be imperceptible to the untrained eye.
    *   **Hair:** Meticulously retouch the hair. Tame distracting flyaway strands, add subtle volume and shine, and enhance its texture and flow, ensuring it contributes to the overall polished, high-class look. Ensure individual strands are visible where appropriate for a realistic, non-'helmeted' effect.
    *   **Details & Texture:** \${detailInstruction} Also enhance the texture and detail in clothing and jewelry to match this level, rendering folds and reflections with authenticity.
4.  **Sculpting with Light:** Apply masterful **global and micro dodge-and-burn** techniques to sculpt and add depth. Enhance the dimensionality of the *existing* facial planes like eyes, cheekbones, and the jawline without changing their shape.
5.  **Tonal Mastery:** Create a rich, full tonal range with deep, detailed shadows and luminous, textured highlights. Avoid clipped blacks or blown-out whites. The final grayscale conversion should feel intentional and artful, not like a simple desaturation. Every grayscale value must feel cohesive, elegant, and part of the chosen artistic vision.

**ARTISTIC INTENT & QUALITY CHECK:**
*   The final image must exude the prestige and aesthetic of the chosen master photographer or the default high-end editorial style.
*   The final product should be indistinguishable from a portrait featured in **Vogue, Vanity Fair, or a SoHo art gallery.**
*   **What to Avoid:** Absolutely no plastic-looking skin, digital artifacts, over-sharpening halos, unnatural 'airbrushed' smoothness, or distorted proportions. The result must look like a real photograph from a high-end camera, not a digital painting.

**CRITICAL OUTPUT INSTRUCTION:**
Your output **MUST** be the final processed image and **ONLY** the image. Do not include any text, descriptions, explanations, or any other content in your response.
`;

const callGemini = async (prompt: string, base64ImageData: string, mimeType: string) => {
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
            return imagePart.inlineData.data;
        }
        
        throw new Error("No image was returned from the AI. The model may not have been able to process this specific image.");

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("Failed to process the image with the AI service. Please check your connection or try a different image.");
    }
}

export const enhancePortrait = async (base64ImageData: string, mimeType: string, backgroundStyle: string, detailLevel: number, masterStyle: string): Promise<string> => {
    const backgroundInstruction = getBackgroundInstruction(backgroundStyle);
    const detailInstruction = getDetailInstruction(detailLevel);
    const masterStyleInstruction = getMasterStyleInstruction(masterStyle);
    const populatedPrompt = ENHANCEMENT_PROMPT
        .replace('${masterStyleInstruction}', masterStyleInstruction)
        .replace('${backgroundInstruction}', backgroundInstruction)
        .replace('${detailInstruction}', detailInstruction);
    
    return callGemini(populatedPrompt, base64ImageData, mimeType);
};
