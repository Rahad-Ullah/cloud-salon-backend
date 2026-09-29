import { registerApiRoute } from '../../../helpers/openapi-helper';
import { ReviewValidations } from './review.validation';

export function registerReviewDocs() {
  const registerReview = (opts: Parameters<typeof registerApiRoute>[0]) => {
    registerApiRoute({ tags: ['Review'], ...opts });
  };

  // create review
  // registerReview({
  //   method: 'post',
  //   path: '/review/create',
  //   summary: 'Create review',
  //   roles: ['Admin', 'SuperAdmin'],
  //   body: ReviewValidations.createReviewValidation.shape.body,
  //   isAuth: true,
  // });
}