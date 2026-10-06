import { Model, Types } from 'mongoose';
import { WishlistEntityType } from './wishlist.constants';

export interface IWishlist {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  entityType: WishlistEntityType;
  entity: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type WishlistModel = Model<IWishlist>;
