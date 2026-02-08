
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, BiometricProfile } from "../types";

// Always use const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Analyzes an image for specific biometric features using Gemini.
 */
export async function analyzeBiometrics(imagePart: { inlineData: { data: string, mimeType: string } }): Promise<AnalysisResult> {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        imagePart,
        { text: "Analyze the biometric features in this image. Focus on face shape, eye/iris patterns, ear structure, and eye spacing. Be specific and technical in your description." }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          face: { type: Type.STRING, description: "Detailed description of facial structure, bone shape, and defining marks." },
          iris: { type: Type.STRING, description: "Detailed description of iris patterns, colors, and unique textures." },
          ears: { type: Type.STRING, description: "Description of ear structure, helix shape, and lobe type." },
          eyes: { type: Type.STRING, description: "Measurement of spacing, shape, and lid characteristics." }
        },
        required: ["face", "iris", "ears", "eyes"]
      }
    }
  });

  return JSON.parse(response.text || '{}');
}

/**
 * Compares a live image against the stored database of profiles.
 */
export async function identifyBiometrics(
  imagePart: { inlineData: { data: string, mimeType: string } },
  profiles: BiometricProfile[]
): Promise<{ profileId: string | null; confidence: number; reason: string }> {
  if (profiles.length === 0) {
    return { profileId: null, confidence: 0, reason: "No profiles in database." };
  }

  // We provide a summary of the database to Gemini for comparison.
  const profileContext = profiles.map(p => ({
    id: p.id,
    name: p.fullName,
    biometrics: `Face: ${p.facialDescription}, Iris: ${p.irisPattern}, Ears: ${p.earStructure}, Eyes: ${p.eyeSpacing}`
  }));

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        imagePart,
        { text: `Compare this image against the following biometric profiles: ${JSON.stringify(profileContext)}. If there is a match with high confidence (above 85%), return the profileId. If not, return null.` }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          profileId: { type: Type.STRING, nullable: true, description: "The matching profile ID or null" },
          confidence: { type: Type.NUMBER, description: "Matching confidence 0-100" },
          reason: { type: Type.STRING, description: "Explanation of why this match was made or rejected" }
        },
        required: ["profileId", "confidence", "reason"]
      }
    }
  });

  return JSON.parse(response.text || '{}');
}
