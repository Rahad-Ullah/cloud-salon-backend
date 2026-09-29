import { z } from 'zod';
import { objectId } from '../../../shared/objectIdValidator';

const createCategoryValidation = z.object({
  body: z.object({
    name: z.string({ required_error: 'Name is required' }).trim(),
    image: z.string({ required_error: 'Image is required' }).trim(),
  }),
});

const updateCategoryValidation = z.object({
  params: z.object({ id: objectId('Category ID') }),
  body: z.object({
    name: z.string().trim().optional(),
    image: z.string().trim().optional(),
  }),
});

const deleteCategoryValidation = z.object({
  params: z.object({ id: objectId('Category ID') }),
});

const getCategoryByIdValidation = z.object({
  params: z.object({ id: objectId('Category ID') }),
});

export const CategoryValidations = {
  createCategoryValidation,
  updateCategoryValidation,
  deleteCategoryValidation,
  getCategoryByIdValidation,
};
