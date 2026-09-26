import { registerApiRoute } from '../../../helpers/openapi-helper';
import { SalonValidations } from './salon.validation';

export function registerSalonDocs() {
  const registerSalon = (opts: Parameters<typeof registerApiRoute>[0]) => {
    registerApiRoute({ tags: ['Salon'], ...opts });
  };

  // create salon
  registerSalon({
    method: 'post',
    path: '/salons/create',
    summary: 'Create salon',
    roles: ['Professional'],
    body: SalonValidations.createSalonValidation.shape.body,
    isAuth: true,
  });

  // update salon
  registerSalon({
    method: 'patch',
    path: '/salons/:id',
    summary: 'Update salon',
    roles: ['Professional'],
    params: SalonValidations.updateSalonValidation.shape.params,
    body: SalonValidations.updateSalonValidation.shape.body,
    isAuth: true,
  });

  // get my salon
  registerSalon({
    method: 'get',
    path: '/salons/my-salon',
    summary: 'Get my salon',
    roles: ['Professional'],
    isAuth: true,
  });

  // get single salon
  registerSalon({
    method: 'get',
    path: '/salons/:id',
    summary: 'Get single salon',
    params: SalonValidations.getSalonByIdValidation.shape.params,
    isAuth: false,
  });

  // get all salons
  registerSalon({
    method: 'get',
    path: '/salons',
    summary: 'Get all salons',
    isAuth: false,
  });
}
