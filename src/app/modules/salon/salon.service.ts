import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { ISalon } from './salon.interface';
import { Salon } from './salon.model';
import { User } from '../user/user.model';
import mongoose from 'mongoose';
import { MediaUploadServices } from '../mediaUpload/mediaUpload.service';
import deleteS3File from '../../../shared/deleteS3File';
import { errorLogger } from '../../../shared/logger';
import { JwtPayload } from 'jsonwebtoken';

// --------------- create salon ---------------
const createSalon = async (payload: ISalon): Promise<ISalon> => {
  // 1. Verify user exists first
  const user = await User.exists({ _id: payload.createdBy });
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }

  // 2. Prevent duplicate salon creation
  const isSalonExist = await Salon.exists({ createdBy: payload.createdBy });
  if (isSalonExist) {
    throw new ApiError(
      StatusCodes.CONFLICT,
      'Salon already exists for this user',
    );
  }

  // 3. Atomically create salon & update user via database transaction
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const newSalon = await Salon.create([payload], { session });

    if (!newSalon.length) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to create salon');
    }

    const updatedUser = await User.findByIdAndUpdate(
      payload.createdBy,
      { isSalonOwner: true },
      { session, new: true },
    );

    if (!updatedUser) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Failed to assign salon ownership to user',
      );
    }

    await session.commitTransaction();
    return newSalon[0];
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};

// ----------------- update salon -----------------
const updateSalon = async (
  id: string,
  payload: Partial<ISalon>,
  user: JwtPayload,
): Promise<any> => {
  // check if the salon exists
  const existingSalon = await Salon.findById(id).select(
    'logo photos createdBy',
  );
  if (!existingSalon) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Salon not found');
  }

  // check if the user is the owner of the salon
  if (existingSalon.createdBy.toString() !== user.id) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      'You are not allowed to update this salon',
    );
  }

  const result = await Salon.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  // mark the new files as used and unlink the old files
  if (payload.logo) {
    await MediaUploadServices.markMediaAsUsed(payload.logo);

    if (existingSalon.logo && payload.logo !== existingSalon.logo) {
      deleteS3File(existingSalon.logo).catch(err => errorLogger.error(err));
    }
  }
  if (payload.photos && payload.photos.length > 0) {
    const existingPhotos = existingSalon.photos || [];
    const newPhotos = payload.photos.filter(
      photo => !existingPhotos.includes(photo),
    );
    const removedPhotos = existingPhotos.filter(
      photo => !payload.photos!.includes(photo),
    );
    await MediaUploadServices.markMediaAsUsed(newPhotos);

    if (removedPhotos.length > 0) {
      removedPhotos.forEach(async photo => {
        deleteS3File(photo).catch(err => errorLogger.error(err));
      });
    }
  }

  return result;
};

// ---------------- get single salon ---------------
const getSingleSalon = async (id: string) => {
  const result = await Salon.findById(id).populate(
    'createdBy',
    'firstName lastName email role phone image isSalonOwner',
  );
  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Salon not found');
  }
  return result;
};

export const SalonServices = {
  createSalon,
  updateSalon,
  getSingleSalon,
};
