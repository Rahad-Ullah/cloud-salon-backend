import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { User } from '../user/user.model';
import { IAppointment } from './appointment.interface';
import { Appointment } from './appointment.model';
import { ChairRental } from '../chairRental/chairRental.model';
import { RentalStatus } from '../chairRental/chairRental.constants';
import { Service } from '../service/service.model';
import QueryBuilder from '../../builder/QueryBuilder';
import { JwtPayload } from 'jsonwebtoken';
import { UserRole } from '../user/user.constant';
import { redlock } from '../../../config/redlock';
import { AppointmentStatus } from './appointment.constants';
import { errorLogger } from '../../../shared/logger';
import { TransactionServices } from '../transaction/transaction.service';
import {
  TransactionReferenceType,
  TransactionType,
} from '../transaction/transaction.constants';
import { Transaction } from '../transaction/transaction.model';

// ---------------- create appointment ----------------
const createAppointment = async (payload: IAppointment) => {
  const startsAt = new Date(payload.startsAt);
  if (isNaN(startsAt.getTime())) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Invalid scheduled date format provided',
    );
  }

  const now = new Date();
  if (startsAt < now) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Appointment date must be in the future',
    );
  }

  // 1. Validate customer & professional
  const [customer, professional] = await Promise.all([
    User.findById(payload.customer).select('_id email').lean(),
    User.findById(payload.professional).select('_id email').lean(),
  ]);

  if (!customer) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Customer not found');
  }
  if (!professional) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Professional not found');
  }

  // 2. Fetch services, calculate total duration & price
  const uniqueServiceIds = [...new Set(payload.services.map(String))];
  if (!uniqueServiceIds.length) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'At least one service is required',
    );
  }

  const services = await Service.find({
    _id: { $in: uniqueServiceIds },
    isDeleted: false,
  })
    .select('_id priceInUSD durationInMinutes')
    .lean();

  if (services.length !== uniqueServiceIds.length) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid service id provided');
  }

  const { subtotal, totalDurationInMinutes } = services.reduce(
    (acc, service) => {
      acc.subtotal += service.priceInUSD || 0;
      acc.totalDurationInMinutes += service.durationInMinutes || 0;
      return acc;
    },
    { subtotal: 0, totalDurationInMinutes: 0 },
  );

  const endsAt = new Date(
    startsAt.getTime() + totalDurationInMinutes * 60 * 1000,
  );

  // 3. Acquire distributed lock for the professional's schedule
  const lockKey = `locks:appointment:professional:${payload.professional}`;
  const lock = await redlock.acquire([lockKey], 3000); // 3s hold

  let result;
  try {
    // 4. Verify professional has an active/confirmed chair rental covering this full slot
    const rental = await ChairRental.findOne({
      professional: payload.professional,
      status: { $in: [RentalStatus.Active, RentalStatus.Confirmed] },
      isDeleted: false,
      startDate: { $lte: startsAt },
      endDate: { $gte: endsAt },
    }).lean();

    if (!rental) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Professional is not available at this scheduled time',
      );
    }

    // 5. Check for overlapping appointments
    const overlappingAppointment = await Appointment.exists({
      professional: payload.professional,
      isDeleted: false,
      status: {
        $in: [
          AppointmentStatus.Pending,
          AppointmentStatus.Confirmed,
          AppointmentStatus.Active,
        ],
      },
      startsAt: { $lt: endsAt },
      endsAt: { $gt: startsAt },
    });

    if (overlappingAppointment) {
      throw new ApiError(
        StatusCodes.CONFLICT,
        'Professional is already booked during this time. Please choose another time.',
      );
    }

    // 6. Build appointment record with server-calculated totals
    const discount = Math.max(0, payload.pricing?.discount || 0);
    const total = Math.max(0, subtotal - discount);

    const appointmentData: Partial<IAppointment> = {
      ...payload,
      customer: customer._id,
      professional: professional._id,
      chair: rental.chair,
      salon: rental.salon,
      startsAt: startsAt,
      endsAt: endsAt,
      totalDurationInMinutes,
      pricing: {
        subtotal,
        discount,
        total,
        currency: 'USD',
      },
    };

    [result] = await Appointment.create([appointmentData]);
  } finally {
    // 7. Always release lock
    try {
      await redlock.release(lock);
    } catch (err) {
      errorLogger.error('Failed to release redlock for appointment:', err);
    }
  }

  // 8. Handle Stripe checkout session
  const paymentSession = await TransactionServices.createStripeCheckoutSession(
    customer,
    {
      amount: result.pricing.total,
      currency: 'USD',
      reference: {
        type: TransactionReferenceType.Appointment,
        id: result._id.toString(),
      },
    },
  );

  // 9. Create transaction record
  if (paymentSession.checkoutUrl) {
    await Transaction.create({
      user: customer._id,
      reference: {
        type: TransactionReferenceType.Appointment,
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

// ---------------- get single appointment ----------------
const getSingleAppointment = async (id: string) => {
  const result = await Appointment.findById(id)
    .populate('customer', 'firstName lastName role email phone image')
    .populate('professional', 'firstName lastName role image email phone')
    .populate('salon', 'name businessType bio logo email phone')
    .populate('services', 'name category priceInUSD durationInMinutes');

  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Appointment not found');
  }
  return result;
};

// ---------------- get my appointments ----------------
const getMyAppointments = async (
  user: JwtPayload,
  query: Record<string, unknown>,
) => {
  const filter = { isDeleted: false } as any;
  if (user.role === UserRole.Customer) {
    filter.customer = user.id;
  } else if (user.role === UserRole.Professional) {
    filter.professional = user.id;
  }

  const aptQuery = new QueryBuilder(Appointment.find(filter), query)
    .filter()
    .sort()
    .paginate()
    .fields();

  const [data, pagination] = await Promise.all([
    aptQuery.modelQuery
      .populate('customer', 'firstName lastName role email phone image')
      .populate('professional', 'firstName lastName role image email phone')
      .populate('salon', 'name businessType bio logo email phone')
      .populate('services', 'name category priceInUSD durationInMinutes')
      .lean(),
    aptQuery.getPaginationInfo(),
  ]);

  return { data, pagination };
};

// ---------------- get all appointments ----------------
const getAllAppointments = async (query: Record<string, unknown>) => {
  const filter = { isDeleted: false } as any;
  // search on customer
  if (query.searchTerm) {
    const customers = await User.find({
      $or: [
        { firstName: { $regex: query.searchTerm, $options: 'i' } },
        { lastName: { $regex: query.searchTerm, $options: 'i' } },
        { email: { $regex: query.searchTerm, $options: 'i' } },
      ],
    });
    filter.customer = customers.map(customer => customer._id);
  }

  const aptQuery = new QueryBuilder(Appointment.find(filter), query)
    .filter()
    .sort()
    .paginate()
    .fields();

  const [data, pagination] = await Promise.all([
    aptQuery.modelQuery
      .populate('customer', 'firstName lastName role email phone image')
      .populate('professional', 'firstName lastName role image email phone')
      .populate('salon', 'name businessType bio logo email phone')
      .lean(),
    aptQuery.getPaginationInfo(),
  ]);

  return { data, pagination };
};

export const AppointmentServices = {
  createAppointment,
  updateAppointment,
  getSingleAppointment,
  getMyAppointments,
  getAllAppointments,
};
