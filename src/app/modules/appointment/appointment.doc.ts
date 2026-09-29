import { registerApiRoute } from '../../../helpers/openapi-helper';
import { AppointmentValidations } from './appointment.validation';

export function registerAppointmentDocs() {
  const registerAppointment = (
    opts: Parameters<typeof registerApiRoute>[0],
  ) => {
    registerApiRoute({ tags: ['Appointment'], ...opts });
  };

  // create appointment
  registerAppointment({
    method: 'post',
    path: '/appointments/create',
    summary: 'Create appointment',
    roles: ['Customer'],
    body: AppointmentValidations.createAppointmentValidation.shape.body,
    isAuth: true,
  });

  // update appointment
  registerAppointment({
    method: 'patch',
    path: '/appointments/:id',
    summary: 'Update appointment',
    roles: ['Customer', 'Professional'],
    params: AppointmentValidations.updateAppointmentValidation.shape.params,
    body: AppointmentValidations.updateAppointmentValidation.shape.body,
    isAuth: true,
  });

  // get single appointment
  registerAppointment({
    method: 'get',
    path: '/appointments/single/:id',
    summary: 'Get single appointment',
    params: AppointmentValidations.getAppointmentByIdValidation.shape.params,
    isAuth: true,
  });

  // get my appointments
  registerAppointment({
    method: 'get',
    path: '/appointments/me',
    summary: 'Get my appointments',
    roles: ['Customer', 'Professional'],
    isAuth: true,
  });

  // get all appointments
  registerAppointment({
    method: 'get',
    path: '/appointments',
    summary: 'Get all appointments',
    roles: ['Admin', 'SuperAdmin'],
    isAuth: true,
  });
}
