import { registerApiRoute } from '../../../helpers/openapi-helper';
import { ChairRentalValidations } from './chairRental.validation';

export function registerChairRentalDocs() {
  const registerChairRental = (
    opts: Parameters<typeof registerApiRoute>[0],
  ) => {
    registerApiRoute({ tags: ['ChairRental'], ...opts });
  };

  // create chairRental
  registerChairRental({
    method: 'post',
    path: '/chair-rentals/create',
    summary: 'Create chairRental',
    roles: ['Professional'],
    body: ChairRentalValidations.createChairRentalValidation.shape.body,
    isAuth: true,
  });

  // update chairRental
  registerChairRental({
    method: 'patch',
    path: '/chair-rentals/:id',
    summary: 'Update chairRental',
    roles: ['Professional'],
    params: ChairRentalValidations.updateChairRentalValidation.shape.params,
    body: ChairRentalValidations.updateChairRentalValidation.shape.body,
    isAuth: true,
  });
}
