import express from 'express';
import { AnalyticsController } from './analytics.controller';
import auth from '../../middlewares/auth';
import { UserRole } from '../user/user.constant';

const router = express.Router();

// get user overview
router.get(
    '/overview/user',
    auth(UserRole.User),
    AnalyticsController.getUserOverview,
);

// get merchant overview
router.get(
  '/overview/merchant',
  auth(UserRole.Merchant),
  AnalyticsController.getMerchantOverview,
);

// get admin overview
router.get(
    '/overview/admin',
    auth(UserRole.Admin, UserRole.SuperAdmin),
    AnalyticsController.getAdminOverview
);

// get user growth
router.get(
  '/users-growth',
  auth(UserRole.Admin, UserRole.SuperAdmin),
  AnalyticsController.getUserGrowth,
);

export const analyticsRoutes = router;