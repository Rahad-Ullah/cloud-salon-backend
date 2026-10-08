import { Schema, model } from 'mongoose';
import { IService, ServiceModel } from './service.interface';
import { ServiceStatus } from './service.constants';
import { autoIncrementPlugin } from '../../../DB/autoIncrementPlugin';

const serviceSchema = new Schema<IService, ServiceModel>(
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
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    priceInUSD: {
      type: Number,
      required: true,
      min: 0,
    },
    durationInMinutes: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      enum: Object.values(ServiceStatus),
      default: ServiceStatus.Active,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// index
serviceSchema.index({ createdBy: 1, isDeleted: 1 });
serviceSchema.index({ category: 1, isDeleted: 1, status: 1 });

// auto increment uid
serviceSchema.plugin(autoIncrementPlugin, {
  incField: 'uid',
  prefix: 'SRV',
  counterId: 'service_sequence',
  padLength: 6,
});

export const Service = model<IService, ServiceModel>('Service', serviceSchema);
