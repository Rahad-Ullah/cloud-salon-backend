import { registerApiRoute } from '../../../helpers/openapi-helper';
import { SupportValidations } from './support.validation';

export function registerSupportDocs() {
  const registerSupport = (opts: Parameters<typeof registerApiRoute>[0]) => {
    registerApiRoute({ tags: ['Support'], ...opts });
  };

  // create support
  registerSupport({
    method: 'post',
    path: '/supports/create',
    summary: 'Create support',
    roles: ['Customer', 'Professional'],
    body: SupportValidations.createSupportSchema.shape.body,
    isAuth: true,
  });

  // update support status
  registerSupport({
    method: 'patch',
    path: '/supports/:id',
    summary: 'Update support status',
    roles: ['Admin', 'SuperAdmin'],
    params: SupportValidations.updateSupportSchema.shape.params,
    body: SupportValidations.updateSupportSchema.shape.body,
    isAuth: true,
  });

  // get single support
  registerSupport({
    method: 'get',
    path: '/supports/single/:id',
    summary: 'Get single support',
    roles: ['Admin', 'SuperAdmin'],
    params: SupportValidations.getSingleSupportSchema.shape.params,
    isAuth: true,
  });

  // get my supports
  registerSupport({
    method: 'get',
    path: '/supports/me',
    summary: 'Get my supports',
    roles: ['Customer', 'Professional'],
    isAuth: true,
  });

  // get all supports
  registerSupport({
    method: 'get',
    path: '/supports',
    summary: 'Get all supports',
    roles: ['Admin', 'SuperAdmin'],
    query: SupportValidations.getAllSupportSchema.shape.query,
    isAuth: true,
  });
}
