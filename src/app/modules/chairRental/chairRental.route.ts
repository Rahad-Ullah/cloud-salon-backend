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

// update chair rental
router.patch(
  '/:id',
  auth(UserRole.Professional),
  validateRequest(ChairRentalValidations.updateChairRentalValidation),
  ChairRentalController.updateChairRental,
);

// get single chair rental
router.get(
  '/single/:id',
  auth(),
  validateRequest(ChairRentalValidations.getChairRentalByIdValidation),
  ChairRentalController.getSingleRentalById,
);

// get my rentals
router.get(
  '/my-rentals',
  auth(UserRole.Professional),
  validateRequest(ChairRentalValidations.getMyChairRentalValidation),
  ChairRentalController.getMyRentals,
);

// get rentals by salon id
router.get(
  '/salon/:id',
  auth(UserRole.Professional),
  validateRequest(ChairRentalValidations.getSalonChairRentalValidation),
  ChairRentalController.getRentalsBySalonId,
);

// get all rentals
router.get(
  '/',
  auth(UserRole.Admin, UserRole.SuperAdmin),
  validateRequest(ChairRentalValidations.getAllChairRentalValidation),
  ChairRentalController.getAllRentals,
);

export const chairRentalRoutes = router;
