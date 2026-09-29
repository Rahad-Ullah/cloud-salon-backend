import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { ICategory } from './category.interface';
import { Category } from './category.model';
import { MediaUploadServices } from '../mediaUpload/mediaUpload.service';
import deleteS3File from '../../../shared/deleteS3File';

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

// ---------------- update category ---------------
const updateCategory = async (id: string, payload: Partial<ICategory>) => {
  // check if the category exists
  const existingCategory = await Category.findById(id).select('image');
  if (!existingCategory) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Category not found');
  }

  // check if the category name already taken
  if (payload.name) {
    const isNameTaken = await Category.exists({
      name: payload.name,
      _id: { $ne: id },
    });
    if (isNameTaken) {
      throw new ApiError(StatusCodes.CONFLICT, 'Name already taken');
    }
  }

  const result = await Category.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  // mark the new file as used and unlink the old file
  if (payload.image) {
    await MediaUploadServices.markMediaAsUsed(payload.image);

    if (existingCategory.image && existingCategory.image !== payload.image) {
      deleteS3File(existingCategory.image).catch(err => console.error(err));
    }
  }

  return result;
};

export const CategoryServices = {
  createCategory,
  updateCategory,
};
