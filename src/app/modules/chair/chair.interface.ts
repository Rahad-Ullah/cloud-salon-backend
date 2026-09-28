import { Model, Types } from 'mongoose';
import { ChairStatus } from './chair.constants';

export interface IChair {
  _id: Types.ObjectId;
  uid: string;
  name: string;
  description: string;
  photo: string;
  location: string;
  pricePerDayInUSD: number;
  status: ChairStatus;
  salon: Types.ObjectId;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type ChairModel = Model<IChair>;
