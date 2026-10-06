import { registerApiRoute } from '../../../helpers/openapi-helper';
import { WishlistValidations } from './wishlist.validation';

export function registerWishlistDocs() {
  const registerWishlist = (opts: Parameters<typeof registerApiRoute>[0]) => {
    registerApiRoute({ tags: ['Wishlist'], ...opts });
  };

  // toggle wishlist
  registerWishlist({
    method: 'post',
    path: '/wishlists/toggle',
    summary: 'Create wishlist',
    roles: ['Customer', 'Professional'],
    body: WishlistValidations.toggleWishlistValidation.shape.body,
    isAuth: true,
  });

  // delete wishlist
  registerWishlist({
    method: 'delete',
    path: '/wishlists/:id',
    summary: 'Delete wishlist',
    roles: ['Customer', 'Professional'],
    params: WishlistValidations.deleteWishlistValidation.shape.params,
    isAuth: true,
  });

  // get wishlist by id
  registerWishlist({
    method: 'get',
    path: '/wishlists/single/:id',
    summary: 'Get wishlist by id',
    roles: ['Customer', 'Professional'],
    params: WishlistValidations.getWishlistByIdValidation.shape.params,
    isAuth: true,
  });

  // get my wishlist
  registerWishlist({
    method: 'get',
    path: '/wishlists/me',
    summary: 'Get my wishlist',
    roles: ['Customer', 'Professional'],
    query: WishlistValidations.getMyWishlistValidation.shape.query,
    isAuth: true,
  });
}
