import { Request, Response } from 'express';
import { AppointmentServices } from './appointment.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';
import { UserRole } from '../user/user.constant';

// create appointment
const createAppointment = catchAsync(async (req: Request, res: Response) => {
  const result = await AppointmentServices.createAppointment({
    customer: req.user.id,
    ...req.body,
  });

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: 'Appointment created. Please complete the payment.',
    data: result,
  });
});

// update appointment
const updateAppointment = catchAsync(async (req: Request, res: Response) => {
  const result = await AppointmentServices.updateAppointment(
    req.params.id,
    req.body,
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Appointment updated.',
    data: result,
  });
});

// get single appointment
const getSingleAppointment = catchAsync(async (req: Request, res: Response) => {
  const result = await AppointmentServices.getSingleAppointment(req.params.id);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Appointment fetched successfully',
    data: result,
  });
});

// get my appointments
const getMyAppointments = catchAsync(async (req: Request, res: Response) => {
  const result = await AppointmentServices.getMyAppointments(
    req.user,
    req.query,
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Appointments fetched successfully',
    data: result.data,
    pagination: result.pagination,
  });
});

// get all appointments
const getAllAppointments = catchAsync(async (req: Request, res: Response) => {
  const result = await AppointmentServices.getAllAppointments(req.query);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Appointments fetched successfully',
    data: result.data,
    pagination: result.pagination,
  });
});

export const AppointmentController = {
  createAppointment,
  updateAppointment,
  getSingleAppointment,
  getMyAppointments,
  getAllAppointments,
};
