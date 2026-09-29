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
import { Professional } from '../professional/professional.model';
import mongoose, { Types } from 'mongoose';

// Reusable helper to recalculate average and count via aggregation
const recalculateEntityRating = async (
  entityType: EntityType,
  entityId: Types.ObjectId,
  session: mongoose.ClientSession,
): Promise<void> => {
  const stats = await Review.aggregate([
    {
      $match: {
        entity: entityId,
        entityType,
        isDeleted: false,
      },
    },
    {
      $group: {
        _id: '$entity',
        avgRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
      },
    },
  ]).session(session);

  const avgRating =
    stats.length > 0 ? Math.round(stats[0].avgRating * 10) / 10 : 0;
  const totalReviews = stats.length > 0 ? stats[0].totalReviews : 0;

  if (entityType === EntityType.Salon) {
    await Salon.findByIdAndUpdate(
      entityId,
      { avgRating, totalReviews },
      { session },
    );
  } else {
    await Professional.findOneAndUpdate(
      { user: entityId },
      { avgRating, totalReviews },
      { session },
    );
  }
};

// --------------- create review ---------------/*
const createReview = async (payload: IReview): Promise<IReview> => {
  // 1. Prevent self-review if reviewing a professional/user directly
  if (payload.user.toString() === payload.entity.toString()) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'You cannot review yourself');
  }

  // 2. Select target collection dynamically
  const TargetModel = payload.entityType === EntityType.Salon ? Salon : User;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 3. Verify target entity exists
    const entityExists = await TargetModel.exists({
      _id: payload.entity,
    }).session(session);
    if (!entityExists) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        `${payload.entityType} not found`,
      );
    }

    // 4. Prevent duplicate active reviews from the same user on the same entity
    const existingReview = await Review.findOne({
      user: payload.user,
      entity: payload.entity,
      entityType: payload.entityType,
      isDeleted: false,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // last 24 hours
    }).session(session);

    if (existingReview) {
      throw new ApiError(
        StatusCodes.CONFLICT,
        `You have already submitted a review for this ${payload.entityType}`,
      );
    }

    // 5. Create review inside session
    const [createdReview] = await Review.create([payload], { session });

    // 6. Recalculate entity stats accurately
    await recalculateEntityRating(payload.entityType, payload.entity, session);

    await session.commitTransaction();
    return createdReview;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// -------------- update review ---------------
const updateReview = async (
  id: string,
  payload: Partial<IReview>,
  user: JwtPayload,
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Fetch active review within session
    const review = await Review.findOne({
      _id: id,
      isDeleted: false,
    }).session(session);

    if (!review) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Review not found');
    }

    // 2. Authorization check (403 Forbidden for forbidden resource access)
    const reviewerId = review.user.toString();
    const currentUserId = user.id || user._id;

    if (reviewerId !== currentUserId) {
      throw new ApiError(
        StatusCodes.FORBIDDEN,
        'You do not have permission to update this review',
      );
    }

    // 3. Update review
    const result = await Review.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
      session,
    });

    if (!result) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Review not found');
    }

    // 4. Recalculate entity stats only if rating actually changed
    if (payload.rating !== undefined && payload.rating !== review.rating) {
      await recalculateEntityRating(review.entityType, review.entity, session);
    }

    await session.commitTransaction();
    return result;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// -------------- delete review ---------------
const deleteReview = async (id: string, user: JwtPayload): Promise<IReview> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Only find active (non-deleted) reviews
    const review = await Review.findOne({
      _id: id,
      isDeleted: false,
    }).session(session);

    if (!review) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        'Review not found or already deleted',
      );
    }

    // 2. Check authorization: author or privileged roles (Admin / SuperAdmin)
    const isOwner = review.user.toString() === user.id;
    const isAdmin = [UserRole.Admin, UserRole.SuperAdmin].includes(user.role);

    if (!isOwner && !isAdmin) {
      throw new ApiError(
        StatusCodes.FORBIDDEN,
        'You do not have permission to delete this review',
      );
    }

    // 3. Mark as soft-deleted
    const result = await Review.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true, session },
    );

    if (!result) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Review not found');
    }

    // 4. Recalculate average rating & decrement review count
    await recalculateEntityRating(review.entityType, review.entity, session);

    await session.commitTransaction();
    return result;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
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
  deleteReview,
  getSingleReview,
  getMyReviews,
  getAllReviews,
};
