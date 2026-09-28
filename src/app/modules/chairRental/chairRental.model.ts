import { Schema, model } from 'mongoose';
import {
  ChairRentalModel,
  IChairRental,
  IPricing,
} from './chairRental.interface';
import { PaymentStatus, RentalStatus } from './chairRental.constants';
import { autoIncrementPlugin } from '../../../DB/autoIncrementPlugin';

const pricingSchema = new Schema<IPricing>(
  {
    total: {
      type: Number,
      required: true,
      min: [0, 'Total price cannot be negative'],
    },
    currency: {
      type: String,
      default: 'USD',
      trim: true,
    },
  },
  { _id: false },
);

const chairRentalSchema = new Schema<IChairRental, ChairRentalModel>(
  {
    uid: {
      type: String,
      unique: true,
      trim: true,
      sparse: true,
    },
    chair: {
      type: Schema.Types.ObjectId,
      ref: 'Chair',
      required: true,
    },
    salon: {
      type: Schema.Types.ObjectId,
      ref: 'Salon',
      required: true,
    },
    professional: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    durationInDays: {
      type: Number,
      required: true,
      min: [1, 'Duration must be at least 1 day'],
    },
    pricing: {
      type: pricingSchema,
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.Unpaid,
    },
    transaction: {
      type: Schema.Types.ObjectId,
      ref: 'Transaction',
      default: null,
    },
    status: {
      type: String,
      enum: Object.values(RentalStatus),
      default: RentalStatus.Pending,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes to speed up lookups and schedule overlap checks
chairRentalSchema.index({ chair: 1, startDate: 1, endDate: 1 });
chairRentalSchema.index({ professional: 1, status: 1 });
chairRentalSchema.index({ salon: 1, status: 1 });

// auto increment uid
chairRentalSchema.plugin(autoIncrementPlugin, {
  incField: 'uid',
  prefix: 'RNT',
  counterId: 'rental_sequence',
  padLength: 6,
});

export const ChairRental = model<IChairRental, ChairRentalModel>(
  'ChairRental',
  chairRentalSchema,
);
