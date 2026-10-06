import express from 'express';
import { WishlistController } from './wishlist.controller';
import auth from '../../middlewares/auth';
import { UserRole } from '../user/user.constant';
import validateRequest from '../../middlewares/validateRequest';
import { WishlistValidations } from './wishlist.validation';

const router = express.Router();

// toggle wishlist
router.post(
  '/toggle',
  auth(UserRole.Customer, UserRole.Professional),
  validateRequest(WishlistValidations.toggleWishlistValidation),
  WishlistController.toggleWishlist,
);

// delete wishlist
router.delete(
  '/:id',
  auth(UserRole.Customer, UserRole.Professional),
  validateRequest(WishlistValidations.deleteWishlistValidation),
  WishlistController.deleteWishlist,
);

// get wishlist by id
router.get(
  '/single/:id',
  auth(UserRole.Customer, UserRole.Professional),
  validateRequest(WishlistValidations.getWishlistByIdValidation),
  WishlistController.getWishlistById,
);

// get my wishlists
router.get(
  '/me',
  auth(UserRole.Customer, UserRole.Professional),
  validateRequest(WishlistValidations.getMyWishlistValidation),
  WishlistController.getMyWishlists,
);

export const wishlistRoutes = router;
