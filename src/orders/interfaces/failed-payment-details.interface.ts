export interface FailedPaymentDetails {
  method?: string | null;
  bank?: string | null;
  wallet?: string | null;
  vpa?: string | null;
  cardId?: string | null;
  errorCode?: string | null;
  errorDescription?: string | null;
}
