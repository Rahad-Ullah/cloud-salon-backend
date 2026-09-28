import { z } from 'zod';
import { objectId } from '../../../shared/objectIdValidator';

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

const getMyChairsValidation = z.object({
  query: z.object({
    searchTerm: z.string().optional(),
    status: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});

const getAllChairsValidation = z.object({
  query: z.object({
    searchTerm: z.string().optional(),
    status: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});

export const ChairValidations = {
  createChairValidation,
  updateChairValidation,
  deleteChairValidation,
  getChairByIdValidation,
  getMyChairsValidation,
  getAllChairsValidation,
};
