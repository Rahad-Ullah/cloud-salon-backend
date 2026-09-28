import express from 'express';
import { ChairController } from './chair.controller';
import auth from '../../middlewares/auth';
import { UserRole } from '../user/user.constant';
import validateRequest from '../../middlewares/validateRequest';
import { ChairValidations } from './chair.validation';

const router = express.Router();

// create chair
router.post(
  '/create',
  auth(UserRole.Professional),
  validateRequest(ChairValidations.createChairValidation),
  ChairController.createChair,
);

export const chairRoutes = router;
