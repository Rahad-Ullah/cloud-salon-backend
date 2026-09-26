import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { ISalon } from './salon.interface';
import { Salon } from './salon.model';
import { User } from '../user/user.model';
import mongoose from 'mongoose';

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

export const SalonServices = {
  createSalon,
};
