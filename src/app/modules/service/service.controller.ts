import { Request, Response } from 'express';
import { ServiceServices } from './service.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';

// create service
const createService = catchAsync(async (req: Request, res: Response) => {
  const result = await ServiceServices.createService({
    createdBy: req.user.id,
    ...req.body,
  });

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: 'Service created successfully',
    data: result,
  });
});

// update service
const updateService = catchAsync(async (req: Request, res: Response) => {
  const result = await ServiceServices.updateService(
    req.params.id as string,
    req.body,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Service updated successfully',
    data: result,
  });
});

export const ServiceController = {
  createService,
  updateService,
};
