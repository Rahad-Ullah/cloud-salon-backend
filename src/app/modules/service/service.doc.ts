import { registerApiRoute } from '../../../helpers/openapi-helper';
import { ServiceValidations } from './service.validation';

export function registerServiceDocs() {
  const registerService = (opts: Parameters<typeof registerApiRoute>[0]) => {
    registerApiRoute({ tags: ['Service'], ...opts });
  };

  // create service
  // registerService({
  //   method: 'post',
  //   path: '/service/create',
  //   summary: 'Create service',
  //   roles: ['Admin', 'SuperAdmin'],
  //   body: ServiceValidations.createServiceValidation.shape.body,
  //   isAuth: true,
  // });
}