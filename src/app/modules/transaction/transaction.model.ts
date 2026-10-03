import { Schema, model } from 'mongoose';
import { ITransaction, TransactionModel } from './transaction.interface';
import {
  TransactionGateway,
  TransactionReferenceType,
  TransactionStatus,
  TransactionType,
} from './transaction.constants';
import { autoIncrementPlugin } from '../../../DB/autoIncrementPlugin';

const transactionSchema = new Schema<ITransaction, TransactionModel>(
  {
    uid: {
      type: String,
      unique: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reference: {
      type: {
        type: String,
        enum: TransactionReferenceType,
        required: true,
      },
      id: {
        type: String,
        refPath: 'referenceModel',
      },
    },
    type: {
      type: String,
      enum: TransactionType,
      required: true,
    },
    gateway: {
      type: String,
      enum: TransactionGateway,
      required: true,
      index: true,
    },
    gatewayReferenceId: {
      type: String,
      required: true,
      index: true,
    },
    paymentMethod: {
      type: String,
      default: ''
    },
    amount: {
      type: Number,
      required: true,
    },
    gatewayFee: {
      type: Number,
      default: 0,
    },
    platformFeePercentage: {
      type: Number,
      default: 0,
    },
    platformFee: {
      type: Number,
      default: 0,
    },
    netAmount: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    status: {
      type: String,
      enum: Object.values(TransactionStatus),
      default: TransactionStatus.Pending,
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    paidAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

// unique index
transactionSchema.index(
  { user: 1, gateway: 1, gatewayReferenceId: 1 },
  { unique: true },
);

// virtual field
transactionSchema.virtual('referenceModel').get(function () {
  if (!this.reference.type) return null;

  // Converts snake_case ('super_admin') to PascalCase ('SuperAdmin')
  return this.reference.type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
});

// auto increment uid
transactionSchema.plugin(autoIncrementPlugin, {
  incField: 'uid',
  prefix: 'TXN',
  counterId: 'transaction_sequence',
  padLength: 6,
});

export const Transaction = model<ITransaction, TransactionModel>(
  'Transaction',
  transactionSchema,
);
