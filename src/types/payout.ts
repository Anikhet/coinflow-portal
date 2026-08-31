/**
 * Payout rails, matching the methods the production dashboard charts.
 *
 * Note these are CUSTOMER withdrawals — money leaving the platform to an end
 * user — which is a different flow from merchant settlement. The original
 * dashboard charts the former and totals the latter separately, so the two are
 * modelled separately here too.
 */
export type PayoutRail =
  | 'asap-rtp'
  | 'same-day'
  | 'standard'
  | 'card'
  | 'paypal'
  | 'venmo'
  | 'iban'
  | 'wire'
  | 'interac'
  | 'eft'

export interface Payout {
  id: string
  createdAt: string
  merchant: string
  rail: PayoutRail
  amount: number
  status: 'completed' | 'pending' | 'failed'
}

/** One merchant's settlement total for the period. */
export interface MerchantPayout {
  merchant: string
  amount: number
  count: number
  /** Share of the period's total, 0–1. Precomputed so the bar has no math in the view. */
  share: number
}

/** One slice of the card-volume breakdown. */
export interface CardSlice {
  key: string
  label: string
  amount: number
  count: number
  share: number
}
