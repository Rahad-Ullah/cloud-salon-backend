import { nativeEnum, z } from 'zod';
import { objectId } from '../../../shared/objectIdValidator';
import { EntityType } from './review.constants';

const createReviewValidation = z.object({
  body: z
    .object({
      entityType: nativeEnum(EntityType),
      entity: objectId('Entity ID'),
      rating: z
        .number({ required_error: 'Rating is required' })
        .min(1, 'Rating must be at least 1')
        .max(5, 'Rating cannot exceed 5'),
      comment: z
        .string()
        .trim()
        .max(1000, 'Comment cannot exceed 1000 characters')
        .optional(),
    })
    .strict(),
});

const updateReviewValidation = z.object({
  params: z
    .object({
      id: objectId('Review ID'),
    })
    .strict(),
  body: z
    .object({
      rating: z
        .number()
        .min(1, 'Rating must be at least 1')
        .max(5, 'Rating cannot exceed 5')
        .optional(),
      comment: z
        .string()
        .trim()
        .max(1000, 'Comment cannot exceed 1000 characters')
        .optional(),
    })
    .strict(),
});

const deleteReviewValidation = z.object({
  params: z.object({
    id: objectId('Review ID'),
  }),
});

const getReviewByIdValidation = z.object({
  params: z.object({
    id: objectId('Review ID'),
  }),
});

const getAllReviewsValidation = z.object({
  query: z.object({
    entityType: nativeEnum(EntityType).optional(),
    entity: objectId('Entity ID').optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
    sort: z.string().optional(),
  }),
});

export const ReviewValidations = {
  createReviewValidation,
  updateReviewValidation,
  deleteReviewValidation,
  getReviewByIdValidation,
  getAllReviewsValidation,
};
