import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { Chair } from '../chair/chair.model';
import { IChairRental } from './chairRental.interface';
import { ChairRental } from './chairRental.model';
import { ChairStatus } from '../chair/chair.constants';
import { RentalStatus } from './chairRental.constants';
import { redlock } from '../../../config/redlock';
import QueryBuilder from '../../builder/QueryBuilder';
import { Salon } from '../salon/salon.model';
import { Professional } from '../professional/professional.model';
import { errorLogger } from '../../../shared/logger';

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
          RentalStatus.Active,
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
    try {
      await redlock.release(lock);
    } catch (err) {
      errorLogger.error('Failed to release redlock:', err);
    }
  }

  // TODO: 7. Initiate payment intent/gateway after lock is released
  // const paymentIntent = await PaymentService.createSession(result);

  return result;
};

// ------------------ update chairRental ------------------
const updateChairRental = async (
  id: string,
  payload: Partial<IChairRental>,
) => {
  // check if the rental exists
  const existingRental = await ChairRental.findById(id);
  if (!existingRental)
    throw new ApiError(StatusCodes.NOT_FOUND, 'Rental not found');

  // check if already updated
  if (existingRental.status === payload.status)
    throw new ApiError(StatusCodes.CONFLICT, 'Rental already updated');

  const result = await ChairRental.findByIdAndUpdate(id, payload, {
    new: true,
  });

  // TODO: 1. handle refund on cancel and notifications

  return result;
};

// ------------------ get single by id ------------------
const getSingleRentalById = async (id: string) => {
  const result = await ChairRental.findById(id)
    .populate('salon')
    .populate('professional')
    .populate('chair')
    .populate('transaction');

  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Rental not found');
  }

  return result;
};

// ------------------ get rentals by professional id ------------------
const getRentalsByProfessionalId = async (
  professionalId: string,
  query: Record<string, unknown>,
) => {
  const filter = { professional: professionalId, isDeleted: false } as any;

  // pre-filter salon
  if (query.searchTerm) {
    const salons = await Salon.find({
      $or: [{ name: { $regex: query.searchTerm, $options: 'i' } }],
    });
    filter.salon = salons.map(salon => salon._id);
  }

  const rentalQuery = new QueryBuilder(ChairRental.find(filter), query)
    .filter()
    .sort()
    .paginate()
    .fields();

  const [data, pagination] = await Promise.all([
    rentalQuery.modelQuery
      .populate('salon', 'name bio logo email phone')
      .populate('chair')
      .lean(),
    rentalQuery.getPaginationInfo(),
  ]);

  return { data, pagination };
};

// ------------------ get rentals by salon id ------------------
const getRentalsBySalonId = async (
  salonId: string,
  query: Record<string, unknown>,
) => {
  const rentalQuery = new QueryBuilder(
    ChairRental.find({ salon: salonId, isDeleted: false }),
    query,
  )
    .filter()
    .sort()
    .paginate()
    .fields();

  const [data, pagination] = await Promise.all([
    rentalQuery.modelQuery
      .populate('chair')
      .populate('professional', 'firstName lastName image email phone')
      .lean(),
    rentalQuery.getPaginationInfo(),
  ]);

  return { data, pagination };
};

// ------------------ get all rentals ------------------
const getAllRentals = async (query: Record<string, unknown>) => {
  const rentalQuery = new QueryBuilder(
    ChairRental.find({ isDeleted: false }),
    query,
  )
    .filter()
    .sort()
    .paginate()
    .fields();

  const [data, pagination] = await Promise.all([
    rentalQuery.modelQuery
      .populate('professional', 'firstName lastName image email phone')
      .populate('salon', 'name bio logo email phone')
      .populate('chair')
      .lean(),
    rentalQuery.getPaginationInfo(),
  ]);

  return { data, pagination };
};

// ---------------- get active rentals ----------------
const getActiveRentals = async (query: Record<string, unknown>) => {
  const filter = { status: RentalStatus.Active, isDeleted: false } as any;

  // pre-filter professional searching
  if (query.searchTerm) {
    const professionals = await Professional.find({
      $or: [{ title: { $regex: query.searchTerm, $options: 'i' } }],
    });
    filter.professional = professionals.map(professional => professional.user);
  }

  // filter salon by distance
  if (query.distance) {
    const distanceInKm = Number(query.distance);
    filter.salon = await Salon.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [query.longitude, query.latitude],
          },
          $maxDistance: distanceInKm * 1000,
        },
      },
    });
  }

  const rentalQuery = new QueryBuilder(ChairRental.find(filter), query)
    .filter(['salon', 'professional', 'distance', 'latitude', 'longitude'])
    .sort()
    .paginate()
    .fields();

  const [data, pagination] = await Promise.all([
    rentalQuery.modelQuery
      .populate({ path: 'professional', populate: 'roleRef' })
      .populate('salon')
      .lean(),
    rentalQuery.getPaginationInfo(),
  ]);

  return { data, pagination };
};

export const ChairRentalServices = {
  createChairRental,
  updateChairRental,
  getSingleRentalById,
  getRentalsByProfessionalId,
  getRentalsBySalonId,
  getAllRentals,
  getActiveRentals,
};
