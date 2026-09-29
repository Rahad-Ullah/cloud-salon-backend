import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { IService } from './service.interface';
import { Service } from './service.model';
import { Category } from '../category/category.model';

// ----------------- create service -----------------
const createService = async (payload: IService): Promise<IService> => {
  // check if the category exists
  const category = await Category.exists({ _id: payload.category });
  if (!category) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Category not found');
  }

  // check if name already taken
  const isNameTaken = await Service.exists({
    name: payload.name,
    createdBy: payload.createdBy,
    isDeleted: false,
  });
  if (isNameTaken) {
    throw new ApiError(StatusCodes.CONFLICT, 'Name already taken');
  }

  const result = await Service.create(payload);
  return result;
};

// ----------------- update service -----------------
const updateService = async (id: string, payload: Partial<IService>) => {
  // check if the category exists
  const category = await Category.exists({ _id: payload.category });
  if (!category) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Category not found');
  }

  // check if name already taken
  const isNameTaken = await Service.exists({
    name: payload.name,
    _id: { $ne: id },
    createdBy: payload.createdBy,
    isDeleted: false,
  });
  if (isNameTaken) {
    throw new ApiError(StatusCodes.CONFLICT, 'Name already taken');
  }

  const result = await Service.findByIdAndUpdate(id, payload, { new: true });

  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Service not found');
  }
  return result;
};

export const ServiceServices = {
  createService,
  updateService,
};
