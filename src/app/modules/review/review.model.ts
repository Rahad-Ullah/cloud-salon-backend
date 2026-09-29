import { Schema, model } from 'mongoose';
import { IReview, ReviewModel } from './review.interface';
import { EntityType } from './review.constants';

const reviewSchema = new Schema<IReview, ReviewModel>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    entityType: {
      type: String,
      enum: Object.values(EntityType),
      required: true,
    },
    entity: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: 'entityType', // Dynamically resolves to 'professional' or 'salon' model
      index: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
      default: '',
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true },
);

// indexes
reviewSchema.index({ entity: 1, entityType: 1, isDeleted: 1 });

export const Review = model<IReview, ReviewModel>('Review', reviewSchema);
