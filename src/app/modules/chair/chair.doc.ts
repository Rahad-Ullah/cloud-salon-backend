import { registerApiRoute } from '../../../helpers/openapi-helper';
import { ChairValidations } from './chair.validation';

export function registerChairDocs() {
  const registerChair = (opts: Parameters<typeof registerApiRoute>[0]) => {
    registerApiRoute({ tags: ['Chair'], ...opts });
  };

  // create chair
  registerChair({
    method: 'post',
    path: '/chairs/create',
    summary: 'Create chair',
    roles: ['Professional'],
    body: ChairValidations.createChairValidation.shape.body,
    isAuth: true,
  });

  // update chair
  registerChair({
    method: 'patch',
    path: '/chairs/:id',
    summary: 'Update chair',
    roles: ['Professional'],
    params: ChairValidations.updateChairValidation.shape.params,
    body: ChairValidations.updateChairValidation.shape.body,
    isAuth: true,
  });

  // delete chair
  registerChair({
    method: 'delete',
    path: '/chairs/:id',
    summary: 'Delete chair',
    roles: ['Professional'],
    params: ChairValidations.deleteChairValidation.shape.params,
    isAuth: true,
  });

  // get chair by id
  registerChair({
    method: 'get',
    path: '/chairs/single/:id',
    summary: 'Get chair by id',
    params: ChairValidations.getChairByIdValidation.shape.params,
    isAuth: true,
  });

  // get my chairs
  registerChair({
    method: 'get',
    path: '/chairs/my-chairs',
    summary: 'Get chairs of my salon',
    roles: ['Professional'],
    isAuth: true,
  });

  // get all chairs
  registerChair({
    method: 'get',
    path: '/chairs',
    summary: 'Get all chairs',
    isAuth: true,
  });
}
