import request from 'supertest';
import { describe, expect, it } from 'vitest';
import app from '../../src/app';
import { User } from '../../src/app/modules/user/user.model';
import { Notification } from '../../src/app/modules/notification/notification.model';
import { UserRole, UserStatus } from '../../src/app/modules/user/user.constant';
import { NotificationType } from '../../src/app/modules/notification/notification.constant';
import { createTestToken } from '../helpers/auth.helper';

describe('Notification Module API Endpoints', () => {
  const userData = {
    firstName: 'Nora',
    lastName: 'Notifications',
    email: 'nora.notif@cloudsalon.com',
    password: 'Password123!',
    role: UserRole.Customer,
    isEmailVerified: true,
    status: UserStatus.Active,
  };

  describe('GET /api/v1/notifications/me', () => {
    it('should return 401 when unauthenticated', async () => {
      const res = await request(app).get('/api/v1/notifications/me');

      expect(res.status).toBe(401);
    });

    it('should return paginated notifications and accurate unread count', async () => {
      const user = await User.create(userData);
      const token = createTestToken(UserRole.Customer, user._id.toString(), user.email);

      await Notification.create([
        {
          receiver: user._id,
          title: 'Appointment Confirmed',
          message: 'Your haircut on Saturday is confirmed.',
          type: NotificationType.AccountUpdated,
          isRead: false,
        },
        {
          receiver: user._id,
          title: 'Special Discount',
          message: 'Get 20% off your next session.',
          type: NotificationType.PolicyUpdated,
          isRead: true,
        },
      ]);

      const res = await request(app)
        .get('/api/v1/notifications/me?page=1&limit=10')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Notifications retrieved successfully');
      expect(res.body.data.data.length).toBe(2);
      expect(res.body.data.unreadCount).toBe(1);
      expect(res.body.pagination).toBeDefined();
    });
  });

  describe('PATCH /api/v1/notifications/:id/read', () => {
    it('should mark single notification as read', async () => {
      const user = await User.create(userData);
      const token = createTestToken(UserRole.Customer, user._id.toString(), user.email);

      const notif = await Notification.create({
        receiver: user._id,
        title: 'New Message',
        message: 'You have a message from your stylist.',
        type: NotificationType.AccountUpdated,
        isRead: false,
      });

      const res = await request(app)
        .patch(`/api/v1/notifications/${notif._id}/read`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Notification read successfully');
      expect(res.body.data.isRead).toBe(true);

      const updatedNotif = await Notification.findById(notif._id);
      expect(updatedNotif?.isRead).toBe(true);
    });
  });

  describe('PATCH /api/v1/notifications/read-all', () => {
    it('should mark all unread notifications as read for authenticated user', async () => {
      const user = await User.create(userData);
      const token = createTestToken(UserRole.Customer, user._id.toString(), user.email);

      await Notification.create([
        {
          receiver: user._id,
          title: 'Reminder 1',
          message: 'Upcoming booking 1',
          type: NotificationType.AccountUpdated,
          isRead: false,
        },
        {
          receiver: user._id,
          title: 'Reminder 2',
          message: 'Upcoming booking 2',
          type: NotificationType.PolicyUpdated,
          isRead: false,
        },
      ]);

      const res = await request(app)
        .patch('/api/v1/notifications/read-all')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('All notifications read successfully');

      // Verify all unread notifications for this user are now isRead: true
      const remainingUnread = await Notification.countDocuments({
        receiver: user._id,
        isRead: false,
      });
      expect(remainingUnread).toBe(0);
    });
  });
});
