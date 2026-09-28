import { z } from 'zod';
import { objectId } from '../../../shared/objectIdValidator';
import { PaymentStatus, RentalStatus } from './chairRental.constants';
import { nativeEnum } from 'zod';

const createChairRentalValidation = z.object({
  body: z
    .object({
      chair: objectId('Chair ID'),
      startDate: z
        .string({ required_error: 'Start date is required' })
        .datetime()
        .refine(
          data => new Date(data).getTime() >= new Date().setHours(0, 0, 0, 0),
          {
            message: 'Start date must be in the future or today',
          },
        ),
      endDate: z
        .string({ required_error: 'End date is required' })
        .datetime()
        .refine(data => new Date(data).getTime() > Date.now(), {
          message: 'End date must be in the future',
        }),
    })
    .strict()
    .refine(data => new Date(data.endDate) > new Date(data.startDate), {
      message: 'End date must be greater than start date',
      path: ['endDate'],
    }),
});

const updateChairRentalValidation = z.object({
  params: z
    .object({
      id: objectId('Chair Rental ID'),
    })
    .strict(),
  body: z
    .object({
      PaymentStatus: nativeEnum(PaymentStatus).optional(),
      status: nativeEnum(RentalStatus).optional(),
    })
    .strict(),
});

const getChairRentalByIdValidation = z.object({
  params: z
    .object({
      id: objectId('Chair Rental ID'),
    })
    .strict(),
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
