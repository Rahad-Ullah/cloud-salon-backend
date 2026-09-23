import { Request, Response, NextFunction } from 'express';
import { CustomerServices } from './customer.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';

// create customer
const createCustomer = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await CustomerServices.createCustomer({
      ...req.body,
      merchant: req.user.id,
    });

    sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message: 'Customer created successfully',
      data: result,
    });
  },
);

// update customer
const updateCustomer = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await CustomerServices.updateCustomer(
      req.params.id,
      req.body,
    );

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Customer updated successfully',
      data: result,
    });
  },
);

// delete customer
const deleteCustomer = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await CustomerServices.deleteCustomer(
      req.params.id as string,
    );

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Customer deleted successfully',
      data: result,
    });
  },
);

// get my customers
const getMyCustomers = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await CustomerServices.getCustomerByMerchantId(
      req.user.id as string,
      req.query,
    );

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Customers retrieved successfully',
      data: result.data,
      pagination: result.pagination,
    });
  },
);

// get all customers
const getAllCustomers = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await CustomerServices.getAllCustomers(req.query);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Customers retrieved successfully',
      data: result.data,
      pagination: result.pagination,
    });
  },
);

export const CustomerController = {
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getMyCustomers,
  getAllCustomers,
};
