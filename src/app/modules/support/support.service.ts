import { Support } from './support.model';
import { ISupport } from './support.interface';
import ApiError from '../../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import { SupportStatus } from './support.constants';
import QueryBuilder from '../../builder/QueryBuilder';
import { User } from '../user/user.model';

// ----------------- create support -----------------
const createSupport = async (payload: Partial<ISupport>) => {
  const MAX_TICKETS_24H = 5;

  // 1. Calculate time threshold (24 hours ago from right now)
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // 2. Count tickets created in the last 24 hours for this user
  const ticketCount = await Support.countDocuments({
    user: payload.user,
    type: payload.type,
    status: SupportStatus.Open,
    createdAt: { $gte: twentyFourHoursAgo },
  });

  // 3. Enforce the rate limit
  if (ticketCount >= MAX_TICKETS_24H) {
    throw new ApiError(
      StatusCodes.TOO_MANY_REQUESTS,
      `We are currently looking into your other queries. Please wait a while and try again.`,
    );
  }

  // 4. Create the ticket
  const result = await Support.create(payload);
  if (!result) {
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Failed to create support ticket. Please try again later.',
    );
  }

  return result;
};

// ----------------- update support -----------------
const updateSupport = async (id: string, payload: ISupport) => {
  const result = await Support.findByIdAndUpdate(id, payload, { new: true });
  if (!result) {
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Failed to update support. Please try again later.',
    );
  }
  return result;
};

// ----------------- get single by id ------------------
const getSingleById = async (id: string) => {
  const result = await Support.findById(id).populate(
    'user',
    'firstName lastName email role phone image',
  );
  return result;
};

// ---------------- get by user id ----------------
const getByUserId = async (userId: string, query: Record<string, unknown>) => {
  const supportQuery = new QueryBuilder(Support.find({ user: userId }), query)
    .filter()
    .search(['title'])
    .sort()
    .paginate()
    .fields();

  const [data, pagination] = await Promise.all([
    supportQuery.modelQuery,
    supportQuery.getPaginationInfo(),
  ]);
  return { data, pagination };
};

// ----------------- get all tickets ------------------
const getAllSupports = async (query: Record<string, unknown>) => {
  // pre-filter user
  const filter = {} as any;

  if (query.searchTerm) {
    const users = await User.find({
      $or: [
        { firstName: { $regex: query.searchTerm, $options: 'i' } },
        { lastName: { $regex: query.searchTerm, $options: 'i' } },
        { email: { $regex: query.searchTerm, $options: 'i' } },
      ],
    }).select('_id');
    filter.user = users.map(user => user._id);
  }

  const supportQuery = new QueryBuilder(Support.find(filter), query)
    .filter()
    .sort()
    .paginate()
    .fields();

  const [data, pagination] = await Promise.all([
    supportQuery.modelQuery.populate(
      'user',
      'firstName lastName email role phone image',
    ),
    supportQuery.getPaginationInfo(),
  ]);
  return { data, pagination };
};

export const SupportServices = {
  createSupport,
  updateSupport,
  getSingleById,
  getByUserId,
  getAllSupports,
};
