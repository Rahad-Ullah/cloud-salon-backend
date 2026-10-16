import { describe, expect, it } from 'vitest';
import { emailTemplate } from './emailTemplate';

describe('emailTemplate Shared Utility', () => {
  it('should generate createAccount verification email with OTP', () => {
    const email = emailTemplate.createAccount({
      name: 'Jane Doe',
      email: 'jane@example.com',
      otp: 5432,
    });

    expect(email.to).toBe('jane@example.com');
    expect(email.subject).toBe('Verify your account');
    expect(email.html).toContain('5432');
  });

  it('should generate resetPassword email with OTP', () => {
    const email = emailTemplate.resetPassword({
      name: 'Jane Doe',
      email: 'jane@example.com',
      otp: 9876,
    });

    expect(email.to).toBe('jane@example.com');
    expect(email.subject).toBe('Reset your password');
    expect(email.html).toContain('9876');
  });

  it('should generate lowBalanceWarning email with gateway details and shortfall calculation', () => {
    const email = emailTemplate.lowBalanceWarning({
      adminEmail: 'admin@example.com',
      gatewayName: 'Stripe',
      currentBalance: 50,
      requiredBalance: 200,
      currency: 'USD',
    });

    expect(email.to).toBe('admin@example.com');
    expect(email.subject).toContain('Low Balance Warning');
    expect(email.html).toContain('Stripe');
    expect(email.html).toContain('-150'); // Shortfall = 200 - 50 = 150
  });
});
