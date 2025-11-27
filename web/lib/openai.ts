
import { OpenAI } from 'openai';

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is not set in the .env file.");
}
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const parseJsonResponse = <T>(content: string | null): T | null => {
  if (!content) return null;
  try {
    const jsonString = content.replace(/```json\n|```/g, '').trim();
    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.error('Failed to parse JSON from OpenAI response:', content);
    const match = content.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]) as T;
      } catch (e) {
        console.error('Fallback JSON parsing also failed.');
        return null;
      }
    }
    return null;
  }
};
