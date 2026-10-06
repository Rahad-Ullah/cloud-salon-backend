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
import { TransactionServices } from '../transaction/transaction.service';
import {
  TransactionReferenceType,
  TransactionType,
} from '../transaction/transaction.constants';
import { User } from '../user/user.model';
import { Transaction } from '../transaction/transaction.model';
import { Wishlist } from '../wishlist/wishlist.model';
import { Types } from 'mongoose';
import { WishlistEntityType } from '../wishlist/wishlist.constants';

const MS_PER_DAY = 86_400_000;

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

  // 1. Get professional
  const professional = await User.findById(payload.professional)
    .select('_id email')
    .lean();
  if (!professional) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Professional not found');
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

  // handle stripe payment
  const paymentSession = await TransactionServices.createStripeCheckoutSession(
    professional,
    {
      amount: result.pricing.total,
      currency: 'USD',
      reference: {
        type: TransactionReferenceType.ChairRental,
        id: result._id.toString(),
      },
    },
  );

  // create transaction
  if (paymentSession.checkoutUrl) {
    await Transaction.create({
      user: professional._id,
      reference: {
        type: TransactionReferenceType.ChairRental,
        id: result._id,
      },
      type: TransactionType.Payment,
      gateway: paymentSession.gateway,
      gatewayReferenceId: paymentSession.sessionId,
      amount: result.pricing.total,
      netAmount: result.pricing.total,
    });
  }

  return paymentSession;
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
  const filter = { isDeleted: false } as any;

  // check if the professional has a salon
  const salon = await Salon.findOne({
    createdBy: professionalId,
    isDeleted: false,
  }).select('_id');
  if (salon) {
    filter.salon = salon._id;
  } else {
    filter.professional = professionalId;
  }

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
  const filter = {
    status: { $in: [RentalStatus.Active, RentalStatus.Confirmed] },
    isDeleted: false,
  } as any;

  // pre-filter professional searching
  if (query.searchTerm) {
    const professionals = await Professional.find({
      $or: [{ title: { $regex: query.searchTerm, $options: 'i' } }],
    });
    // Use $in to match any of the resolved professional IDs
    filter.professional = {
      $in: professionals.map(p => p.user),
    };
  }

  // filter salon by distance
  if (query.distance && query.latitude && query.longitude) {
    const distanceInKm = Number(query.distance) || 20;
    const latitude = Number(query.latitude);
    const longitude = Number(query.longitude);
    if (!isNaN(distanceInKm) && !isNaN(latitude) && !isNaN(longitude)) {
      const nearbySalons = await Salon.find({
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [longitude, latitude],
            },
            $maxDistance: distanceInKm * 1000,
          },
        },
      }).select('_id');

      filter.salon = { $in: nearbySalons.map(s => s._id) };
    }
  }

  const rentalQuery = new QueryBuilder(
    ChairRental.find(filter).select(
      'professional salon chair startDate endDate status',
    ),
    query,
  )
    .filter(['distance', 'latitude', 'longitude', 'user'])
    .sort()
    .paginate()
    .fields();

  const [rentals, pagination] = await Promise.all([
    rentalQuery.modelQuery
      .populate({ path: 'professional', populate: 'roleRef' })
      .populate('salon')
      .lean(),
    rentalQuery.getPaginationInfo(),
  ]);

  // If no user is logged in, attach isWishlist: false to all professionals
  const userId = query.user;
  if (!userId) {
    const data = rentals.map((rental: any) => ({
      ...rental,
      professional: rental.professional
        ? { ...rental.professional, isWishlist: false }
        : null,
    }));
    return { data, pagination };
  }

  // Collect professional IDs from the paginated result
  const professionalIds = rentals
    .map((rental: any) => rental.professional?._id)
    .filter(Boolean);

  // Fetch wishlists for the current user matching these professionals
  const wishlists = await Wishlist.find({
    user: new Types.ObjectId(userId as string),
    entityType: WishlistEntityType.Professional,
    entity: { $in: professionalIds },
  })
    .select('entity')
    .lean();

  const wishlistSet = new Set(wishlists.map(w => w.entity.toString()));

  // Map isWishlist onto the professional object (or the rental item)
  const data = rentals.map((rental: any) => {
    if (!rental.professional) return rental;

    const isWishlist = wishlistSet.has(rental.professional._id.toString());

    return {
      ...rental,
      professional: {
        ...rental.professional,
        isWishlist,
      },
    };
  });

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
