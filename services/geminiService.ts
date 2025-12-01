import { GoogleGenAI, Type } from "@google/genai";
import { QuizQuestion, LearningContent } from "../types";

const apiKey = process.env.API_KEY;

if (!apiKey) {
  console.error("API_KEY is not set in the environment variables.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || 'DUMMY_KEY_FOR_BUILD' });

const MODEL_NAME = "gemini-2.5-flash";

/**
 * Generates structured learning content for a given topic.
 */
export const generateLearningContent = async (topic: string): Promise<LearningContent> => {
  const prompt = `
    Create a comprehensive study guide for the topic: "${topic}".
    The target audience is a student wanting to learn effectively.
    
    Structure the response in JSON format strictly following this schema:
    {
      "title": "A catchy title for the lesson",
      "summary": "A brief 2-3 sentence overview",
      "sections": [
        {
          "heading": "Section Title (e.g., Introduction, Key Concepts, History, Applications)",
          "content": "Detailed explanation of this section."
        }
      ]
    }
    Generate at least 4 detailed sections.
  `;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          summary: { type: Type.STRING },
          sections: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                heading: { type: Type.STRING },
                content: { type: Type.STRING },
              },
              required: ["heading", "content"],
            },
          },
        },
        required: ["title", "summary", "sections"],
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error("No content generated");
  return JSON.parse(text) as LearningContent;
};

/**
 * Generates a quiz based on the topic.
 */
export const generateQuiz = async (topic: string): Promise<QuizQuestion[]> => {
  const prompt = `Generate a multiple-choice quiz about "${topic}". Create 5 challenging but fair questions.`;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            options: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Array of 4 possible answers",
            },
            correctAnswerIndex: {
              type: Type.INTEGER,
              description: "Index (0-3) of the correct answer in the options array",
            },
            explanation: {
              type: Type.STRING,
              description: "Brief explanation of why the answer is correct",
            },
          },
          required: ["question", "options", "correctAnswerIndex", "explanation"],
        },
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error("No quiz generated");
  return JSON.parse(text) as QuizQuestion[];
};

/**
 * Chat functionality instance generator.
 * This returns a new chat session.
 */
export const createChatSession = (topic: string) => {
  return ai.chats.create({
    model: MODEL_NAME,
    config: {
      systemInstruction: `You are a helpful and encouraging AI tutor specialized in "${topic}". Keep answers concise but informative. If the user asks about something unrelated, politely guide them back to ${topic}.`,
    },
  });
};
