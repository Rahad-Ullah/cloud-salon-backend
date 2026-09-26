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

// update salon
router.patch(
  '/:id',
  auth(UserRole.Professional),
  validateRequest(SalonValidations.updateSalonValidation),
  SalonController.updateSalon,
);

// get my salon
router.get(
  '/my-salon',
  auth(UserRole.Professional),
  SalonController.getMySalon,
);

// get single salon
router.get(
  '/:id',
  validateRequest(SalonValidations.getSalonByIdValidation),
  SalonController.getSingleSalon,
);

export const salonRoutes = router;
