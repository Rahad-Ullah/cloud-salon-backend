import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { Salon } from '../salon/salon.model';
import { EntityType } from './review.constants';
import { IReview } from './review.interface';
import { Review } from './review.model';
import { JwtPayload } from 'jsonwebtoken';
import { User } from '../user/user.model';

// --------------- create review ---------------
const createReview = async (payload: IReview): Promise<IReview> => {
  // check if entity is valid
  let entity: any = null;
  if (payload.entityType === EntityType.Professional) {
    entity = await User.exists({ _id: payload.entity });
  } else if (payload.entityType === EntityType.Salon) {
    entity = await Salon.exists({ _id: payload.entity });
  }
  if (!entity) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Entity not found');
  }

  const result = await Review.create(payload);
  return result;
};

// -------------- update review ---------------
const updateReview = async (
  id: string,
  payload: Partial<IReview>,
  user: JwtPayload,
) => {
  // check if review exists
  const review = await Review.findById(id);
  if (!review) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Review not found');
  }

  // check if user is authorized
  if (review.user.toString() !== user.id) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Unauthorized');
  }

  const result = await Review.findByIdAndUpdate(id, payload, { new: true });
  return result;
};

export const ReviewServices = {
  createReview,
  updateReview,
};
