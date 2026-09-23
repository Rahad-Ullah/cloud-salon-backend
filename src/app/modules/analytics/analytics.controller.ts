import { Request, Response } from 'express';
import { AnalyticsServices } from './analytics.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';

// get user overview
const getUserOverview = catchAsync(async (req: Request, res: Response) => {
  const result = await AnalyticsServices.getUserOverview(req.user.id as string);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    data: result,
    message: 'User overview fetched successfully',
  });
});

// get merchant overview
const getMerchantOverview = catchAsync(async (req: Request, res: Response) => {
  const result = await AnalyticsServices.getMerchantOverview(req.user.id as string);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    data: result,
    message: 'Merchant overview fetched successfully',
  });
});

// get admin overview
const getAdminOverview = catchAsync(async (req: Request, res: Response) => {
  const result = await AnalyticsServices.getAdminOverview();

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    data: result,
    message: 'Admin overview fetched successfully'
  });
});

// get user growth
const getUserGrowth = catchAsync(async (req: Request, res: Response) => {
  const result = await AnalyticsServices.getUserGrowth(req.query);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    data: result,
    message: 'User growth fetched successfully',
  });
});

export const AnalyticsController = {
  getUserOverview,
  getMerchantOverview,
  getAdminOverview,
  getUserGrowth,
};