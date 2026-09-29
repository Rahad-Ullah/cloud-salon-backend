import express from 'express';
import { CategoryController } from './category.controller';
import auth from '../../middlewares/auth';
import { UserRole } from '../user/user.constant';
import validateRequest from '../../middlewares/validateRequest';
import { CategoryValidations } from './category.validation';

const router = express.Router();

// create category
router.post(
  '/create',
  auth(UserRole.Admin, UserRole.SuperAdmin),
  validateRequest(CategoryValidations.createCategoryValidation),
  CategoryController.createCategory,
);

// update category
router.patch(
  '/:id',
  auth(UserRole.Admin, UserRole.SuperAdmin),
  validateRequest(CategoryValidations.updateCategoryValidation),
  CategoryController.updateCategory,
);

export const categoryRoutes = router;
