import { registerApiRoute } from '../../../helpers/openapi-helper';
import { ChairRentalValidations } from './chairRental.validation';

export function registerChairRentalDocs() {
  const registerChairRental = (opts: Parameters<typeof registerApiRoute>[0]) => {
    registerApiRoute({ tags: ['ChairRental'], ...opts });
  };

  // create chairRental
  // registerChairRental({
  //   method: 'post',
  //   path: '/chairRental/create',
  //   summary: 'Create chairRental',
  //   roles: ['Admin', 'SuperAdmin'],
  //   body: ChairRentalValidations.createChairRentalValidation.shape.body,
  //   isAuth: true,
  // });
}