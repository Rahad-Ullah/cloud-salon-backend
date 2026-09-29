import { Model, Types } from 'mongoose';
import { ServiceStatus } from './service.constants';

export interface IService {
  _id: Types.ObjectId;
  uid: string;
  name: string;
  category: string;
  description: string;
  priceInUSD: number;
  durationInMinutes: number;
  status: ServiceStatus;
  isDeleted: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type ServiceModel = Model<IService>;
