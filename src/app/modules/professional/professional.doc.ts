import { registerApiRoute } from '../../../helpers/openapi-helper';
import { ProfessionalValidations } from './professional.validation';

export function registerProfessionalDocs() {
  const registerProfessional = (
    opts: Parameters<typeof registerApiRoute>[0],
  ) => {
    registerApiRoute({ tags: ['Professional'], ...opts });
  };

  // update profile
  registerProfessional({
    method: 'patch',
    path: '/professionals/me',
    summary: 'Update profile',
    body: ProfessionalValidations.updateProfessionalValidation.shape.body,
    isAuth: true,
  });
}
