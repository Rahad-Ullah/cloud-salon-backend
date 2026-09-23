import { Model, Types } from 'mongoose';

export interface ICustomer {
  _id: Types.ObjectId;
  uid: string;
  name: string;
  email: string;
  merchant: Types.ObjectId;
  isDeleted: boolean;
}

export type CustomerModel = Model<ICustomer>;
