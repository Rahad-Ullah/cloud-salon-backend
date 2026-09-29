import { Request, Response } from 'express';
import { CategoryServices } from './category.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';

// create category
const createCategory = catchAsync(async (req: Request, res: Response) => {
  const result = await CategoryServices.createCategory(req.body);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: 'Category created successfully',
    data: result,
  });
});

// update category
const updateCategory = catchAsync(async (req: Request, res: Response) => {
  const result = await CategoryServices.updateCategory(
    req.params.id as string,
    req.body,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Category updated successfully',
    data: result,
  });
});

// delete category
const deleteCategory = catchAsync(async (req: Request, res: Response) => {
  const result = await CategoryServices.deleteCategory(req.params.id as string);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Category deleted successfully',
    data: result,
  });
});

// get all categories
const getAllCategories = catchAsync(async (req: Request, res: Response) => {
  const result = await CategoryServices.getAllCategories(req.query);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Categories fetched successfully',
    data: result.data,
    pagination: result.pagination,
  });
});

export const CategoryController = {
  createCategory,
  updateCategory,
  deleteCategory,
  getAllCategories,
};
