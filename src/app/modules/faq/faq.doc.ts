import { registerApiRoute } from '../../../helpers/openapi-helper';
import { FaqValidations } from './faq.validation';

export function registerFaqDocs() {
  const registerFaq = (opts: Parameters<typeof registerApiRoute>[0]) => {
    registerApiRoute({ tags: ['Faq'], ...opts });
  };

  // create faq
  registerFaq({
    method: 'post',
    path: '/faq/create',
    summary: 'Create faq',
    roles: ['Admin', 'SuperAdmin'],
    body: FaqValidations.createFaqValidation.shape.body,
    isAuth: true,
  });

  // update faq
  registerFaq({
    method: 'patch',
    path: '/faq/:id',
    summary: 'Update faq',
    roles: ['Admin', 'SuperAdmin'],
    params: FaqValidations.updateFaqValidation.shape.params,
    body: FaqValidations.updateFaqValidation.shape.body,
    isAuth: true,
  });

  // delete faq
  registerFaq({
    method: 'delete',
    path: '/faq/:id',
    summary: 'Delete faq',
    roles: ['Admin', 'SuperAdmin'],
    params: FaqValidations.deleteFaqValidation.shape.params,
    isAuth: true,
  });

  // get faq by id
  registerFaq({
    method: 'get',
    path: '/faq/:id',
    summary: 'Get faq by id',
    params: FaqValidations.getFaqByIdValidation.shape.params,
  });
}
