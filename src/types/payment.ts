export type PaymentStatus =
  | 'settled'
  | 'initiated'
  | 'failed'
  | 'refunded'
  | 'disputed'

export type PaymentMethod =
  | 'card'
  | 'apple-pay'
  | 'google-pay'
  | 'venmo'
  | 'paypal'
  | 'cashapp'
  | 'bank'
  | 'crypto'
  | 'pix'

export type Processor = 'fifththird' | 'highnote' | 'mvb' | 'checkout' | 'stripe'

/**
 * Attribute states. `standard` is the DEFAULT value for each attribute and is
 * rendered as an em-dash rather than a pill — see the pill taxonomy in
 * `components/ui/pill.tsx`. Only non-default values earn visual weight.
 */
export type ProtectionState = 'approved' | 'declined' | 'standard'
export type ThreeDSState = 'authenticated' | 'attempted' | 'failed' | 'standard'

export interface PaymentFee {
  label: string
  total: number
  paidByMerchant: number
  paidByCustomer: number
}

export interface OrchestrationAttempt {
  processor: Processor
  outcome: 'succeeded' | 'failed' | 'skipped'
}

export interface Payment {
  id: string
  shortId: string
  createdAt: string
  merchant: string
  method: PaymentMethod
  processor: Processor
  cardBrand: 'visa' | 'mastercard' | 'amex' | null
  cardLast4: string | null
  cardExpiry: string | null
  subtotal: number
  customerId: string
  customerName: string
  customerEmail: string
  status: PaymentStatus
  responseCode: string
  responseLabel: string
  disbursed: boolean
  protection: ProtectionState
  threeDS: ThreeDSState
  chainTx: string | null
  chainWallet: string | null
  issuer: string
  issuerCountry: string
  fundingType: 'debit' | 'credit' | 'prepaid'
  cvvResponse: string
  cvvLabel: string
  statementDescriptor: string
  transactionType: string
  orchestrationRule: string
  attempts: OrchestrationAttempt[]
  fees: PaymentFee[]
}
