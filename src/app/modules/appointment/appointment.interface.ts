import { Model, Types } from 'mongoose';
import { AppointmentStatus, PaymentStatus } from './appointment.constants';

export interface AppointmentPricing {
  subtotal: number;
  discount: number;
  total: number;
  currency: string;
}

export interface IAppointment {
  _id: Types.ObjectId;
  uid: string;
  customer: Types.ObjectId;
  professional: Types.ObjectId;
  salon: Types.ObjectId;
  chair: Types.ObjectId;
  services: Types.ObjectId[];
  startsAt: Date;
  endsAt: Date;
  totalDurationInMinutes: number;
  pricing: AppointmentPricing;
  paymentStatus: PaymentStatus;
  transaction: Types.ObjectId;
  status: AppointmentStatus;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type AppointmentModel = Model<IAppointment>;
