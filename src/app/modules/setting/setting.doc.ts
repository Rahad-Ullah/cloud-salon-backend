import { registerApiRoute } from '../../../helpers/openapi-helper';
import { SettingValidations } from './setting.validation';

export function registerSettingDocs() {
  const registerSetting = (opts: Parameters<typeof registerApiRoute>[0]) => {
    registerApiRoute({ tags: ['Setting'], ...opts });
  };

  // update setting
  registerSetting({
    method: 'post',
    path: '/settings',
    summary: 'Update setting',
    roles: ['Admin', 'SuperAdmin'],
    body: SettingValidations.updateSettingValidation.shape.body,
    isAuth: true,
  });
}
