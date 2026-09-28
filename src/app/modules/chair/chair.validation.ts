import { z } from 'zod';
import { objectId } from '../../../shared/objectIdValidator';
import { ChairStatus } from './chair.constants';

const createChairValidation = z.object({
  body: z.object({
    name: z.string({ required_error: 'Name is required' }).trim(),
    description: z.string().trim().optional().default(''),
    photo: z.string().url('Invalid photo URL').optional().default(''),
    location: z.string({ required_error: 'Location is required' }).trim(),
    pricePerDayInUSD: z
      .number({ required_error: 'Price per day is required' })
      .min(0, 'Price must be 0 or greater'),
  }),
});

const updateChairValidation = z.object({
  params: z.object({
    id: objectId('Chair ID'),
  }),
  body: z.object({
    name: z.string().trim().optional(),
    description: z.string().trim().optional(),
    photo: z.string().url('Invalid photo URL').optional(),
    location: z.string().trim().optional(),
    pricePerDayInUSD: z
      .number()
      .min(0, 'Price must be 0 or greater')
      .optional(),
    isHealthy: z.boolean().optional(),
  }),
});

const deleteChairValidation = z.object({
  params: z.object({
    id: objectId('Chair ID'),
  }),
});

const getChairByIdValidation = z.object({
  params: z.object({
    id: objectId('Chair ID'),
  }),
});

const getChairsBySalonIdValidation = z.object({
  params: z.object({
    id: objectId('Salon ID'),
  }),
});

export const ChairValidations = {
  createChairValidation,
  updateChairValidation,
  deleteChairValidation,
  getChairByIdValidation,
  getChairsBySalonIdValidation,
};
