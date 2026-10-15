import { vi } from 'vitest';

export const geminiMock = {
  models: {
    generateContent: vi.fn().mockResolvedValue({
      text: vi.fn().mockReturnValue('Mocked Gemini AI response'),
    }),
  },
};

export class MockGoogleGenAI {
  models = geminiMock.models;
}

vi.mock('../../src/config/gemini', () => ({
  gemini: geminiMock,
}));

vi.mock('@google/genai', () => ({
  GoogleGenAI: MockGoogleGenAI,
}));
