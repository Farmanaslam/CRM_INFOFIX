import { GoogleGenAI } from "@google/genai";

export const generateAIResponse = async (
  prompt: string,
  context?: string,
): Promise<string> => {
  // Always use a new instance with direct access to process.env.API_KEY right before making the call
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

  try {
    const fullPrompt = `
    You are a helpful AI assistant embedded within a web application.
    
    Context about the current application state:
    ${context || "No specific context provided."}

    User Query: ${prompt}

    Keep your answer concise and helpful.
    `;

    // Updated model to gemini-3-flash-preview as recommended for basic text tasks
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: fullPrompt,
    });

    // Directly access .text property from GenerateContentResponse
    return response.text || "I couldn't generate a response at this time.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I encountered an error while processing your request.";
  }
};
