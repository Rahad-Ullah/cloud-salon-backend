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
}
