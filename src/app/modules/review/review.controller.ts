import { Request, Response, NextFunction } from 'express';
import { ReviewServices } from './review.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';

// create review
const createReview = catchAsync(async (req: Request, res: Response) => {
  const result = await ReviewServices.createReview({
    user: req.user.id,
    ...req.body,
  });

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: 'Review created successfully',
    data: result,
  });
});

// update review
const updateReview = catchAsync(async (req: Request, res: Response) => {
  const result = await ReviewServices.updateReview(
    req.params.id as string,
    req.body,
    req.user,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Review updated successfully',
    data: result,
  });
});

export const ReviewController = {
  createReview,
  updateReview,
};
