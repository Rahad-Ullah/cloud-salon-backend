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

// update chair rental
const updateChairRental = catchAsync(async (req: Request, res: Response) => {
  const result = await ChairRentalServices.updateChairRental(
    req.params.id as string,
    req.body,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'ChairRental updated successfully',
    data: result,
  });
});

// get single by id
const getSingleRentalById = catchAsync(async (req: Request, res: Response) => {
  const result = await ChairRentalServices.getSingleRentalById(
    req.params.id as string,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'ChairRental fetched successfully',
    data: result,
  });
});

// get my rentals
const getMyRentals = catchAsync(async (req: Request, res: Response) => {
  const result = await ChairRentalServices.getRentalsByProfessionalId(
    req.user.id as string,
    req.query,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'ChairRental fetched successfully',
    data: result.data,
    pagination: result.pagination,
  });
});

// get salon rentals
const getRentalsBySalonId = catchAsync(async (req: Request, res: Response) => {
  const result = await ChairRentalServices.getRentalsBySalonId(
    req.params.id as string,
    req.query,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'ChairRental fetched successfully',
    data: result.data,
    pagination: result.pagination,
  });
});

// get all rentals
const getAllRentals = catchAsync(async (req: Request, res: Response) => {
  const result = await ChairRentalServices.getAllRentals(req.query);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'ChairRental fetched successfully',
    data: result.data,
    pagination: result.pagination,
  });
});

export const ChairRentalController = {
  createChairRental,
  updateChairRental,
  getSingleRentalById,
  getMyRentals,
  getRentalsBySalonId,
  getAllRentals,
};
