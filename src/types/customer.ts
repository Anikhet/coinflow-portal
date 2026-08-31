export type KycStatus = 'verified' | 'pending' | 'not-started' | 'rejected'

/**
 * A fraud-signal row. `count` and `volume` describe how much activity flows
 * through one distinct value (a name, a billing address, an IP). A high
 * cardinality of distinct values for a single customer is the fraud signal —
 * which is why the UI colors the *count of rows*, not the rows themselves.
 */
export interface SignalRow {
  value: string
  count: number
  volume: number
}

export interface CustomerCard {
  id: string
  brand: 'visa' | 'mastercard' | 'amex'
  last4: string
  expiry: string
  paymentCount: number
  addedAt: string
  firstPaymentAt: string | null
  billingAddress: string
}

export interface CustomerActivity {
  id: string
  kind: 'payment' | 'payout' | 'dispute' | 'method-added'
  at: string
  amount: number
  status: 'settled' | 'failed' | 'completed' | 'pending' | 'opened'
  brand: 'visa' | 'mastercard' | 'amex' | null
  rail: string | null
  responseCode: string | null
  note: string | null
}

/** A dispute raised against one of this customer's payments. */
export interface CustomerDispute {
  id: string
  openedAt: string
  amount: number
  reasonCode: string
  reason: string
  status: 'open' | 'won' | 'lost' | 'under-review'
}

/** One entry in the customer's audit trail. */
export interface AuditEntry {
  id: string
  at: string
  actor: string
  action: string
  detail: string
}

export interface Customer {
  id: string
  shortId: string
  createdAt: string
  merchant: string
  name: string
  email: string
  protectionEnabled: boolean
  blocked: boolean
  threeDSProcessing: 'functional' | 'degraded' | 'off'
  attemptLimit: 'standard' | 'restricted' | 'elevated'
  verification: 'enforced' | 'not-found' | 'standard'
  fraudOverride: 'standard' | 'allow' | 'deny'
  kyc: KycStatus
  totalVolume: number
  paymentCount: number
  overriddenVolume: number
  overriddenCount: number
  disputeCount: number
  names: SignalRow[]
  billingAddresses: SignalRow[]
  ipLocations: SignalRow[]
  cards: CustomerCard[]
  activity: CustomerActivity[]
  disputes: CustomerDispute[]
  auditLog: AuditEntry[]
}
