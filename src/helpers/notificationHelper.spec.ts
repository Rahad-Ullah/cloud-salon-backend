import { describe, expect, it } from 'vitest';
import mongoose from 'mongoose';
import { sendNotifications } from './notificationHelper';
import { Notification } from '../app/modules/notification/notification.model';
import { NotificationType } from '../app/modules/notification/notification.constant';

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
