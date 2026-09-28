import { Request, Response, NextFunction } from 'express';
import { ChairRentalServices } from './chairRental.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';

// create chair rental
const createChairRental = catchAsync(async (req: Request, res: Response) => {
  const result = await ChairRentalServices.createChairRental({
    professional: req.user.id,
    ...req.body,
  });

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: 'ChairRental created successfully',
    data: result,
  });
});

export const ChairRentalController = {
  createChairRental,
};
