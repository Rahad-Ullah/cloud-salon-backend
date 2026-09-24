import { z } from 'zod';

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

export const ProfessionalValidations = {
  updateProfessionalValidation,
  updateVerificationValidation,
};
