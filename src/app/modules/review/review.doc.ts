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
}
