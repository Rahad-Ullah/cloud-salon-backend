import { Model, Types } from 'mongoose';
import { EntityType } from './review.constants';

export interface IReview {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  entityType: EntityType;
  entity: Types.ObjectId;
  rating: number;
  comment: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type ReviewModel = Model<IReview>;
