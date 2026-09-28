import { Model, Types } from 'mongoose';
import { PaymentStatus, RentalStatus } from './chairRental.constants';

export interface IPricing {
  total: number;
  currency: 'USD' | string;
}

export interface IChairRental {
  _id?: Types.ObjectId;
  uid: string;
  chair: Types.ObjectId;
  salon: Types.ObjectId;
  professional: Types.ObjectId;
  startDate: Date;
  endDate: Date;
  durationInDays: number;
  pricing: IPricing;
  paymentStatus: PaymentStatus;
  transaction?: Types.ObjectId;
  status: RentalStatus;
  isDeleted: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type ChairRentalModel = Model<IChairRental>;
