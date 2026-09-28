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

  // get single chairRental
  registerChairRental({
    method: 'get',
    path: '/chair-rentals/single/:id',
    summary: 'Get single chairRental',
    params: ChairRentalValidations.getChairRentalByIdValidation.shape.params,
    isAuth: true,
  });

  // get my chairRental
  registerChairRental({
    method: 'get',
    path: '/chair-rentals/my-rental',
    summary: 'Get my chairRental',
    roles: ['Professional'],
    isAuth: true,
  });

  // get salon chairRental
  registerChairRental({
    method: 'get',
    path: '/chair-rentals/salon/:id',
    summary: 'Get salon chairRental',
    roles: ['Professional'],
    params: ChairRentalValidations.getSalonChairRentalValidation.shape.params,
    query: ChairRentalValidations.getSalonChairRentalValidation.shape.query,
    isAuth: true,
  });

  // get all chairRental
  registerChairRental({
    method: 'get',
    path: '/chair-rentals',
    summary: 'Get all chairRental',
    roles: ['Admin', 'SuperAdmin'],
    query: ChairRentalValidations.getAllChairRentalValidation.shape.query,
    isAuth: true,
  });
}
