import { registerApiRoute } from '../../../helpers/openapi-helper';
import { WalletValidations } from './wallet.validation';

export function registerWalletDocs() {
  const registerWallet = (opts: Parameters<typeof registerApiRoute>[0]) => {
    registerApiRoute({ tags: ['Wallet'], ...opts });
  };

  // payout method connect
  registerWallet({
    method: 'post',
    path: '/wallets/payout-method/connect',
    summary: 'Payout method connect',
    roles: ['Professional'],
    body: WalletValidations.connectPayoutMethod.shape.body,
    isAuth: true,
  });

  // payout withdrawal
  registerWallet({
    method: 'post',
    path: '/wallets/payout-withdrawal',
    summary: 'Payout withdrawal',
    roles: ['Professional'],
    params: WalletValidations.payoutWithdrawal.shape.body,
    isAuth: true,
  });

  // get my wallet
  registerWallet({
    method: 'get',
    path: '/wallets/me',
    summary: 'Get my wallet',
    roles: ['Professional'],
    isAuth: true,
  });
}
