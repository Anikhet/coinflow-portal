import { CircleDashed, Gavel, LoaderCircle, RotateCcw } from 'lucide-react'
import type { ComponentType } from 'react'
import {
  BanFilled, CircleCheckFilled, CircleXFilled, ClockFilled, HandOffFilled,
  LockFilled, LockOpenFilled, OctagonXFilled, ShieldCheckFilled,
  ShieldOffFilled, ShieldXFilled, TrendingUpFilled, UnlockFilled, UserOffFilled,
} from '@/components/icons/filled-glyphs'
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
  /**
   * Glyph rendered inside the pill. Lives in the registry beside the tone and
   * the label for the same reason they do: a shield-with-a-tick next to the
   * word "Declined" is exactly the contradiction this module exists to make
   * impossible. Only the attribute columns set one — status pills carry a dot
   * instead, and adding a glyph there would put two marks in one pill.
   *
   * Typed structurally rather than as `LucideIcon` so the hand-drawn filled
   * glyphs sit in the registry alongside the lucide ones. Every call site
   * passes exactly these two props.
   */
  icon?: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
}

export function paymentStatusTone(status: PaymentStatus): ToneDescriptor {
  switch (status) {
    case 'settled':   return { tone: 'positive', label: 'Settled', icon: CircleCheckFilled }
    case 'initiated': return { tone: 'caution', label: 'Initiated', pulse: true, icon: LoaderCircle }
    case 'failed':    return { tone: 'critical', label: 'Failed', icon: CircleXFilled }
    case 'refunded':  return { tone: 'neutral', label: 'Refunded', icon: RotateCcw }
    // Same gavel as the Chargebacks nav item: one concept, one glyph, across
    // navigation and data.
    case 'disputed':  return { tone: 'critical', label: 'Disputed', icon: Gavel }
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
    // Shield family throughout: chargeback protection IS a shield product, and
    // keeping one column to one family means the glyph identifies the COLUMN
    // as fast as the state.
    case 'approved': return { tone: 'neutral', label: 'Protected', isDefault: true, icon: ShieldCheckFilled }
    // A refusal gets the stop-sign, not another shield: at 12px the shield
    // family's silhouettes differ only by their knocked-out mark, so "claim
    // refused" and "no cover bought" were telling themselves apart on a 2px
    // detail. The octagon separates them by OUTLINE, before colour or mark.
    case 'declined': return { tone: 'critical', label: 'Declined', icon: OctagonXFilled }
    case 'standard': return { tone: 'neutral', label: 'None', icon: ShieldOffFilled }
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
    // Padlock family, per the checkout convention: a closed padlock is the
    // near-universal mark for a completed 3DS/SCA challenge. `Ban` for a
    // failure rather than a second ShieldX, because the Protection column
    // sitting immediately to the left already owns that silhouette — the same
    // glyph in adjacent columns meaning two different things is worse than no
    // glyph at all.
    case 'authenticated': return { tone: 'info', label: 'Authenticated', icon: LockFilled }
    case 'attempted':     return { tone: 'caution', label: 'Attempted', icon: LockOpenFilled }
    // Same octagon as a declined protection claim. Sharing it across the two
    // columns is right here — both mean "actively refused", and one mark for
    // one meaning is the point. What must never be shared is one mark for two
    // DIFFERENT meanings.
    case 'failed':        return { tone: 'critical', label: 'Failed', icon: OctagonXFilled }
    case 'standard':      return { tone: 'neutral', label: 'Not enrolled', isDefault: true, icon: LockOpenFilled }
  }
}

export function kycTone(status: KycStatus): ToneDescriptor {
  switch (status) {
    // The same four glyphs a payment outcome uses. KYC used to carry a
    // person-shaped set of its own, on the theory that identity verification
    // is a different kind of thing from a payment outcome. But the SHAPE of
    // the question is identical — did it pass, is it in flight, did it fail —
    // and two vocabularies for one question shape means the reader learns the
    // icon set twice. One vocabulary; the label says which subject it is about.
    case 'verified':    return { tone: 'positive', label: 'KYC Verified', icon: CircleCheckFilled }
    case 'pending':     return { tone: 'caution', label: 'KYC Pending', pulse: true, icon: LoaderCircle }
    case 'not-started': return { tone: 'neutral', label: 'No KYC', isDefault: true, icon: CircleDashed }
    case 'rejected':    return { tone: 'critical', label: 'KYC Rejected', icon: CircleXFilled }
  }
}

export function activityTone(status: CustomerActivity['status']): ToneDescriptor {
  switch (status) {
    case 'settled':   return { tone: 'positive', label: 'Settled', icon: CircleCheckFilled }
    case 'completed': return { tone: 'positive', label: 'Completed', icon: CircleCheckFilled }
    case 'pending':   return { tone: 'caution', label: 'Pending', pulse: true, icon: ClockFilled }
    case 'failed':    return { tone: 'critical', label: 'Failed', icon: CircleXFilled }
    case 'opened':    return { tone: 'critical', label: 'Dispute opened', icon: Gavel }
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

  // Glyphs reuse the same vocabulary as the columns they summarise: shields for
  // protection, padlocks for 3DS, the gavel for disputes.
  if (customer.blocked) out.push({ tone: 'critical', label: 'Blocked', icon: BanFilled })
  if (!customer.protectionEnabled) out.push({ tone: 'caution', label: 'Unprotected', icon: ShieldOffFilled })
  if (customer.threeDSProcessing === 'degraded') out.push({ tone: 'caution', label: '3DS degraded', icon: LockOpenFilled })
  if (customer.threeDSProcessing === 'off') out.push({ tone: 'critical', label: '3DS off', icon: UnlockFilled })
  if (customer.attemptLimit === 'restricted') out.push({ tone: 'caution', label: 'Attempts restricted', icon: HandOffFilled })
  if (customer.attemptLimit === 'elevated') out.push({ tone: 'info', label: 'Attempts elevated', icon: TrendingUpFilled })
  if (customer.verification === 'not-found') out.push({ tone: 'caution', label: 'Unverified', icon: UserOffFilled })
  if (customer.fraudOverride === 'allow') out.push({ tone: 'info', label: 'Fraud allow', icon: ShieldCheckFilled })
  if (customer.fraudOverride === 'deny') out.push({ tone: 'critical', label: 'Fraud deny', icon: ShieldXFilled })
  if (customer.disputeCount > 0) {
    out.push({
      tone: 'critical',
      icon: Gavel,
      label: `${customer.disputeCount} dispute${customer.disputeCount > 1 ? 's' : ''}`,
    })
  }

  return out
}

/**
 * Distinct-value counts are a fraud signal: one customer transacting from many
 * IPs or under many names warrants attention. Thresholds are per-signal because
 * the base rates differ — several IPs is common (mobile/travel), several names
 * on one account is not.
 */
/**
 * CUSTOMER CONTROL COLUMNS
 * -----------------------------------------------------------------------------
 * One mapper per attribute column on the Customers table.
 *
 * Each marks its MAJORITY value as the default, so a customer operating
 * normally renders six em-dashes rather than six near-identical green pills.
 * This is the same rule the payments table uses, applied to the columns where
 * the original was densest: the information is all still there, in the same
 * columns, but ink is spent only where something deviates.
 */

export function customerProtectionTone(enabled: boolean): ToneDescriptor {
  return enabled
    ? { tone: 'neutral', label: 'Enabled', isDefault: true, icon: ShieldCheckFilled }
    : { tone: 'caution', label: 'Disabled', icon: ShieldOffFilled }
}

export function blockedTone(blocked: boolean): ToneDescriptor {
  return blocked
    ? { tone: 'critical', label: 'Blocked', icon: BanFilled }
    : { tone: 'neutral', label: 'Not blocked', isDefault: true }
}

export function threeDSProcessingTone(state: Customer['threeDSProcessing']): ToneDescriptor {
  switch (state) {
    case 'functional': return { tone: 'neutral', label: 'Functional', isDefault: true, icon: LockFilled }
    case 'degraded':   return { tone: 'caution', label: 'Degraded', icon: LockOpenFilled }
    case 'off':        return { tone: 'critical', label: 'Off', icon: UnlockFilled }
  }
}

export function attemptLimitTone(limit: Customer['attemptLimit']): ToneDescriptor {
  switch (limit) {
    case 'standard':   return { tone: 'neutral', label: 'Standard', isDefault: true }
    case 'restricted': return { tone: 'caution', label: 'Restricted', icon: HandOffFilled }
    case 'elevated':   return { tone: 'info', label: 'Elevated', icon: TrendingUpFilled }
  }
}

export function verificationTone(state: Customer['verification']): ToneDescriptor {
  switch (state) {
    case 'enforced':  return { tone: 'neutral', label: 'Enforced', isDefault: true, icon: ShieldCheckFilled }
    case 'not-found': return { tone: 'caution', label: 'Not found', icon: UserOffFilled }
    case 'standard':  return { tone: 'neutral', label: 'Standard', isDefault: true }
  }
}

export function fraudOverrideTone(override: Customer['fraudOverride']): ToneDescriptor {
  switch (override) {
    case 'standard': return { tone: 'neutral', label: 'Standard', isDefault: true }
    case 'allow':    return { tone: 'info', label: 'Always allow', icon: CircleCheckFilled }
    case 'deny':     return { tone: 'critical', label: 'Always deny', icon: OctagonXFilled }
  }
}

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
