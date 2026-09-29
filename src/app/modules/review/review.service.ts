import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { Salon } from '../salon/salon.model';
import { EntityType } from './review.constants';
import { IReview } from './review.interface';
import { Review } from './review.model';
import { JwtPayload } from 'jsonwebtoken';
import { User } from '../user/user.model';
import QueryBuilder from '../../builder/QueryBuilder';
import { UserRole } from '../user/user.constant';

// --------------- create review ---------------/*
const createReview = async (payload: IReview): Promise<IReview> => {
  // check if entity is valid
  let entity: any = null;
  if (payload.entityType === EntityType.User) {
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

// -------------- get single review ---------------
const getSingleReview = async (id: string) => {
  const result = await Review.findById(id)
    .populate('user', 'firstName lastName role isSalonOwner image email phone')
    .populate('entity');

  return result;
};

// -------------- get my reviews ---------------
const getMyReviews = async (
  user: JwtPayload,
  query: Record<string, unknown>,
) => {
  const filter = { isDeleted: false } as any;
  if (user.role === UserRole.Customer) {
    filter.user = user.id;
  } else if (user.role === UserRole.Professional) {
    filter.entityType = EntityType.User;
    filter.entity = user.id;
  }

  const reviewQuery = new QueryBuilder(Review.find(filter), query)
    .filter()
    .sort()
    .paginate()
    .fields();

  const [data, pagination] = await Promise.all([
    reviewQuery.modelQuery
      .populate(
        'user',
        'firstName lastName role isSalonOwner image email phone',
      )
      .populate('entity')
      .lean(),
    reviewQuery.getPaginationInfo(),
  ]);

  return { data, pagination };
};

// ----------------- get all reviews ------------------
const getAllReviews = async (query: any) => {
  const reviewQuery = new QueryBuilder(Review.find({ isDeleted: false }), query)
    .filter()
    .sort()
    .paginate()
    .fields();

  const [data, pagination] = await Promise.all([
    reviewQuery.modelQuery
      .populate(
        'user',
        'firstName lastName role isSalonOwner image email phone',
      )
      .populate('entity')
      .lean(),
    reviewQuery.getPaginationInfo(),
  ]);

  return { data, pagination };
};

export const ReviewServices = {
  createReview,
  updateReview,
  getSingleReview,
  getMyReviews,
  getAllReviews,
};
