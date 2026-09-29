import express from 'express';
import { AppointmentController } from './appointment.controller';
import auth from '../../middlewares/auth';
import { UserRole } from '../user/user.constant';
import validateRequest from '../../middlewares/validateRequest';
import { AppointmentValidations } from './appointment.validation';

const router = express.Router();

// create appointment
router.post(
  '/create',
  auth(UserRole.Customer),
  validateRequest(AppointmentValidations.createAppointmentValidation),
  AppointmentController.createAppointment,
);

// update appointment
router.patch(
  '/:id',
  auth(UserRole.Customer, UserRole.Professional),
  validateRequest(AppointmentValidations.updateAppointmentValidation),
  AppointmentController.updateAppointment,
);

export const appointmentRoutes = router;
