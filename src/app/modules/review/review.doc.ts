import { registerApiRoute } from '../../../helpers/openapi-helper';
import { ReviewValidations } from './review.validation';

export function registerReviewDocs() {
  const registerReview = (opts: Parameters<typeof registerApiRoute>[0]) => {
    registerApiRoute({ tags: ['Review'], ...opts });
  };

  // create review
  registerReview({
    method: 'post',
    path: '/reviews/create',
    summary: 'Create review',
    roles: ['Customer', 'Professional'],
    body: ReviewValidations.createReviewValidation.shape.body,
    isAuth: true,
  });

  // update review
  registerReview({
    method: 'patch',
    path: '/reviews/:id',
    summary: 'Update review',
    roles: ['Customer', 'Professional'],
    params: ReviewValidations.updateReviewValidation.shape.params,
    body: ReviewValidations.updateReviewValidation.shape.body,
    isAuth: true,
  });

  // delete review
  registerReview({
    method: 'delete',
    path: '/reviews/:id',
    summary: 'Delete review',
    roles: ['Customer', 'Professional'],
    params: ReviewValidations.deleteReviewValidation.shape.params,
    isAuth: true,
  });

  // get single review
  registerReview({
    method: 'get',
    path: '/reviews/single/:id',
    summary: 'Get single review',
    roles: ['Customer', 'Professional'],
    params: ReviewValidations.getReviewByIdValidation.shape.params,
    isAuth: false,
  });

  // get my reviews
  registerReview({
    method: 'get',
    path: '/reviews/me',
    summary: 'Get my reviews',
    roles: ['Customer', 'Professional'],
    isAuth: true,
  });

  // get all reviews
  registerReview({
    method: 'get',
    path: '/reviews',
    summary: 'Get all reviews',
    query: ReviewValidations.getAllReviewsValidation.shape.query,
    isAuth: false,
  });
}
