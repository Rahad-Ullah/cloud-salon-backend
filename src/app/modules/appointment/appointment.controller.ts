import { Request, Response } from 'express';
import { AppointmentServices } from './appointment.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';

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

export const AppointmentController = {
  createAppointment,
  updateAppointment,
};
