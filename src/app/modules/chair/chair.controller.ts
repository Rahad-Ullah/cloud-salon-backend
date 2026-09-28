import { Request, Response } from 'express';
import { ChairServices } from './chair.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';

// create chair
const createChair = catchAsync(async (req: Request, res: Response) => {
  const result = await ChairServices.createChair(
    req.body,
    req.user.id as string,
  );

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Chair created successfully',
    data: result,
  });
});

// update chair
const updateChair = catchAsync(async (req: Request, res: Response) => {
  const result = await ChairServices.updateChair(
    req.params.id as string,
    req.body,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Chair updated successfully',
    data: result,
  });
});

export const ChairController = {
  createChair,
  updateChair,
};
