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

// update chair
router.patch(
  '/:id',
  auth(UserRole.Professional),
  validateRequest(ChairValidations.updateChairValidation),
  ChairController.updateChair,
);

// delete chair
router.delete(
  '/:id',
  auth(UserRole.Professional),
  validateRequest(ChairValidations.deleteChairValidation),
  ChairController.deleteChair,
);

// get chair by id
router.get(
  '/single/:id',
  auth(),
  validateRequest(ChairValidations.getChairByIdValidation),
  ChairController.getChairById,
);

// get my chairs
router.get(
  '/my-chairs',
  auth(UserRole.Professional),
  validateRequest(ChairValidations.getMyChairsValidation),
  ChairController.getMyChairs,
);

// get all chairs
router.get(
  '/',
  auth(UserRole.Admin, UserRole.SuperAdmin),
  validateRequest(ChairValidations.getAllChairsValidation),
  ChairController.getAllChairs,
);

export const chairRoutes = router;
