import { Schema, model } from 'mongoose';
import { ChairModel, IChair } from './chair.interface';
import { ChairStatus } from './chair.constants';
import { autoIncrementPlugin } from '../../../DB/autoIncrementPlugin';

const chairSchema = new Schema<IChair, ChairModel>(
  {
    uid: {
      type: String,
      unique: true,
      trim: true,
      sparse: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    photo: {
      type: String,
      default: '',
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    pricePerDayInUSD: {
      type: Number,
      required: true,
      min: [0, 'Price cannot be negative'],
    },
    isHealthy: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: Object.values(ChairStatus),
      default: ChairStatus.AVAILABLE,
    },
    salon: {
      type: Schema.Types.ObjectId,
      ref: 'Salon',
      required: true,
    },
    bookedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Helpful index for querying available chairs by salon
chairSchema.index({ salon: 1, status: 1, isHealthy: 1 });

// auto increment uid
chairSchema.plugin(autoIncrementPlugin, {
  incField: 'uid',
  prefix: 'CHA',
  counterId: 'chair_sequence',
  padLength: 6,
});

export const Chair = model<IChair, ChairModel>('Chair', chairSchema);
