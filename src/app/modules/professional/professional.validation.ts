import { z } from 'zod';
import { objectId } from '../../../shared/objectIdValidator';

// update professional validation
const updateProfessionalValidation = z.object({
  body: z
    .object({
      title: z.string().trim().optional(),
      quote: z.string().trim().optional(),
      bio: z.string().trim().optional(),
      experienceYears: z
        .number({
          invalid_type_error: 'Experience years must be a number',
        })
        .nonnegative('Experience years cannot be negative')
        .optional(),
      specialties: z.array(z.string().trim()).optional(),
      photos: z
        .array(z.string().url('Each photo must be a valid URL'))
        .optional(),
      startingPriceInUSD: z
        .number({
          invalid_type_error: 'Starting price must be a number',
        })
        .nonnegative('Starting price cannot be negative')
        .optional(),
    })
    .strict(),
});

// update verification validation
const updateVerificationValidation = z.object({
  body: z
    .object({
      isVerified: z.boolean().optional(),
    })
    .strict(),
});

// get all active professionals validation
const getAllActiveProfessionalsValidation = z.object({
  query: z
    .object({
      serviceCategory: objectId('Category ID').optional(),
      latitude: z.string().optional(),
      longitude: z.string().optional(),
      distance: z.string().optional(),
      professional: objectId('Professional ID').optional(),
      salon: objectId('Salon ID').optional(),
      user: objectId('User ID').optional(),
      page: z.string().optional(),
      limit: z.string().optional(),
    })
    .strict(),
});

export const ProfessionalValidations = {
  updateProfessionalValidation,
  updateVerificationValidation,
  getAllActiveProfessionalsValidation,
};
