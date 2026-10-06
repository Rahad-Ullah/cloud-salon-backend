export enum PayoutProvider {
  STRIPE = 'stripe',
  // more providers to be added
}

export enum SupportedCurrency {
  USD = 'USD',
  // more currencies to be added
}

export enum WalletStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  PENDING_ONBOARDING = 'pending_onboarding',
}
