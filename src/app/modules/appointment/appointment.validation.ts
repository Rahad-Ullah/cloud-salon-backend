import { z } from 'zod';
import { AppointmentStatus, PaymentStatus } from './appointment.constants';
import { objectId } from '../../../shared/objectIdValidator';

const pricingValidationSchema = z.object({
  subtotal: z.number().nonnegative(),
  discount: z.number().nonnegative().default(0).optional(),
  total: z.number().nonnegative(),
  currency: z.string().trim().default('USD').optional(),
});

const createAppointmentValidation = z.object({
  body: z
    .object({
      professional: objectId('Professional ID'),
      services: z
        .array(objectId('Service ID'))
        .nonempty('At least one service is required'),
      startsAt: z.string().datetime(),
      pricing: pricingValidationSchema,
    })
    .strict(),
});

const updateAppointmentValidation = z.object({
  params: z.object({
    id: objectId('Appointment ID'),
  }),
  body: z
    .object({
      status: z
        .enum([
          AppointmentStatus.Confirmed,
          AppointmentStatus.Cancelled,
          AppointmentStatus.Rejected,
        ])
        .optional(),
    })
    .strict(),
});

const deleteAppointmentValidation = z.object({
  params: z.object({
    id: objectId('Appointment ID'),
  }),
});

const getAppointmentByIdValidation = z.object({
  params: z.object({
    id: objectId('Appointment ID'),
  }),
});

const getMyAppointmentsValidation = z.object({
  query: z.object({
    searchTerm: z.string().optional(),
    status: z.nativeEnum(AppointmentStatus).optional(),
    paymentStatus: z.nativeEnum(PaymentStatus).optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
    sort: z.string().optional(),
  }),
});

const getAllAppointmentsValidation = z.object({
  query: z.object({
    searchTerm: z.string().optional(),
    status: z.nativeEnum(AppointmentStatus).optional(),
    paymentStatus: z.nativeEnum(PaymentStatus).optional(),
    professional: objectId('Professional ID').optional(),
    customer: objectId('Customer ID').optional(),
    salon: objectId('Salon ID').optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
    sort: z.string().optional(),
  }),
});

export const AppointmentValidations = {
  createAppointmentValidation,
  updateAppointmentValidation,
  deleteAppointmentValidation,
  getAppointmentByIdValidation,
  getMyAppointmentsValidation,
  getAllAppointmentsValidation,
};
