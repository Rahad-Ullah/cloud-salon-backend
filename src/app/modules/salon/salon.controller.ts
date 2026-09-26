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

// update salon
const updateSalon = catchAsync(async (req: Request, res: Response) => {
  const result = await SalonServices.updateSalon(
    req.params.id,
    req.body,
    req.user,
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Salon updated successfully',
    data: result,
  });
});

// get single salon
const getSingleSalon = catchAsync(async (req: Request, res: Response) => {
  const result = await SalonServices.getSingleSalon(req.params.id);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Salon fetched successfully',
    data: result,
  });
});

// get my salon
const getMySalon = catchAsync(async (req: Request, res: Response) => {
  const result = await SalonServices.getMySalon(req.user.id as string);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'My salon fetched successfully',
    data: result,
  });
});

export const SalonController = {
  createSalon,
  updateSalon,
  getSingleSalon,
  getMySalon,
};
