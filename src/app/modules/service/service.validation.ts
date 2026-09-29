import { z } from 'zod';
import { ServiceStatus } from './service.constants';
import { objectId } from '../../../shared/objectIdValidator';

const createServiceValidation = z.object({
  body: z
    .object({
      name: z
        .string({ required_error: 'Name is required' })
        .trim()
        .min(1, 'Name cannot be empty'),
      category: objectId('Category ID'),
      description: z
        .string({ required_error: 'Description is required' })
        .trim()
        .min(1, 'Description cannot be empty'),
      priceInUSD: z
        .number({ required_error: 'Price in USD is required' })
        .nonnegative('Price must be 0 or greater'),
      durationInMinutes: z
        .number({ required_error: 'Duration in minutes is required' })
        .positive('Duration must be greater than 0'),
    })
    .strict(),
});

const updateServiceValidation = z.object({
  params: z
    .object({
      id: objectId('Service ID'),
    })
    .strict(),
  body: z
    .object({
      name: z.string().trim().min(1).optional(),
      category: objectId('Category ID').optional(),
      description: z.string().trim().min(1).optional(),
      priceInUSD: z.number().nonnegative().optional(),
      durationInMinutes: z.number().positive().optional(),
      status: z.nativeEnum(ServiceStatus).optional(),
    })
    .strict(),
});

const deleteServiceValidation = z.object({
  params: z.object({
    id: objectId('Service ID'),
  }),
});

const getServiceByIdValidation = z.object({
  params: z.object({
    id: objectId('Service ID'),
  }),
});

const getMyServicesValidation = z.object({
  query: z.object({
    searchTerm: z.string().optional(),
    status: z.string().optional(),
    category: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});

const getAllServicesValidation = z.object({
  query: z.object({
    searchTerm: z.string().optional(),
    status: z.string().optional(),
    category: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});

export const ServiceValidations = {
  createServiceValidation,
  updateServiceValidation,
  deleteServiceValidation,
  getServiceByIdValidation,
  getMyServicesValidation,
  getAllServicesValidation,
};
