import { registerApiRoute } from '../../../helpers/openapi-helper';
import { NotificationValidation } from './notification.validation';

export function registerNotificationDocs() {
  const registerNotification = (
    opts: Parameters<typeof registerApiRoute>[0],
  ) => {
    registerApiRoute({ tags: ['Notification'], ...opts });
  };

  // get my notifications
  registerNotification({
    method: 'get',
    path: '/notifications/me',
    summary: 'Get my notifications',
    query: NotificationValidation.getMyNotificationsSchema.shape.query,
    isAuth: true,
  });

  // read single notification by id
  registerNotification({
    method: 'patch',
    path: '/notifications/:id/read',
    summary: 'Mark notification as read',
    params: NotificationValidation.readNotificationSchema.shape.params,
    isAuth: true,
  });

  // read all notifications
  registerNotification({
    method: 'patch',
    path: '/notifications/read-all',
    summary: 'Mark all notifications as read',
    isAuth: true,
  });
}
