import type { Tone } from '@/types'
import type {
  PaymentStatus,
  ProtectionState,
  ThreeDSState,
} from '@/types/payment'
import type { Customer, CustomerActivity, KycStatus } from '@/types/customer'

/**
 * DOMAIN → TONE REGISTRY
 * =============================================================================
 * Every mapping from a business value to a color lives here and nowhere else.
 *
 * The reason for centralising: "settled" appears in the payments table, the
 * payment drawer, the customer activity timeline and the home page. If each
 * call site chose its own green, they would drift the moment one is edited.
 * A single registry makes drift impossible — there is one place to change.
 *
 * Each mapper returns both a tone and a display label so the two can never
 * disagree (e.g. a green pill reading "Failed").
 */

export interface ToneDescriptor {
  tone: Tone
  label: string
  /** Whether this value is the default/uninteresting one and should be hidden. */
  isDefault?: boolean
  /** In-flight states pulse their dot. */
  pulse?: boolean
}

export function paymentStatusTone(status: PaymentStatus): ToneDescriptor {
  switch (status) {
    case 'settled':   return { tone: 'positive', label: 'Settled' }
    case 'initiated': return { tone: 'caution', label: 'Initiated', pulse: true }
    case 'failed':    return { tone: 'critical', label: 'Failed' }
    case 'refunded':  return { tone: 'neutral', label: 'Refunded' }
    case 'disputed':  return { tone: 'critical', label: 'Disputed' }
  }
}

/**
 * Protection inverts the usual polarity: ~three quarters of payments ARE
 * protected, so "approved" is the boring majority and rendering it as a pill
 * refills the column with noise — exactly the failure this taxonomy exists to
 * prevent. The DEFAULT here is therefore the *good* state, and only the
 * absence or refusal of protection earns ink.
 */
export function protectionTone(state: ProtectionState): ToneDescriptor {
  switch (state) {
    case 'approved': return { tone: 'neutral', label: 'Protected', isDefault: true }
    case 'declined': return { tone: 'critical', label: 'Declined' }
    case 'standard': return { tone: 'neutral', label: 'Unprotected' }
  }
}

/**
 * Uses `info`, not `positive`, for a successful authentication.
 *
 * Green is reserved for the Status column. Keeping every other column off the
 * positive tone means a green pill anywhere in a row can only mean "this
 * payment settled" — one glance, one meaning. Letting 3DS also render green
 * would put two unrelated greens in the same row and force the reader to
 * check which column they are in.
 */
export function threeDSTone(state: ThreeDSState): ToneDescriptor {
  switch (state) {
    case 'authenticated': return { tone: 'info', label: '3DS Auth' }
    case 'attempted':     return { tone: 'caution', label: '3DS Attempt' }
    case 'failed':        return { tone: 'critical', label: '3DS Failed' }
    case 'standard':      return { tone: 'neutral', label: 'Not enrolled', isDefault: true }
  }
}

export function kycTone(status: KycStatus): ToneDescriptor {
  switch (status) {
    case 'verified':    return { tone: 'positive', label: 'KYC Verified' }
    case 'pending':     return { tone: 'caution', label: 'KYC Pending' }
    case 'not-started': return { tone: 'neutral', label: 'No KYC', isDefault: true }
    case 'rejected':    return { tone: 'critical', label: 'KYC Rejected' }
  }
}

export function activityTone(status: CustomerActivity['status']): ToneDescriptor {
  switch (status) {
    case 'settled':   return { tone: 'positive', label: 'Settled' }
    case 'completed': return { tone: 'positive', label: 'Completed' }
    case 'pending':   return { tone: 'caution', label: 'Pending', pulse: true }
    case 'failed':    return { tone: 'critical', label: 'Failed' }
    case 'opened':    return { tone: 'critical', label: 'Dispute opened' }
  }
}

/**
 * Collapses a customer's many boolean/enum attribute columns into the list of
 * things that actually deviate from normal.
 *
 * The original UI rendered six columns of near-identical green pills, which is
 * unreadable at a glance. Here, a fully-default customer produces an EMPTY
 * array — the row stays quiet — and only genuine exceptions surface. This is
 * the table-level expression of pill taxonomy rule 5.
 */
export function customerExceptions(customer: Customer): ToneDescriptor[] {
  const out: ToneDescriptor[] = []

  if (customer.blocked) out.push({ tone: 'critical', label: 'Blocked' })
  if (!customer.protectionEnabled) out.push({ tone: 'caution', label: 'Unprotected' })
  if (customer.threeDSProcessing === 'degraded') out.push({ tone: 'caution', label: '3DS degraded' })
  if (customer.threeDSProcessing === 'off') out.push({ tone: 'critical', label: '3DS off' })
  if (customer.attemptLimit === 'restricted') out.push({ tone: 'caution', label: 'Attempts restricted' })
  if (customer.attemptLimit === 'elevated') out.push({ tone: 'info', label: 'Attempts elevated' })
  if (customer.verification === 'not-found') out.push({ tone: 'caution', label: 'Unverified' })
  if (customer.fraudOverride === 'allow') out.push({ tone: 'info', label: 'Fraud allow' })
  if (customer.fraudOverride === 'deny') out.push({ tone: 'critical', label: 'Fraud deny' })
  if (customer.disputeCount > 0) {
    out.push({ tone: 'critical', label: `${customer.disputeCount} dispute${customer.disputeCount > 1 ? 's' : ''}` })
  }

  return out
}

/**
 * Distinct-value counts are a fraud signal: one customer transacting from many
 * IPs or under many names warrants attention. Thresholds are per-signal because
 * the base rates differ — several IPs is common (mobile/travel), several names
 * on one account is not.
 */
export function signalCountTone(count: number, threshold: number): Tone {
  if (count > threshold * 2) return 'critical'
  if (count > threshold) return 'caution'
  return 'neutral'
}

/**
 * Human labels for the customer control enums.
 *
 * The raw union values ('not-found', 'degraded') are storage identifiers, not
 * copy. Rendering them directly leaks the data model into the interface and
 * produces lowercase, hyphenated text next to properly written labels.
 */
export const CONTROL_LABELS = {
  threeDSProcessing: {
    functional: 'Functional',
    degraded: 'Degraded',
    off: 'Off',
  },
  attemptLimit: {
    standard: 'Standard',
    restricted: 'Restricted',
    elevated: 'Elevated',
  },
  verification: {
    enforced: 'Enforced',
    'not-found': 'Not found',
    standard: 'Standard',
  },
  fraudOverride: {
    standard: 'Standard',
    allow: 'Always allow',
    deny: 'Always deny',
  },
} as const
