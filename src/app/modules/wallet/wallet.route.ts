import express from 'express';
import { WalletController } from './wallet.controller';
import auth from '../../middlewares/auth';
import { UserRole } from '../user/user.constant';
import validateRequest from '../../middlewares/validateRequest';
import { WalletValidations } from './wallet.validation';

const router = express.Router();

// connect payout method
router.post(
  '/payout-method/connect',
  auth(UserRole.Merchant),
  validateRequest(WalletValidations.connectPayoutMethod),
  WalletController.connectPayoutMethod,
);

// payout withdrawal
router.post(
  '/payout-withdrawal',
  auth(UserRole.Merchant),
  validateRequest(WalletValidations.payoutWithdrawal),
  WalletController.payoutWithdrawal,
);

// get my wallet
router.get('/my-wallet', auth(UserRole.Merchant), WalletController.getMyWallet);

export const walletRoutes = router;
