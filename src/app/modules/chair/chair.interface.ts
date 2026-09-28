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
  isHealthy: boolean;
  status: ChairStatus;
  salon: Types.ObjectId;
  bookedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type ChairModel = Model<IChair>;
