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
      refPath: 'entityModel', // Dynamically resolves to 'user' or 'salon' model
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

// indexes for faster queries
reviewSchema.index({ isDeleted: 1 });
reviewSchema.index({ user: 1, isDeleted: 1 });
reviewSchema.index({ entity: 1, entityType: 1, isDeleted: 1 });

// virtual field
reviewSchema.virtual('entityModel').get(function () {
  if (!this.entityType) return null;

  // Converts snake_case ('super_admin') to PascalCase ('SuperAdmin')
  return this.entityType
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
});

export const Review = model<IReview, ReviewModel>('Review', reviewSchema);
