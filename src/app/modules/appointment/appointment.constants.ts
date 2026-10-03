export enum AppointmentStatus {
  Pending = 'pending',
  Confirmed = 'confirmed',
  Cancelled = 'cancelled',
  Rejected = 'rejected',
  AutoCancelled = 'auto_cancelled',
  Active = 'active',
  Completed = 'completed',
}

export enum PaymentStatus {
  Paid = 'paid',
  Unpaid = 'unpaid',
  Refunded = 'refunded',
}
