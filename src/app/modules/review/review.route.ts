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

// delete review
router.delete(
  '/:id',
  auth(UserRole.Customer, UserRole.Professional),
  validateRequest(ReviewValidations.deleteReviewValidation),
  ReviewController.deleteReview,
);

// get single review
router.get(
  '/single/:id',
  validateRequest(ReviewValidations.getReviewByIdValidation),
  ReviewController.getSingleReview,
);

// get my reviews
router.get(
  '/me',
  auth(UserRole.Customer, UserRole.Professional),
  validateRequest(ReviewValidations.getMyReviewsValidation),
  ReviewController.getMyReviews,
);

// get all reviews
router.get(
  '/',
  validateRequest(ReviewValidations.getAllReviewsValidation),
  ReviewController.getAllReviews,
);

export const reviewRoutes = router;
