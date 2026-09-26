import { Schema, model } from 'mongoose';
import {
  ISalonAddress,
  ISalonAvailability,
  ISalonGeoLocation,
  ISalon,
  SalonModel,
} from './salon.interface';
import { autoIncrementPlugin } from '../../../DB/autoIncrementPlugin';

const availabilitySchema = new Schema<ISalonAvailability>(
  {
    day: { type: String, required: true },
    openTime: { type: String, required: true },
    closeTime: { type: String, required: true },
    isAvailable: { type: Boolean, default: true },
  },
  { _id: false },
);

const addressSchema = new Schema<ISalonAddress>(
  {
    line1: { type: String, required: true },
    line2: { type: String, default: '' },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
  },
  { _id: false },
);

const pointSchema = new Schema<ISalonGeoLocation>(
  {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
    },
  },
  { _id: false },
);

const salonSchema = new Schema<ISalon, SalonModel>(
  {
    uid: { type: String, unique: true, sparse: true, trim: true },
    name: { type: String, required: true, trim: true },
    businessType: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    logo: { type: String, default: '' },
    photos: { type: [String], default: [] },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    website: { type: String, default: '' },
    instagram: { type: String, default: '' },
    availability: { type: [availabilitySchema], default: [] },
    address: { type: addressSchema, required: true },
    location: { type: pointSchema, required: true },
    totalReviews: { type: Number, default: 0, min: 0 },
    avgRating: { type: Number, default: 0, min: 0, max: 5 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  {
    timestamps: true,
  },
);

// 2dsphere index for geospatial queries
salonSchema.index({ location: '2dsphere' });

// auto increment uid
salonSchema.plugin(autoIncrementPlugin, {
  incField: 'uid',
  prefix: 'SAL',
  counterId: 'salon_sequence',
  padLength: 6,
});

export const Salon = model<ISalon, SalonModel>('Salon', salonSchema);
