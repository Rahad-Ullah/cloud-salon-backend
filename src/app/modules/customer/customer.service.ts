import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { ICustomer } from './customer.interface';
import { Customer } from './customer.model';
import QueryBuilder from '../../builder/QueryBuilder';

// ---------------- create customer service -----------------
const createCustomer = async (payload: ICustomer): Promise<ICustomer> => {
  // check if email already exists
  const existingEmail = await Customer.findOne({ email: payload.email });
  if (existingEmail) {
    throw new ApiError(StatusCodes.CONFLICT, 'Email already exists');
  }

  const result = await Customer.create(payload);
  return result;
};

// ---------------- update customer service -----------------
const updateCustomer = async (id: string, payload: Partial<ICustomer>) => {
  // check email already exists
  const existingEmail = await Customer.exists({
    email: payload.email,
    _id: { $ne: id },
  });
  if (existingEmail) {
    throw new ApiError(StatusCodes.CONFLICT, 'Email already exists');
  }

  const result = await Customer.findByIdAndUpdate(id, payload, { new: true });

  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Customer not found');
  }
  return result;
};

// ----------------- delete customer -------------------
const deleteCustomer = async (id: string) => {
  const result = await Customer.findByIdAndUpdate(
    id,
    { isDeleted: true },
    { new: true },
  );
  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Customer not found');
  }
  return result;
};

// ------------------ get by merchant id -----------------
const getCustomerByMerchantId = async (
  merchantId: string,
  query: Record<string, unknown>,
) => {
  const customerQuery = new QueryBuilder(
    Customer.find({ merchant: merchantId, isDeleted: false }),
    query,
  )
    .search(['name', 'email'])
    .filter()
    .paginate()
    .sort()
    .fields();

  const [data, pagination] = await Promise.all([
    customerQuery.modelQuery.lean(),
    customerQuery.getPaginationInfo(),
  ])

  return {data, pagination};
};

// ----------------- get all customers -------------------
const getAllCustomers = async (query: Record<string, unknown>) => {
  const customerQuery = new QueryBuilder(
    Customer.find({ isDeleted: false }),
    query,
  )
    .search(['name', 'email'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const [data, pagination] = await Promise.all([
    customerQuery.modelQuery.lean(),
    customerQuery.getPaginationInfo(),
  ])

  return {data, pagination};
};

export const CustomerServices = {
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerByMerchantId,
  getAllCustomers,
};
