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

// get single service
const getSingleService = catchAsync(async (req: Request, res: Response) => {
  const result = await ServiceServices.getSingleService(
    req.params.id as string,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Service fetched successfully',
    data: result,
  });
});

// get my services
const getMyServices = catchAsync(async (req: Request, res: Response) => {
  const result = await ServiceServices.getServicesByProfessional(
    req.user.id as string,
    req.query,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Services fetched successfully',
    data: result.data,
    pagination: result.pagination,
  });
});

// get by professional
const getServicesByProfessional = catchAsync(
  async (req: Request, res: Response) => {
    const result = await ServiceServices.getServicesByProfessional(
      req.params.id as string,
      req.query,
    );

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Services fetched successfully',
      data: result.data,
      pagination: result.pagination,
    });
  },
);

// get all services
const getAllServices = catchAsync(async (req: Request, res: Response) => {
  const result = await ServiceServices.getAllServices(req.query);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Services fetched successfully',
    data: result.data,
    pagination: result.pagination,
  });
});

export const ServiceController = {
  createService,
  updateService,
  getSingleService,
  getMyServices,
  getServicesByProfessional,
  getAllServices,
};
