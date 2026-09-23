import { z } from 'zod';
import { objectId } from '../../../shared/objectIdValidator';

// create customer validation
const createCustomer = z.object({
  body: z.object({
    name: z.string().nonempty('Name is required'),
    email: z.string().email('Invalid email address'),
  }),
});

// update customer validation
const updateCustomer = z.object({
  params: z.object({
    id: objectId('Customer ID'),
  }),
  body: z.object({
    name: z.string().nonempty('Name cannot be empty').optional(),
    email: z.string().email('Invalid email address').optional(),
  }),
});

// delete customer validation
const deleteCustomer = z.object({
  params: z.object({
    id: objectId('Customer ID'),
  }),
});

export const CustomerValidations = {
  createCustomer,
  updateCustomer,
  deleteCustomer,
};
