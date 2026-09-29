import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { ICategory } from './category.interface';
import { Category } from './category.model';
import { MediaUploadServices } from '../mediaUpload/mediaUpload.service';

// --------------- create category ---------------
const createCategory = async (payload: ICategory): Promise<ICategory> => {
  // check if category already exists
  const existingCategory = await Category.exists({ name: payload.name });
  if (existingCategory) {
    throw new ApiError(StatusCodes.CONFLICT, 'Category already exists');
  }

  const result = await Category.create(payload);

  // mark the new file as used
  if (payload.image) {
    await MediaUploadServices.markMediaAsUsed(payload.image);
  }

  return result;
};

export const CategoryServices = {
  createCategory,
};
