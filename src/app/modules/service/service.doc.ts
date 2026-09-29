import { registerApiRoute } from '../../../helpers/openapi-helper';
import { ServiceValidations } from './service.validation';

export function registerServiceDocs() {
  const registerService = (opts: Parameters<typeof registerApiRoute>[0]) => {
    registerApiRoute({ tags: ['Service'], ...opts });
  };

  // create service
  registerService({
    method: 'post',
    path: '/services/create',
    summary: 'Create service',
    roles: ['Professional'],
    body: ServiceValidations.createServiceValidation.shape.body,
    isAuth: true,
  });

  // update service
  registerService({
    method: 'patch',
    path: '/services/:id',
    summary: 'Update service',
    roles: ['Professional'],
    params: ServiceValidations.updateServiceValidation.shape.params,
    body: ServiceValidations.updateServiceValidation.shape.body,
    isAuth: true,
  });
}
