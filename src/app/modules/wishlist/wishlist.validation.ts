import { z } from 'zod';
import { objectId } from '../../../shared/objectIdValidator';
import { WishlistEntityType } from './wishlist.constants';

const toggleWishlistValidation = z.object({
  body: z.object({
    entityType: z.nativeEnum(WishlistEntityType),
    entity: objectId('Entity ID'),
  }),
});

const deleteWishlistValidation = z.object({
  params: z.object({
    id: objectId('Wishlist ID'),
  }),
});

const getWishlistByIdValidation = z.object({
  params: z.object({
    id: objectId('Wishlist ID'),
  }),
});

const getMyWishlistValidation = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});

export const WishlistValidations = {
  toggleWishlistValidation,
  deleteWishlistValidation,
  getWishlistByIdValidation,
  getMyWishlistValidation,
};
