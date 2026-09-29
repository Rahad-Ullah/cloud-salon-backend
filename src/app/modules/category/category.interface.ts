import { Model, Types } from 'mongoose';

export interface ICategory {
  _id: Types.ObjectId;
  name: string;
  image: string;
  isDeleted: boolean;
}

export type CategoryModel = Model<ICategory>;
