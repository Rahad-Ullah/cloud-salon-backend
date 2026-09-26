import { z } from 'zod';
import { objectId } from '../../../shared/objectIdValidator';

const availabilityValidationSchema = z.object({
  day: z.string({ required_error: 'Day is required' }),
  openTime: z.string({ required_error: 'Open time is required' }),
  closeTime: z.string({ required_error: 'Close time is required' }),
  isAvailable: z.boolean().default(true),
});

const addressValidationSchema = z.object({
  line1: z.string({ required_error: 'Address line 1 is required' }),
  line2: z.string().optional().default(''),
  city: z.string({ required_error: 'City is required' }),
  state: z.string({ required_error: 'State is required' }),
  postalCode: z.string({ required_error: 'Postal code is required' }),
  country: z.string({ required_error: 'Country is required' }),
});

const locationValidationSchema = z.object({
  type: z.literal('Point').default('Point'),
  coordinates: z
    .tuple([z.number(), z.number()]) // [longitude, latitude]
    .refine(
      ([lng, lat]) => lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90,
      { message: 'Invalid longitude or latitude range' },
    ),
});

const createSalonValidation = z.object({
  body: z.object({
    name: z.string({ required_error: 'Salon name is required' }).trim(),
    businessType: z
      .string({ required_error: 'Business type is required' })
      .trim(),
    description: z.string().optional().default(''),
    logo: z.string().url('Invalid logo URL').optional().default(''),
    photos: z.array(z.string().url('Invalid photo URL')).optional().default([]),
    email: z
      .string({ required_error: 'Email is required' })
      .email('Invalid email address'),
    phone: z.string({ required_error: 'Phone number is required' }).trim(),
    website: z.string().url('Invalid website URL').optional().default(''),
    instagram: z.string().optional().default(''),
    availability: z.array(availabilityValidationSchema).optional().default([]),
    address: addressValidationSchema,
    location: locationValidationSchema,
  }),
});

const updateSalonValidation = z.object({
  params: z.object({
    id: objectId('Salon ID'),
  }),
  body: z.object({
    name: z.string().trim().optional(),
    businessType: z.string().trim().optional(),
    description: z.string().optional(),
    logo: z.string().url('Invalid logo URL').optional(),
    photos: z.array(z.string().url('Invalid photo URL')).optional(),
    email: z.string().email('Invalid email address').optional(),
    phone: z.string().trim().optional(),
    website: z.string().url('Invalid website URL').optional(),
    instagram: z.string().optional(),
    availability: z.array(availabilityValidationSchema.partial()).optional(),
    address: addressValidationSchema.partial().optional(),
    location: locationValidationSchema.optional(),
  }),
});

const deleteSalonValidation = z.object({
  params: z.object({
    id: objectId('Salon ID'),
  }),
});

const getSalonByIdValidation = z.object({
  params: z.object({
    id: objectId('Salon ID'),
  }),
});

const getAllSalonsValidation = z.object({
  query: z.object({
    searchTerm: z.string().optional(),
    businessType: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});

export const SalonValidations = {
  createSalonValidation,
  updateSalonValidation,
  deleteSalonValidation,
  getSalonByIdValidation,
  getAllSalonsValidation,
};
