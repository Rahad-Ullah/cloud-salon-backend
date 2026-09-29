import { registerApiRoute } from '../../../helpers/openapi-helper';
import { CategoryValidations } from './category.validation';

export function registerCategoryDocs() {
  const registerCategory = (opts: Parameters<typeof registerApiRoute>[0]) => {
    registerApiRoute({ tags: ['Category'], ...opts });
  };

  // create category
  registerCategory({
    method: 'post',
    path: '/categories/create',
    summary: 'Create category',
    roles: ['Admin', 'SuperAdmin'],
    body: CategoryValidations.createCategoryValidation.shape.body,
    isAuth: true,
  });

  // update category
  registerCategory({
    method: 'patch',
    path: '/categories/:id',
    summary: 'Update category',
    roles: ['Admin', 'SuperAdmin'],
    params: CategoryValidations.updateCategoryValidation.shape.params,
    body: CategoryValidations.updateCategoryValidation.shape.body,
    isAuth: true,
  });

  // delete category
  registerCategory({
    method: 'delete',
    path: '/categories/:id',
    summary: 'Delete category',
    roles: ['Admin', 'SuperAdmin'],
    params: CategoryValidations.deleteCategoryValidation.shape.params,
    isAuth: true,
  });

  // get all categories
  registerCategory({
    method: 'get',
    path: '/categories',
    summary: 'Get all categories',
    query: CategoryValidations.getAllCategoriesValidation.shape.query,
    isAuth: false,
  });
}
