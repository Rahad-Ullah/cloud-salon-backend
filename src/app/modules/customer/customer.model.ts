import { Schema, model } from 'mongoose';
import { ICustomer, CustomerModel } from './customer.interface';
import { autoIncrementPlugin } from '../../../DB/autoIncrementPlugin';

const customerSchema = new Schema<ICustomer, CustomerModel>(
  {
    uid: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    merchant: {
      type: Schema.Types.ObjectId,
      ref: 'Merchant',
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

// auto increment uid
customerSchema.plugin(autoIncrementPlugin, {
  incField: 'uid',
  prefix: 'CUS',
  counterId: 'customer_sequence',
  padLength: 6,
});

export const Customer = model<ICustomer, CustomerModel>(
  'Customer',
  customerSchema,
);
