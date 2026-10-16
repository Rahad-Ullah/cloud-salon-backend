
export type ICreateAccount = {
  name?: string;
  email: string;
  otp: number;
};

export type IResetPassword = {
  name?: string;
  email: string;
  otp: number;
};

export interface ILowBalanceWarning {
  adminEmail: string;
  gatewayName: string;
  currentBalance: number;
  requiredBalance: number;
  currency: string;
}