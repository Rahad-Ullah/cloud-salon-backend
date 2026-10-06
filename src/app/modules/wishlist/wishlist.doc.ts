import { registerApiRoute } from '../../../helpers/openapi-helper';
import { WishlistValidations } from './wishlist.validation';

export function registerWishlistDocs() {
  const registerWishlist = (opts: Parameters<typeof registerApiRoute>[0]) => {
    registerApiRoute({ tags: ['Wishlist'], ...opts });
  };

  // create wishlist
  // registerWishlist({
  //   method: 'post',
  //   path: '/wishlist/create',
  //   summary: 'Create wishlist',
  //   roles: ['Admin', 'SuperAdmin'],
  //   body: WishlistValidations.createWishlistValidation.shape.body,
  //   isAuth: true,
  // });
}