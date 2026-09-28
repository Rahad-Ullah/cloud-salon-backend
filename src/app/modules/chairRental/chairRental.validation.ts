import { z } from 'zod';
import { objectId } from '../../../shared/objectIdValidator';
import { PaymentStatus, RentalStatus } from './chairRental.constants';
import { nativeEnum } from 'zod';

const pricingValidationSchema = z.object({
  total: z
    .number({ required_error: 'Total price is required' })
    .min(0, 'Total price cannot be negative'),
  currency: z.string().default('USD'),
});

const createChairRentalValidation = z.object({
  body: z
    .object({
      chair: objectId('Chair ID'),
      salon: objectId('Salon ID'),
      professional: objectId('Professional ID'),
      startDate: z
        .string({ required_error: 'Start date is required' })
        .datetime(),
      endDate: z.string({ required_error: 'End date is required' }).datetime(),
      durationInDays: z
        .number({ required_error: 'Duration in days is required' })
        .int('Duration must be an integer')
        .min(1, 'Duration must be at least 1 day'),
      pricing: pricingValidationSchema,
    })
    .refine(data => new Date(data.endDate) > new Date(data.startDate), {
      message: 'End date must be greater than start date',
      path: ['endDate'],
    }),
});

const updateChairRentalValidation = z.object({
  params: z.object({
    id: objectId('Chair Rental ID'),
  }),
  body: z.object({
    PaymentStatus: nativeEnum(PaymentStatus).optional(),
    status: nativeEnum(RentalStatus).optional(),
  }),
});

const getChairRentalByIdValidation = z.object({
  params: z.object({
    id: objectId('Chair Rental ID'),
  }),
});

const getMyChairRentalValidation = z.object({
  query: z.object({
    searchTerm: z.string().optional(),
    status: z.string().optional(),
    paymentStatus: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});

const getAllChairRentalValidation = z.object({
  query: z.object({
    searchTerm: z.string().optional(),
    status: z.string().optional(),
    paymentStatus: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});

export const ChairRentalValidations = {
  createChairRentalValidation,
  updateChairRentalValidation,
  getChairRentalByIdValidation,
  getMyChairRentalValidation,
  getAllChairRentalValidation,
};
