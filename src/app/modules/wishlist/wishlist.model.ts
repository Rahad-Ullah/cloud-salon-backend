import { Schema, model } from 'mongoose';
import { IWishlist, WishlistModel } from './wishlist.interface';
import { WishlistEntityType } from './wishlist.constants';

const wishlistSchema = new Schema<IWishlist, WishlistModel>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    entityType: {
      type: String,
      enum: Object.values(WishlistEntityType),
      required: true,
    },
    entity: {
      type: Schema.Types.ObjectId,
      refPath: 'entityModel',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

// indexes
wishlistSchema.index({ user: 1, entityType: 1, entity: 1 }, { unique: true });

// virtual field
wishlistSchema.virtual('entityModel').get(function () {
  if (!this.entityType) return null;

  // Converts snake_case ('super_admin') to PascalCase ('SuperAdmin')
  return this.entityType
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
});

export const Wishlist = model<IWishlist, WishlistModel>(
  'Wishlist',
  wishlistSchema,
);
