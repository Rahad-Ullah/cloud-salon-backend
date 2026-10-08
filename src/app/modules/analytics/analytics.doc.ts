import { registerApiRoute } from '../../../helpers/openapi-helper';

export function registerAnalyticsDocs() {
  const registerAnalytics = (opts: Parameters<typeof registerApiRoute>[0]) => {
    registerApiRoute({ tags: ['Analytics'], ...opts });
  };

  // get customer overview
  registerAnalytics({
    method: 'get',
    path: '/analytics/overview/customer',
    summary: 'Get customer overview',
    roles: ['Customer'],
    isAuth: true,
  });

  // get professional overview
  registerAnalytics({
    method: 'get',
    path: '/analytics/overview/professional',
    summary: 'Get professional overview',
    roles: ['Professional'],
    isAuth: true,
  });
}
