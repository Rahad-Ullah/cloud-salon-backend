import { describe, expect, it } from 'vitest';
import cryptoHelper from './cryptoHelper';

describe('cryptoHelper', () => {
  it('should encrypt and decrypt a plaintext string accurately', () => {
    const originalText = 'Sensitive Salon Bank Account Info 12345';
    const encrypted = cryptoHelper.encrypt(originalText);

    expect(encrypted).toBeTypeOf('string');
    expect(encrypted.split(':')).toHaveLength(3);

    const decrypted = cryptoHelper.decrypt(encrypted);
    expect(decrypted).toBe(originalText);
  });

  it('should fail decryption if ciphertext or auth tag is corrupted', () => {
    const originalText = 'Secret Message';
    const encrypted = cryptoHelper.encrypt(originalText);
    const parts = encrypted.split(':');

    // Tamper with ciphertext
    parts[2] = 'abcd' + parts[2].slice(4);
    const tampered = parts.join(':');

    expect(() => cryptoHelper.decrypt(tampered)).toThrow();
  });
});
