import { z } from 'zod';
import { objectId } from '../../../shared/objectIdValidator';
import { query } from 'express';

const readNotificationSchema = z.object({
  params: z.object({
    id: objectId('Notification id'),
  }),
});

// get my notifications
const getMyNotificationsSchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});

export const NotificationValidation = {
  readNotificationSchema,
  getMyNotificationsSchema,
};
