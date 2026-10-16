import { describe, expect, it, vi, beforeEach } from 'vitest';
import axios from 'axios';
import mongoose from 'mongoose';
import cryptoHelper from '../../src/helpers/cryptoHelper';
import { jwtHelper } from '../../src/helpers/jwtHelper';
import { paginationHelper } from '../../src/helpers/paginationHelper';
import { CurrencyHelper } from '../../src/helpers/currencyHelper';
import { emailHelper } from '../../src/helpers/emailHelper';
import { sendNotifications } from '../../src/helpers/notificationHelper';
import { registerApiRoute } from '../../src/helpers/openapi-helper';
import { Notification } from '../../src/app/modules/notification/notification.model';
import { NotificationType } from '../../src/app/modules/notification/notification.constant';
import { registry } from '../../src/docs/openapi';
import { sendMailSpy } from '../mocks/nodemailer.mock';

describe('Helper Functions Unit Tests', () => {
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

  describe('jwtHelper', () => {
    const testSecret = 'super_secret_test_key_for_jwt_unit_tests';
    const payload = { id: 'user_123', role: 'customer' };

    it('should create and verify a valid JWT token', () => {
      const token = jwtHelper.createToken(payload, testSecret, '1h');
      expect(token).toBeTypeOf('string');

      const decoded = jwtHelper.verifyToken(token, testSecret);
      expect(decoded.id).toBe('user_123');
      expect(decoded.role).toBe('customer');
    });

    it('should throw error when verifying with wrong secret', () => {
      const token = jwtHelper.createToken(payload, testSecret, '1h');
      expect(() => jwtHelper.verifyToken(token, 'wrong_secret')).toThrow();
    });
  });

  describe('paginationHelper', () => {
    it('should provide sensible defaults when options are empty', () => {
      const result = paginationHelper.calculatePagination({});
      expect(result).toEqual({
        page: 1,
        limit: 10,
        skip: 0,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
    });

    it('should correctly calculate skip and pagination for custom values', () => {
      const result = paginationHelper.calculatePagination({
        page: 4,
        limit: 20,
        sortBy: 'price',
        sortOrder: 'asc',
      });

      expect(result).toEqual({
        page: 4,
        limit: 20,
        skip: 60, // (4 - 1) * 20
        sortBy: 'price',
        sortOrder: 'asc',
      });
    });
  });

  describe('CurrencyHelper', () => {
    it('should fetch exchange rate and perform conversion', async () => {
      vi.spyOn(axios, 'get').mockResolvedValueOnce({
        data: {
          base: 'USD',
          rates: { EUR: 0.92, GBP: 0.78 },
        },
      });

      const converted = await CurrencyHelper.convert(100, 'USD', 'EUR');
      expect(converted).toBe(92);
    });

    it('should return null when conversion fails due to network error', async () => {
      vi.spyOn(axios, 'get').mockRejectedValueOnce(new Error('Network error'));

      const result = await CurrencyHelper.convert(100, 'USD', 'JPY');
      expect(result).toBeNull();
    });
  });

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

  describe('notificationHelper', () => {
    it('should save notification to database by default', async () => {
      const receiverId = new mongoose.Types.ObjectId();
      const message = await sendNotifications({
        receiver: receiverId,
        title: 'Account Alert',
        message: 'Your account was updated.',
        type: NotificationType.AccountUpdated,
      });

      expect(message).toBe('Notification sent successfully');

      const saved = await Notification.findOne({ receiver: receiverId });
      expect(saved).not.toBeNull();
      expect(saved?.title).toBe('Account Alert');
    });

    it('should skip DB saving when saveToDB is false', async () => {
      const receiverId = new mongoose.Types.ObjectId();
      const message = await sendNotifications(
        {
          receiver: receiverId,
          title: 'Ephemeral Alert',
          message: 'Real-time only message',
          type: NotificationType.PolicyUpdated,
        },
        { saveToDB: false },
      );

      expect(message).toBe('Notification sent successfully');

      const saved = await Notification.findOne({ receiver: receiverId });
      expect(saved).toBeNull();
    });
  });

  describe('openapi-helper', () => {
    it('should transform Express route params to OpenAPI braces and register path', () => {
      const registerSpy = vi.spyOn(registry, 'registerPath');

      registerApiRoute({
        method: 'get',
        path: '/api/v1/salons/:id/chairs/:chairId',
        summary: 'Get Chair Details',
        isAuth: true,
        roles: ['admin', 'super_admin'],
      });

      expect(registerSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'get',
          path: '/api/v1/salons/{id}/chairs/{chairId}',
          summary: 'Get Chair Details',
          security: [{ bearerAuth: [] }],
        }),
      );
    });
  });
});
