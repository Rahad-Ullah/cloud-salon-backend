import { Request, Response } from 'express';
import { ProfessionalServices } from './professional.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';
import { ChairRentalServices } from '../chairRental/chairRental.service';

// update professional
const updateProfessional = catchAsync(async (req: Request, res: Response) => {
  const result = await ProfessionalServices.updateProfessional(
    req.user.id as string,
    req.body,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Professional updated successfully',
    data: result,
  });
});

// get active professionals
const getActiveProfessionals = catchAsync(
  async (req: Request, res: Response) => {
    const result = await ChairRentalServices.getActiveRentals(req.query);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Professional fetched successfully',
      data: result.data,
      pagination: result.pagination,
    });
  },
);

export const ProfessionalController = {
  updateProfessional,
  getActiveProfessionals,
};
