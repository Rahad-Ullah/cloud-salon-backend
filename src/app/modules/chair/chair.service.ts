import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { IChair } from './chair.interface';
import { Chair } from './chair.model';
import { Salon } from '../salon/salon.model';
import { MediaUploadServices } from '../mediaUpload/mediaUpload.service';
import deleteS3File from '../../../shared/deleteS3File';

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

  // mark the new file as used
  if (payload.photo) {
    await MediaUploadServices.markMediaAsUsed(payload.photo);
  }

  return result;
};

// --------------- update chair service ---------------
const updateChair = async (id: string, payload: Partial<IChair>) => {
  // check if the chair exists
  const existingChair = await Chair.findOne({
    _id: id,
    isDeleted: false,
  }).select('_id photo');
  if (!existingChair) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Chair not found');
  }

  // check if name already taken
  const isNameTaken = await Chair.exists({
    name: payload.name,
    _id: { $ne: id },
    isDeleted: false,
  });
  if (isNameTaken) {
    throw new ApiError(StatusCodes.CONFLICT, 'Name already taken');
  }

  const result = await Chair.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  // mark the new file as used and unlink the old file
  if (payload.photo) {
    await MediaUploadServices.markMediaAsUsed(payload.photo);

    if (existingChair.photo && existingChair.photo !== payload.photo) {
      deleteS3File(existingChair.photo).catch(err => console.error(err));
    }
  }

  return result;
};

// --------------- delete chair service ---------------
const deleteChair = async (id: string): Promise<IChair> => {
  const result = await Chair.findByIdAndUpdate(
    id,
    { isDeleted: true },
    { new: true },
  );
  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Chair not found');
  }
  return result;
};

export const ChairServices = {
  createChair,
  updateChair,
  deleteChair,
};
