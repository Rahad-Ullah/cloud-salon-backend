import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { User } from '../user/user.model';
import { IAppointment } from './appointment.interface';
import { Appointment } from './appointment.model';
import { ChairRental } from '../chairRental/chairRental.model';
import { RentalStatus } from '../chairRental/chairRental.constants';
import { Service } from '../service/service.model';

// ---------------- create appointment ----------------
const createAppointment = async (
  payload: IAppointment,
): Promise<IAppointment> => {
  // 1. Validate user and chair rental in parallel
  const [professional, rental] = await Promise.all([
    User.exists({ _id: payload.professional }),
    ChairRental.findOne({
      professional: payload.professional,
      status: RentalStatus.Active,
      isDeleted: false,
    }).lean(),
  ]);

  if (!professional) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Professional not found');
  }

  if (!rental) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Professional has no active chair',
    );
  }

  // 2. Validate schedule time
  const scheduledAt = new Date(payload.scheduledAt);
  if (scheduledAt < rental.startDate || scheduledAt > rental.endDate) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Professional is not available at this time.',
    );
  }

  // 3. Single query: Fetch services, calculate total price and duration in-memory
  const uniqueServiceIds = [...new Set(payload.services.map(String))];

  const services = await Service.find({
    _id: { $in: uniqueServiceIds },
    isDeleted: false,
  })
    .select('_id priceInUSD durationInMinutes')
    .lean();

  if (services.length !== uniqueServiceIds.length) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid service id provided');
  }

  const { totalPrice, totalDurationInMinutes } = services.reduce(
    (acc, service) => {
      acc.totalPrice += service.priceInUSD || 0;
      acc.totalDurationInMinutes += service.durationInMinutes || 0;
      return acc;
    },
    { totalPrice: 0, totalDurationInMinutes: 0 },
  );

  // 4. Inject metadata & pricing
  payload.salon = rental.salon;
  payload.totalDurationInMinutes = totalDurationInMinutes;

  const discount = payload.pricing?.discount || 0;
  payload.pricing = {
    subtotal: totalPrice,
    discount,
    total: totalPrice - discount,
    currency: payload.pricing?.currency || 'USD',
  };

  return await Appointment.create(payload);

  // TODO: handle payment initiate
};

// ---------------- update appointment ----------------
const updateAppointment = async (
  id: string,
  payload: Partial<IAppointment>,
) => {
  const result = await Appointment.findByIdAndUpdate(id, payload, {
    new: true,
  });
  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Appointment not found');
  }
  // TODO: handle payment on cancel/refund
  return result;
};

export const AppointmentServices = {
  createAppointment,
  updateAppointment,
};
