import { registerApiRoute } from '../../../helpers/openapi-helper';
import { CategoryValidations } from './category.validation';

export function registerCategoryDocs() {
  const registerCategory = (opts: Parameters<typeof registerApiRoute>[0]) => {
    registerApiRoute({ tags: ['Category'], ...opts });
  };

  // create category
  // registerCategory({
  //   method: 'post',
  //   path: '/category/create',
  //   summary: 'Create category',
  //   roles: ['Admin', 'SuperAdmin'],
  //   body: CategoryValidations.createCategoryValidation.shape.body,
  //   isAuth: true,
  // });
}