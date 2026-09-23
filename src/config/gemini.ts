import { GoogleGenAI } from '@google/genai';
import config from '.';

if (config.gemini.apiKey === undefined) {
  throw new Error('Missing GEMINI_API_KEY environment variable.');
}

export const gemini = new GoogleGenAI({
  apiKey: config.gemini.apiKey,
});
