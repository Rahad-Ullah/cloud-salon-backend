import { describe, expect, it, vi } from 'vitest';

const { sendMailSpy } = vi.hoisted(() => ({
  sendMailSpy: vi.fn().mockResolvedValue({ messageId: 'mock-email-id' }),
}));

vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn().mockReturnValue({
      sendMail: sendMailSpy,
      verify: vi.fn().mockResolvedValue(true),
    }),
  },
}));

import { emailHelper } from './emailHelper';

describe('emailHelper', () => {
  it('should call nodemailer transporter sendMail with formatted parameters', async () => {
    await emailHelper.sendEmail({
      to: 'client@example.com',
      subject: 'Appointment Confirmed',
      html: '<p>Your appointment is set.</p>',
    });

    expect(sendMailSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'client@example.com',
        subject: 'Appointment Confirmed',
        html: '<p>Your appointment is set.</p>',
      }),
    );
  });
});
