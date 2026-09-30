export enum TransactionReferenceType {
    Appointment = 'appointment',
    ChairRental = 'chair_rental',
    Wallet = 'wallet',
}

export enum TransactionGateway {
    Stripe = 'stripe',
    Paypal = 'paypal',
    Manual = 'manual',
}

export enum TransactionType {
    Payment = 'payment',
    Refund = 'refund',
    Payout = 'payout',
}

export enum TransactionStatus {
    Pending = 'pending',
    Completed = 'completed',
    Failed = 'failed',
    Cancelled = 'cancelled',
}