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

// get single appointment
router.get(
  '/single/:id',
  auth(),
  validateRequest(AppointmentValidations.getAppointmentByIdValidation),
  AppointmentController.getSingleAppointment,
);

// get my appointments
router.get(
  '/me',
  auth(UserRole.Customer, UserRole.Professional),
  validateRequest(AppointmentValidations.getMyAppointmentsValidation),
  AppointmentController.getMyAppointments,
);

// get all appointments
router.get(
  '/',
  auth(UserRole.Admin, UserRole.SuperAdmin),
  validateRequest(AppointmentValidations.getAllAppointmentsValidation),
  AppointmentController.getAllAppointments,
);

export const appointmentRoutes = router;
