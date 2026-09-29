import { Schema, model } from 'mongoose';
import {
  IAppointment,
  AppointmentModel,
  AppointmentPricing,
} from './appointment.interface';
import { AppointmentStatus, PaymentStatus } from './appointment.constants';
import { autoIncrementPlugin } from '../../../DB/autoIncrementPlugin';

const PricingSchema = new Schema<AppointmentPricing>(
  {
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    currency: { type: String, default: 'USD', trim: true },
  },
  { _id: false },
);

const appointmentSchema = new Schema<IAppointment, AppointmentModel>(
  {
    uid: { type: String, unique: true, trim: true, sparse: true },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    professional: {
      type: Schema.Types.ObjectId,
      ref: 'Professional',
      required: true,
    },
    salon: { type: Schema.Types.ObjectId, ref: 'Salon', required: true },
    services: [{ type: Schema.Types.ObjectId, ref: 'Service', required: true }],
    scheduledAt: { type: Date, required: true },
    totalDurationInMinutes: { type: Number, required: true },
    pricing: { type: PricingSchema, required: true },
    paymentStatus: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.Unpaid,
    },
    transaction: {
      type: Schema.Types.ObjectId,
      ref: 'Transaction',
      default: null,
    },
    status: {
      type: String,
      enum: Object.values(AppointmentStatus),
      default: AppointmentStatus.Pending,
    },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
);

// auto increment uid
appointmentSchema.plugin(autoIncrementPlugin, {
  incField: 'uid',
  prefix: 'APT',
  counterId: 'appointment_sequence',
  padLength: 6,
});

export const Appointment = model<IAppointment, AppointmentModel>(
  'Appointment',
  appointmentSchema,
);
