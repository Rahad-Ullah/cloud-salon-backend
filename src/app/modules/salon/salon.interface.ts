import { Model, Types } from 'mongoose';

export interface ISalonAvailability {
  day: string; // e.g., 'Monday'
  openTime: string; // e.g., '09:00'
  closeTime: string; // e.g., '18:00'
  isAvailable: boolean;
}

export interface ISalonAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface ISalonGeoLocation {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface ISalon {
  _id: Types.ObjectId;
  uid: string;
  name: string;
  businessType: string;
  description: string;
  logo: string;
  photos: string[];
  email: string;
  phone: string;
  website?: string;
  instagram?: string;
  availability: ISalonAvailability[];
  address: ISalonAddress;
  location: ISalonGeoLocation;
  totalReviews: number;
  avgRating: number;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type SalonModel = Model<ISalon>;
