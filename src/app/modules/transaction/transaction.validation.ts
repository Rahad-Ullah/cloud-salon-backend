import { z } from 'zod';
import { objectId } from '../../../shared/objectIdValidator';
import { TransactionStatus } from './transaction.constants';

// update transaction status validation
const updateTransactionStatusValidation = z.object({
  params: z
    .object({
      id: objectId('Transaction'),
    })
    .strict(),
  body: z
    .object({
      status: z.enum([
        TransactionStatus.Completed,
        TransactionStatus.Failed,
        TransactionStatus.Cancelled,
      ]),
    })
    .strict(),
});

// get single transaction validation
const getSingleTransactionValidation = z.object({
  params: z
    .object({
      id: objectId('Transaction'),
    })
    .strict(),
});

// get my transactions validation
const getMyTransactionsValidation = z.object({
  query: z.object({
    searchTerm: z.string().optional(),
    status: z.nativeEnum(TransactionStatus).optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
    sort: z.string().optional(),
  }),
});

// get all transactions validation
const getAllTransactionsValidation = z.object({
  query: z.object({
    searchTerm: z.string().optional(),
    status: z.nativeEnum(TransactionStatus).optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
    sort: z.string().optional(),
  }),
});

export const TransactionValidations = {
  updateTransactionStatusValidation,
  getSingleTransactionValidation,
  getMyTransactionsValidation,
  getAllTransactionsValidation,
};
