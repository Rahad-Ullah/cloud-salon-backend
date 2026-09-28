import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { Chair } from '../chair/chair.model';
import { IChairRental } from './chairRental.interface';
import { ChairRental } from './chairRental.model';
import { ChairStatus } from '../chair/chair.constants';
import { RentalStatus } from './chairRental.constants';

// ------------------ create chairRental ------------------
const createChairRental = async (payload: IChairRental) => {
  // check if chair exists
  const chair = await Chair.findOne({
    _id: payload.chair,
    isDeleted: false,
  });
  if (!chair) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Chair not found');
  }

  // inject salon
  payload.salon = chair.salon;

  // check availability and timing
  if (chair.status !== ChairStatus.Active) {
    throw new ApiError(StatusCodes.CONFLICT, 'Chair is not available');
  }

  const startDate = new Date(payload.startDate);
  const endDate = new Date(payload.endDate);

  const existingRental = await ChairRental.exists({
    chair: payload.chair,
    isDeleted: false,
    status: { $nin: [RentalStatus.Cancelled, RentalStatus.Completed] },
    startDate: { $lt: endDate },
    endDate: { $gt: startDate },
  });
  if (existingRental) {
    throw new ApiError(
      StatusCodes.CONFLICT,
      'Chair is not available during this period. Please choose another period',
    );
  }

  // calculate duration and pricing
  payload.durationInDays = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / 86400000, // 1 day = 86400000 ms
  );
  if (payload.durationInDays < 1) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Duration must be at least 1 day',
    );
  }

  payload.pricing = {
    ...payload.pricing,
    total: payload.durationInDays * chair.pricePerDayInUSD,
  };

  // create chairRental
  const result = await ChairRental.create(payload);

  // TODO: initiate payment
  return result;
};

export const ChairRentalServices = {
  createChairRental,
};
