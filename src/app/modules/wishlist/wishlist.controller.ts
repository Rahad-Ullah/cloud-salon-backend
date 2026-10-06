import { Request, Response } from 'express';
import { WishlistServices } from './wishlist.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';

// toggle wishlist
const toggleWishlist = catchAsync(async (req: Request, res: Response) => {
  const result = await WishlistServices.toggleWishlist({
    user: req.user.id,
    ...req.body,
  });

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Wishlist toggled successfully',
    data: result,
  });
});

// delete wishlist
const deleteWishlist = catchAsync(async (req: Request, res: Response) => {
  const result = await WishlistServices.deleteWishlist(req.params.id as string);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Wishlist deleted successfully',
    data: result,
  });
});

// get single by id
const getWishlistById = catchAsync(async (req: Request, res: Response) => {
  const result = await WishlistServices.getWishlistById(
    req.params.id as string,
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Wishlist fetched successfully',
    data: result,
  });
});

// get my wishlists
const getMyWishlists = catchAsync(async (req: Request, res: Response) => {
  const result = await WishlistServices.getWishlistsByUserId(
    req.user.id as string,
    req.query,
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Wishlists fetched successfully',
    data: result.data,
    pagination: result.pagination,
  });
});

export const WishlistController = {
  toggleWishlist,
  deleteWishlist,
  getWishlistById,
  getMyWishlists,
};
