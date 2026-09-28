import express from 'express';
import { ChairRentalController } from './chairRental.controller';
import auth from '../../middlewares/auth';
import { UserRole } from '../user/user.constant';
import validateRequest from '../../middlewares/validateRequest';
import { ChairRentalValidations } from './chairRental.validation';

const router = express.Router();

// create chair rental
router.post(
  '/create',
  auth(UserRole.Professional),
  validateRequest(ChairRentalValidations.createChairRentalValidation),
  ChairRentalController.createChairRental,
);

export const chairRentalRoutes = router;
