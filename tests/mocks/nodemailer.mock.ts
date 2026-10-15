import { vi } from 'vitest';

export const sendMailSpy = vi.fn().mockResolvedValue({ messageId: 'mock-email-id' });

vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn().mockReturnValue({
      sendMail: sendMailSpy,
      verify: vi.fn().mockResolvedValue(true),
    }),
  },
}));
