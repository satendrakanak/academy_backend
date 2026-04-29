export enum OrderStatus {
  PENDING = 'PENDING', // created, not paid
  PAID = 'PAID', // payment success
  FAILED = 'FAILED', // payment failed
  CANCELLED = 'CANCELLED', // user/admin cancelled
  REFUNDED = 'REFUNDED', // refund done
}
