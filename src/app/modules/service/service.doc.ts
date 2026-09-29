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
    roles: ['Professional', 'Admin', 'SuperAdmin'],
    params: ServiceValidations.updateServiceValidation.shape.params,
    body: ServiceValidations.updateServiceValidation.shape.body,
    isAuth: true,
  });

  // delete service
  registerService({
    method: 'delete',
    path: '/services/:id',
    summary: 'Delete service',
    roles: ['Professional', 'Admin', 'SuperAdmin'],
    params: ServiceValidations.deleteServiceValidation.shape.params,
    isAuth: true,
  });

  // get single service
  registerService({
    method: 'get',
    path: '/services/single/:id',
    summary: 'Get single service',
    params: ServiceValidations.getServiceByIdValidation.shape.params,
    isAuth: false,
  });

  // get my services
  registerService({
    method: 'get',
    path: '/services/my-services',
    summary: 'Get my services',
    query: ServiceValidations.getMyServicesValidation.shape.query,
    isAuth: true,
  });

  // get by professional
  registerService({
    method: 'get',
    path: '/services/professional/:id',
    summary: 'Get services by professional',
    params: ServiceValidations.getProfessionalServicesValidation.shape.params,
    query: ServiceValidations.getProfessionalServicesValidation.shape.query,
    isAuth: false,
  });

  // get all services
  registerService({
    method: 'get',
    path: '/services/all',
    summary: 'Get all services',
    query: ServiceValidations.getAllServicesValidation.shape.query,
    isAuth: false,
  });
}
