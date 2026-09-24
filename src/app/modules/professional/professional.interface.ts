import { Model, Types } from 'mongoose';

export interface IProfessional {
  _id: Types.ObjectId;
  uid: string;
  user: Types.ObjectId;
  title: string;
  quote: string;
  bio: string;
  experienceYears: number;
  specialties: string[];
  photos: string[];
  startingPriceInUSD: number;
  totalReviews: number;
  avgRating: number;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProfessionalModel extends Model<IProfessional> {
  isProfileFulfilled(professional: Partial<IProfessional>): boolean;
}
