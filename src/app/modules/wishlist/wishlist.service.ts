import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { IWishlist } from './wishlist.interface';
import { Wishlist } from './wishlist.model';
import QueryBuilder from '../../builder/QueryBuilder';

// --------------- toggle wishlist ---------------
const toggleWishlist = async (payload: IWishlist) => {
  const isExist = await Wishlist.exists({
    user: payload.user,
    entityType: payload.entityType,
    entity: payload.entity,
  });

  // create if not exist
  if (!isExist) {
    const result = await Wishlist.create(payload);
    return result;
  }

  // delete if exist
  const result = await Wishlist.findByIdAndDelete(isExist._id);
  return result;
};

// --------------- delete wishlist ---------------
const deleteWishlist = async (id: string) => {
  const result = await Wishlist.findByIdAndDelete(id);
  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Wishlist not found');
  }
  return result;
};

// --------------- get wishlist by id ---------------
const getWishlistById = async (id: string) => {
  const result = await Wishlist.findById(id).populate('entity');
  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Wishlist not found');
  }
  return result;
};

// --------------- get wishlists by user id ---------------
const getWishlistsByUserId = async (
  userId: string,
  query: Record<string, unknown>,
) => {
  const wishlistQuery = new QueryBuilder(Wishlist.find({ user: userId }), query)
    .filter()
    .sort()
    .paginate()
    .fields();

  const [data, pagination] = await Promise.all([
    wishlistQuery.modelQuery.populate('entity').lean(),
    wishlistQuery.getPaginationInfo(),
  ]);

  return { data, pagination };
};

export const WishlistServices = {
  toggleWishlist,
  deleteWishlist,
  getWishlistById,
  getWishlistsByUserId,
};
