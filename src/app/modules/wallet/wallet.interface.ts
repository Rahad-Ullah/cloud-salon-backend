import { Model, Types } from 'mongoose';
import {
  PayoutProvider,
  SupportedCurrency,
  WalletStatus,
} from './wallet.constants';

export interface IStripePayoutDetails {
  stripeAccountId: string;
  bankName?: string;
  accountNumberLast4?: string;
  fundingType?: string;
  isOnboardingCompleted?: boolean;
  payoutsEnabled?: boolean;
}

export interface IWallet {
  uid: string;
  user: Types.ObjectId;
  status: WalletStatus;
  provider: PayoutProvider;
  currency: SupportedCurrency;
  availableBalance: number;
  pendingBalance: number;

  gatewayBankInfo: {
    [PayoutProvider.STRIPE]?: IStripePayoutDetails;
    // more providers to be added
  } | null;

  createdAt: Date;
  updatedAt: Date;
}

export type WalletModel = Model<IWallet>;
