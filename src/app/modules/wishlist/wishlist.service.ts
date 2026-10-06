import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { IWishlist } from './wishlist.interface';
import { Wishlist } from './wishlist.model';
import QueryBuilder from '../../builder/QueryBuilder';
import { WishlistEntityType } from './wishlist.constants';
import { Salon } from '../salon/salon.model';
import { User } from '../user/user.model';

// --------------- toggle wishlist ---------------
const toggleWishlist = async (payload: IWishlist) => {
  // check if the entity exists
  if (payload.entityType === WishlistEntityType.Salon) {
    const salon = await Salon.exists({ _id: payload.entity });
    if (!salon) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Entity not found');
    }
  } else if (payload.entityType === WishlistEntityType.Professional) {
    const professional = await User.exists({ _id: payload.entity });
    if (!professional) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Entity not found');
    }
  }

  // check if wishlist already exists
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
  const result = await Wishlist.findById(id).populate({
    path: 'entity',
    populate: {
      path: 'roleRef',
      strictPopulate: false,
    },
  });
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
    wishlistQuery.modelQuery
      .populate({
        path: 'entity',
        populate: {
          path: 'roleRef',
          strictPopulate: false,
        },
      })
      .lean(),
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
