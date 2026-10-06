import { registerApiRoute } from '../../../helpers/openapi-helper';
import { TransactionValidations } from './transaction.validation';

export function registerTransactionDocs() {
  const registerTransaction = (
    opts: Parameters<typeof registerApiRoute>[0],
  ) => {
    registerApiRoute({ tags: ['Transaction'], ...opts });
  };

  // update transaction status
  registerTransaction({
    method: 'patch',
    path: '/transactions/:id',
    summary: 'Update transaction status',
    roles: ['Admin', 'SuperAdmin'],
    params:
      TransactionValidations.updateTransactionStatusValidation.shape.params,
    body: TransactionValidations.updateTransactionStatusValidation.shape.body,
    isAuth: true,
  });

  // get single transaction
  registerTransaction({
    method: 'get',
    path: '/transactions/single/:id',
    summary: 'Get single transaction',
    params: TransactionValidations.getSingleTransactionValidation.shape.params,
    isAuth: true,
  });

  // get my transactions
  registerTransaction({
    method: 'get',
    path: '/transactions/me',
    summary: 'Get my transactions',
    roles: ['Customer', 'Professional'],
    isAuth: true,
  });

  // get all transactions
  registerTransaction({
    method: 'get',
    path: '/transactions',
    summary: 'Get all transactions',
    roles: ['Admin', 'SuperAdmin'],
    query: TransactionValidations.getAllTransactionsValidation.shape.query,
    isAuth: true,
  });
}
