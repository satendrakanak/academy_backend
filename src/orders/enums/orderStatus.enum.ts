export enum OrderStatus {
  PENDING = 'PENDING', // created, not paid
  PAID = 'PAID', // payment success
  FAILED = 'FAILED', // payment failed
  CANCELLED = 'CANCELLED', // user/admin cancelled
  REFUND_REQUESTED = 'REFUND_REQUESTED', // user requested refund
  REFUND_APPROVED = 'REFUND_APPROVED', // admin approved refund
  REFUND_PROCESSING = 'REFUND_PROCESSING', // gateway processing refund
  REFUND_REJECTED = 'REFUND_REJECTED', // admin rejected refund
  REFUND_FAILED = 'REFUND_FAILED', // refund processing failed
  REFUNDED = 'REFUNDED', // refund done
}
