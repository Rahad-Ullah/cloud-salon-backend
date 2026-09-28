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
}
