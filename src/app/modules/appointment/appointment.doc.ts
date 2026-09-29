import { registerApiRoute } from '../../../helpers/openapi-helper';
import { AppointmentValidations } from './appointment.validation';

export function registerAppointmentDocs() {
  const registerAppointment = (opts: Parameters<typeof registerApiRoute>[0]) => {
    registerApiRoute({ tags: ['Appointment'], ...opts });
  };

  // create appointment
  // registerAppointment({
  //   method: 'post',
  //   path: '/appointment/create',
  //   summary: 'Create appointment',
  //   roles: ['Admin', 'SuperAdmin'],
  //   body: AppointmentValidations.createAppointmentValidation.shape.body,
  //   isAuth: true,
  // });
}