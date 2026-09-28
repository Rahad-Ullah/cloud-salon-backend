import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { Chair } from '../chair/chair.model';
import { IChairRental } from './chairRental.interface';
import { ChairRental } from './chairRental.model';
import { ChairStatus } from '../chair/chair.constants';
import { RentalStatus } from './chairRental.constants';
import { redlock } from '../../../config/redlock';

const MS_PER_DAY = 86_400_000;
const PAYMENT_HOLD_MINUTES = 15;

// ------------------ create chairRental ------------------
const createChairRental = async (payload: IChairRental) => {
  const startDate = new Date(payload.startDate);
  const endDate = new Date(payload.endDate);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid date format provided');
  }

  const now = new Date();
  if (startDate < now) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Start date must be in the future',
    );
  }
  if (endDate <= startDate) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'End date must be greater than start date',
    );
  }

  const durationInDays = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / MS_PER_DAY,
  );
  if (durationInDays < 1) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Duration must be at least 1 day',
    );
  }

  // 2. Lock specifically for this chair to eliminate race conditions
  const lockKey = `locks:chair:${payload.chair}`;
  const lock = await redlock.acquire([lockKey], 3000); // 3s hold

  let result;
  try {
    // 3. Verify chair existence and status
    const chair = await Chair.findOne({
      _id: payload.chair,
      isDeleted: false,
    });
    if (!chair) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Chair not found');
    }

    if (chair.status !== ChairStatus.Active) {
      throw new ApiError(
        StatusCodes.CONFLICT,
        'Chair is not active. Please choose another chair',
      );
    }

    // 4. Check for overlapping rentals (Confirmed OR active pending holds)
    const existingRental = await ChairRental.exists({
      chair: payload.chair,
      isDeleted: false,
      status: {
        $in: [
          RentalStatus.Pending,
          RentalStatus.Confirmed,
          RentalStatus.InProgress,
        ],
      },
      startDate: { $lt: endDate },
      endDate: { $gt: startDate },
    });

    if (existingRental) {
      throw new ApiError(
        StatusCodes.CONFLICT,
        'Chair is not available during this period. Please choose another period',
      );
    }

    // 5. Build clean record with parsed dates & pricing
    const rentalData: Partial<IChairRental> = {
      ...payload,
      salon: chair.salon,
      startDate,
      endDate,
      durationInDays,
      status: RentalStatus.Pending,
      pricing: {
        ...payload.pricing,
        total: durationInDays * chair.pricePerDayInUSD,
      },
    };

    result = await ChairRental.create(rentalData);
  } finally {
    // 6. Always release lock immediately after write
    await lock.unlock();
  }

  // TODO: 7. Initiate payment intent/gateway after lock is released
  // const paymentIntent = await PaymentService.createSession(result);

  return result;
};

export const ChairRentalServices = {
  createChairRental,
};
