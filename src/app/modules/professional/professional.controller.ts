import { Request, Response, NextFunction } from 'express';
import { ProfessionalServices } from './professional.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';

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

export const ProfessionalController = {
  updateProfessional,
};
