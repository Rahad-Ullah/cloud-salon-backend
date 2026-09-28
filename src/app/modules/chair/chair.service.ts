import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { IChair } from './chair.interface';
import { Chair } from './chair.model';
import { Salon } from '../salon/salon.model';

// --------------- create chair service ---------------
const createChair = async (
  payload: IChair,
  userId: string,
): Promise<IChair> => {
  // check if salon exists
  const salon = await Salon.findOne({ createdBy: userId }).select(
    '_id createdBy',
  );
  if (!salon) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Salon not found');
  }

  payload.salon = salon._id;

  // check if chair already exists
  const existingChair = await Chair.exists({
    name: payload.name,
    salon: payload.salon,
    isDeleted: false,
  });
  if (existingChair) {
    throw new ApiError(StatusCodes.CONFLICT, 'Chair already exists');
  }

  const result = await Chair.create(payload);
  return result;
};

export const ChairServices = {
  createChair,
};
