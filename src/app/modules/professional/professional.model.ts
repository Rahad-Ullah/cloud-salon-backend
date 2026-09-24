import { Schema, model } from 'mongoose';
import { IProfessional, ProfessionalModel } from './professional.interface';
import { autoIncrementPlugin } from '../../../DB/autoIncrementPlugin';

const professionalSchema = new Schema<IProfessional, ProfessionalModel>(
  {
    uid: { type: String, required: true },
    user: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    title: { type: String, default: '' },
    quote: { type: String, default: '' },
    bio: { type: String, default: '' },
    experienceYears: { type: Number, default: 0 },
    specialties: { type: [String], default: [] },
    photos: { type: [String], default: [] },
    startingPriceInUSD: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    avgRating: { type: Number, default: 0 },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true },
);

professionalSchema.index({ user: 1 });

// auto increment uid
professionalSchema.plugin(autoIncrementPlugin, {
  incField: 'uid',
  prefix: 'PROF',
  counterId: 'professional_sequence',
  padLength: 6,
});

export const Professional = model<IProfessional, ProfessionalModel>(
  'Professional',
  professionalSchema,
);
