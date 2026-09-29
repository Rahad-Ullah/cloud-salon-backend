import express from 'express';
import { ReviewController } from './review.controller';
import auth from '../../middlewares/auth';
import { UserRole } from '../user/user.constant';
import validateRequest from '../../middlewares/validateRequest';
import { ReviewValidations } from './review.validation';

const router = express.Router();

// create review
router.post(
  '/create',
  auth(UserRole.Customer, UserRole.Professional),
  validateRequest(ReviewValidations.createReviewValidation),
  ReviewController.createReview,
);

// update review
router.patch(
  '/:id',
  auth(UserRole.Customer, UserRole.Professional),
  validateRequest(ReviewValidations.updateReviewValidation),
  ReviewController.updateReview,
);

export const reviewRoutes = router;
