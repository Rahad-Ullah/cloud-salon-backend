import { registerApiRoute } from '../../../helpers/openapi-helper';
import { DisclaimerValidations } from './disclaimer.validation';

export function registerDisclaimerDocs() {
  const registerDisclaimer = (opts: Parameters<typeof registerApiRoute>[0]) => {
    registerApiRoute({ tags: ['Disclaimer'], ...opts });
  };

  // create/update disclaimer
  registerDisclaimer({
    method: 'post',
    path: '/disclaimers',
    summary: 'Update disclaimer',
    body: DisclaimerValidations.createUpdateDisclaimerSchema.shape.body,
    isAuth: true,
  });

  // get disclaimer by type
  registerDisclaimer({
    method: 'get',
    path: '/disclaimers/:type',
    summary: 'Get disclaimer by type',
    params: DisclaimerValidations.getDisclaimerSchema.shape.params,
  });
}
