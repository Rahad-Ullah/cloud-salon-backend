import express from 'express';
import { SalonController } from './salon.controller';
import auth from '../../middlewares/auth';
import { UserRole } from '../user/user.constant';
import validateRequest from '../../middlewares/validateRequest';
import { SalonValidations } from './salon.validation';

const router = express.Router();

// create salon
router.post(
  '/create',
  auth(UserRole.Professional),
  validateRequest(SalonValidations.createSalonValidation),
  SalonController.createSalon,
);

export const salonRoutes = router;
