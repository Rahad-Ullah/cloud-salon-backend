import { describe, expect, it } from 'vitest';
import mongoose, { Schema, model } from 'mongoose';
import pick from '../../src/shared/pick';
import { getSingleFilePath, getMultipleFilesPath } from '../../src/shared/getFilePath';
import { objectId } from '../../src/shared/objectIdValidator';
import deleteS3File from '../../src/shared/deleteS3File';
import { emailTemplate } from '../../src/shared/emailTemplate';
import { autoIncrementPlugin } from '../../src/DB/autoIncrementPlugin';
import { s3SendSpy } from '../mocks/s3.mock';

describe('Shared Utilities and Plugins Unit Tests', () => {
  describe('pick', () => {
    it('should pick only specified keys from an object', () => {
      const source = {
        name: 'Cloud Salon',
        city: 'New York',
        rating: 4.8,
        active: true,
      };

      const picked = pick(source, ['name', 'rating']);
      expect(picked).toEqual({ name: 'Cloud Salon', rating: 4.8 });
    });

    it('should ignore keys that do not exist on the source object', () => {
      const source = { name: 'Salon' };
      // @ts-ignore
      const picked = pick(source, ['name', 'nonExistent']);
      expect(picked).toEqual({ name: 'Salon' });
    });
  });

  describe('getFilePath', () => {
    it('should extract single file path or location', () => {
      const filesWithLocation = {
        image: [{ location: 'https://cdn.cloudsalon.com/img1.png' }],
      };
      expect(getSingleFilePath(filesWithLocation, 'image')).toBe(
        'https://cdn.cloudsalon.com/img1.png',
      );

      const filesWithPath = {
        doc: [{ path: '/uploads/contract.pdf' }],
      };
      expect(getSingleFilePath(filesWithPath, 'doc')).toBe('/uploads/contract.pdf');
    });

    it('should return undefined if files object or folder is empty/missing', () => {
      expect(getSingleFilePath(null, 'image')).toBeUndefined();
      expect(getSingleFilePath({}, 'image')).toBeUndefined();
      expect(getSingleFilePath({ image: [] }, 'image')).toBeUndefined();
    });

    it('should extract array of file paths using getMultipleFilesPath', () => {
      const files = {
        image: [
          { location: 'https://cdn.cloudsalon.com/img1.png' },
          { location: 'https://cdn.cloudsalon.com/img2.png' },
        ],
      };

      const paths = getMultipleFilesPath(files, 'image');
      expect(paths).toEqual([
        'https://cdn.cloudsalon.com/img1.png',
        'https://cdn.cloudsalon.com/img2.png',
      ]);
    });
  });

  describe('objectIdValidator', () => {
    const validator = objectId('Salon ID');

    it('should pass on valid 24-character hexadecimal ObjectId', () => {
      const validId = new mongoose.Types.ObjectId().toString();
      const result = validator.safeParse(validId);
      expect(result.success).toBe(true);
    });

    it('should fail with descriptive error message on invalid ObjectId', () => {
      const result = validator.safeParse('12345-invalid');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('must be a valid object id');
      }
    });
  });

  describe('deleteS3File', () => {
    it('should extract s3 key from full URL and invoke s3Client.send', async () => {
      s3SendSpy.mockClear();

      const fullUrl = 'https://media.cloudsalon.com/image/salon-cover-1234.png';
      await deleteS3File(fullUrl);

      expect(s3SendSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle relative s3 key directly without errors', async () => {
      s3SendSpy.mockClear();

      await deleteS3File('image/direct-key.png');
      expect(s3SendSpy).toHaveBeenCalledTimes(1);
    });

    it('should do nothing gracefully if file identifier is empty', async () => {
      s3SendSpy.mockClear();

      await deleteS3File('');
      expect(s3SendSpy).not.toHaveBeenCalled();
    });
  });

  describe('emailTemplate', () => {
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
        gatewayName: 'Stripe',
        currentBalance: 50,
        requiredBalance: 200,
        currency: 'USD',
      });

      expect(email.subject).toContain('Low Balance Warning');
      expect(email.html).toContain('Stripe');
      expect(email.html).toContain('-150'); // Shortfall = 200 - 50 = 150
    });
  });

  describe('autoIncrementPlugin', () => {
    interface ITestDoc {
      uid?: string;
      name: string;
    }

    const testSchema = new Schema<ITestDoc>({
      uid: { type: String, unique: true },
      name: { type: String, required: true },
    });

    testSchema.plugin(autoIncrementPlugin, {
      incField: 'uid',
      prefix: 'TEST',
      counterId: 'test_counter_id',
      padLength: 4,
    });

    const TestModel = model<ITestDoc>('AutoIncrementTest', testSchema);

    it('should automatically assign incremented sequential formatted UIDs on document creation', async () => {
      const doc1 = await TestModel.create({ name: 'First Item' });
      expect(doc1.uid).toBe('TEST-0001');

      const doc2 = await TestModel.create({ name: 'Second Item' });
      expect(doc2.uid).toBe('TEST-0002');
    });
  });
});
