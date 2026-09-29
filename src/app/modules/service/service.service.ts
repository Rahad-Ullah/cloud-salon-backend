import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { IService } from './service.interface';
import { Service } from './service.model';
import { Category } from '../category/category.model';
import QueryBuilder from '../../builder/QueryBuilder';

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

// ----------------- delete service -----------------
const deleteService = async (id: string): Promise<IService> => {
  const result = await Service.findByIdAndUpdate(
    id,
    { isDeleted: true },
    { new: true },
  );
  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Service not found');
  }
  return result;
};

// --------------- get single service ---------------
const getSingleService = async (id: string) => {
  const result = await Service.findById(id)
    .populate('category')
    .populate(
      'createdBy',
      'firstName lastName role isSalonOwner email phone image',
    );

  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Service not found');
  }
  return result;
};

// ---------------- get services by professional ----------------
const getServicesByProfessional = async (
  professionalId: string,
  query: Record<string, unknown>,
) => {
  const serviceQuery = new QueryBuilder(
    Service.find({ createdBy: professionalId, isDeleted: false }),
    query,
  )
    .search(['name'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const [data, pagination] = await Promise.all([
    serviceQuery.modelQuery
      .populate('category')
      .populate(
        'createdBy',
        'firstName lastName role isSalonOwner image email phone',
      )
      .lean(),
    serviceQuery.getPaginationInfo(),
  ]);

  return { data, pagination };
};

// ----------------- get all services -----------------
const getAllServices = async (query: Record<string, unknown>) => {
  const serviceQuery = new QueryBuilder(
    Service.find({ isDeleted: false }),
    query,
  )
    .search(['name'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const [data, pagination] = await Promise.all([
    serviceQuery.modelQuery
      .populate('category')
      .populate(
        'createdBy',
        'firstName lastName role isSalonOwner image email phone',
      )
      .lean(),
    serviceQuery.getPaginationInfo(),
  ]);

  return { data, pagination };
};

export const ServiceServices = {
  createService,
  updateService,
  deleteService,
  getSingleService,
  getServicesByProfessional,
  getAllServices,
};
