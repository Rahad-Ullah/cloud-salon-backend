import { Schema, model } from 'mongoose';
import { IProfessional, ProfessionalModel } from './professional.interface';
import { autoIncrementPlugin } from '../../../DB/autoIncrementPlugin';

const professionalSchema = new Schema<IProfessional, ProfessionalModel>(
  {
    uid: { type: String, unique: true, sparse: true, trim: true },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      unique: true,
      required: true,
    },
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

// auto increment uid
professionalSchema.plugin(autoIncrementPlugin, {
  incField: 'uid',
  prefix: 'PROF',
  counterId: 'professional_sequence',
  padLength: 6,
});

// statics: check profile fulfillment
professionalSchema.statics.isProfileFulfilled = function (
  professional: Partial<IProfessional>,
): boolean {
  if (!professional) return false;

  const hasBasicDetails = Boolean(
    professional.title?.trim() &&
    professional.bio?.trim() &&
    professional.quote?.trim(),
  );

  const hasExperienceAndPricing = Boolean(
    professional.experienceYears !== undefined &&
    professional.experienceYears >= 0 &&
    professional.startingPriceInUSD !== undefined &&
    professional.startingPriceInUSD > 0,
  );

  const hasSpecialties = Boolean(
    professional.specialties &&
    Array.isArray(professional.specialties) &&
    professional.specialties.length > 0 &&
    professional.specialties.some(s => s.trim().length > 0),
  );

  const hasPhotos = Boolean(
    professional.photos &&
    Array.isArray(professional.photos) &&
    professional.photos.length > 0 &&
    professional.photos.some(p => p.trim().length > 0),
  );

  return (
    hasBasicDetails && hasExperienceAndPricing && hasSpecialties && hasPhotos
  );
};

export const Professional = model<IProfessional, ProfessionalModel>(
  'Professional',
  professionalSchema,
);
