import { Request, Response } from 'express';
import { SalonServices } from './salon.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';

// create salon
const createSalon = catchAsync(async (req: Request, res: Response) => {
  const result = await SalonServices.createSalon({
    createdBy: req.user.id,
    ...req.body,
  });

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: 'Salon created successfully',
    data: result,
  });
});

export const SalonController = {
  createSalon,
};
