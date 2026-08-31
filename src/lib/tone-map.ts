import { BanknoteArrowUp, CircleDashed, Clock, Gavel, LoaderCircle, RotateCcw } from 'lucide-react'
import type { ComponentType } from 'react'
import {
  BanFilled, CircleCheckFilled, CircleXFilled, ClockFilled, HandOffFilled,
  LockFilled, LockOpenFilled, OctagonXFilled, ShieldCheckFilled,
  ShieldOffFilled, TrendingUpFilled, UnlockFilled, UserOffFilled,
} from '@/components/icons/filled-glyphs'
import type { Tone } from '@/types'
import type {
  OrchestrationAttempt,
  PaymentStatus,
  ProtectionState,
  ThreeDSState,
} from '@/types/payment'
import type { Customer, CustomerActivity, CustomerDispute, KycStatus } from '@/types/customer'

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
 *
 * EVERY state carries an icon, including the boring ones. A grid of controls
 * where three values have a glyph and three do not reads as a rendering bug —
 * the reader cannot tell whether the missing mark means "normal" or "we failed
 * to draw it". Where a field has its own glyph family the default uses it
 * (protection Enabled is a shield, 3DS Functional is a padlock); where it does
 * not, the default takes CircleCheckFilled, which is the app's one mark for
 * "nothing unusual here".
 *
 * A healthy default is toned `positive`, not `neutral`: "Standard" on a fraud
 * control is not an absent value, it is a control confirmed to be in its
 * correct posture, and the tick that says so should be the same green as a
 * settled payment. `isDefault` — not the tone — is what keeps such a value
 * quiet: `ControlValue` colours the GLYPH by tone but leaves a default's LABEL
 * in plain ink, so a deviating value is still the only coloured TEXT in the
 * grid. States that genuinely mean "this never happened" (Not enrolled, No KYC,
 * Skipped) stay `neutral`, because there is nothing there to call healthy.
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
    // Informational, not neutral: a refund is a deliberate reversal someone
    // performed, not an absent value. Blue says "something happened here, and
    // it was not a failure" — the one reading a grey chip could not give.
    case 'refunded':  return { tone: 'info', label: 'Refunded', icon: RotateCcw }
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
    case 'approved': return { tone: 'positive', label: 'Protected', isDefault: true, icon: ShieldCheckFilled }
    // A refusal gets the stop-sign, not another shield: at 12px the shield
    // family's silhouettes differ only by their knocked-out mark, so "claim
    // refused" and "no cover bought" were telling themselves apart on a 2px
    // detail. The octagon separates them by OUTLINE, before colour or mark.
    case 'declined': return { tone: 'critical', label: 'Declined', icon: OctagonXFilled }
    // Caution, not neutral: an unprotected payment is an exposure the merchant
    // carries, not a missing field. Grey read as "nothing to see" when the
    // honest reading is "this one is uncovered". It stays below critical
    // because no claim has actually been refused.
    case 'standard': return { tone: 'caution', label: 'None', icon: ShieldOffFilled }
  }
}

/**
 * Uses `info`, not `positive`, for a successful authentication.
 *
 * Green in a row means "this money is where it should be" — the payment
 * settled, the funds were disbursed. A passed 3DS challenge is not that: it is
 * a step of the process reporting a clean result, which is what `info` says.
 * Keeping the authentication columns off green means the reader never has to
 * check WHICH column a green chip is in to know what it is claiming.
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
    // No pulse. The other in-flight states carry a LoaderCircle, whose whole
    // form is a rotating arc — spinning it is what the glyph is for. A clock
    // face read as spinning instead says time is racing, and it sat in a
    // static list of past activity where nothing was actually resolving.
    case 'pending':   return { tone: 'caution', label: 'Pending', icon: ClockFilled }
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
/**
 * Exception wording, per control.
 *
 * The exceptions list needs a label that stands alone in a row of chips — a
 * bare "Off" or "Not found" says nothing once it is lifted out of its column —
 * so only the WORDING is restated here. The tone and the glyph still come from
 * the control's own mapper below, which is what stops the two from drifting.
 * They already had: this list drew fraud-override exceptions with a shield
 * while the column beside it drew the same states with a tick and an octagon.
 */
const EXCEPTION_LABELS = {
  protection: 'Unprotected',
  threeDSProcessing: { degraded: '3DS degraded', off: '3DS off' },
  attemptLimit: { restricted: 'Attempts restricted', elevated: 'Attempts elevated' },
  verification: { 'not-found': 'Unverified' },
  fraudOverride: { allow: 'Fraud allow', deny: 'Fraud deny' },
} as const

/** Restates a descriptor's label while keeping its tone and glyph intact. */
function relabel(descriptor: ToneDescriptor, label: string | undefined): ToneDescriptor {
  return label ? { ...descriptor, label } : descriptor
}

export function customerExceptions(customer: Customer): ToneDescriptor[] {
  const { threeDSProcessing, attemptLimit, verification, fraudOverride } = customer

  // Every candidate is produced by the same mapper that renders that control's
  // own column, so a chip here and the cell it summarises can never disagree
  // about colour or glyph. `isDefault` — already the registry's word for "this
  // value is the boring one" — is exactly the test for whether something is an
  // exception, so the filter needs no second list of which states count.
  const candidates: ToneDescriptor[] = [
    blockedTone(customer.blocked),
    relabel(customerProtectionTone(customer.protectionEnabled), EXCEPTION_LABELS.protection),
    relabel(threeDSProcessingTone(threeDSProcessing), EXCEPTION_LABELS.threeDSProcessing[threeDSProcessing as 'degraded' | 'off']),
    relabel(attemptLimitTone(attemptLimit), EXCEPTION_LABELS.attemptLimit[attemptLimit as 'restricted' | 'elevated']),
    relabel(verificationTone(verification), EXCEPTION_LABELS.verification[verification as 'not-found']),
    relabel(fraudOverrideTone(fraudOverride), EXCEPTION_LABELS.fraudOverride[fraudOverride as 'allow' | 'deny']),
  ]

  const out = candidates.filter((descriptor) => !descriptor.isDefault)

  // Disputes are a count, not a control, so there is no column mapper to
  // borrow from — but the gavel and the critical tone are the same ones
  // disputeStatusTone and the Chargebacks nav item use.
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
    ? { tone: 'positive', label: 'Enabled', isDefault: true, icon: ShieldCheckFilled }
    : { tone: 'caution', label: 'Disabled', icon: ShieldOffFilled }
}

export function blockedTone(blocked: boolean): ToneDescriptor {
  return blocked
    ? { tone: 'critical', label: 'Blocked', icon: BanFilled }
    : { tone: 'positive', label: 'Not blocked', isDefault: true, icon: CircleCheckFilled }
}

export function threeDSProcessingTone(state: Customer['threeDSProcessing']): ToneDescriptor {
  switch (state) {
    case 'functional': return { tone: 'positive', label: 'Functional', isDefault: true, icon: LockFilled }
    case 'degraded':   return { tone: 'caution', label: 'Degraded', icon: LockOpenFilled }
    case 'off':        return { tone: 'critical', label: 'Off', icon: UnlockFilled }
  }
}

export function attemptLimitTone(limit: Customer['attemptLimit']): ToneDescriptor {
  switch (limit) {
    case 'standard':   return { tone: 'positive', label: 'Standard', isDefault: true, icon: CircleCheckFilled }
    case 'restricted': return { tone: 'caution', label: 'Restricted', icon: HandOffFilled }
    case 'elevated':   return { tone: 'info', label: 'Elevated', icon: TrendingUpFilled }
  }
}

export function verificationTone(state: Customer['verification']): ToneDescriptor {
  switch (state) {
    case 'enforced':  return { tone: 'positive', label: 'Enforced', isDefault: true, icon: ShieldCheckFilled }
    case 'not-found': return { tone: 'caution', label: 'Not found', icon: UserOffFilled }
    case 'standard':  return { tone: 'positive', label: 'Standard', isDefault: true, icon: CircleCheckFilled }
  }
}

export function fraudOverrideTone(override: Customer['fraudOverride']): ToneDescriptor {
  switch (override) {
    case 'standard': return { tone: 'positive', label: 'Standard', isDefault: true, icon: CircleCheckFilled }
    case 'allow':    return { tone: 'info', label: 'Always allow', icon: CircleCheckFilled }
    case 'deny':     return { tone: 'critical', label: 'Always deny', icon: OctagonXFilled }
  }
}

/**
 * Outcome of one processor attempt in a routing chain.
 *
 * In the registry rather than inline in the drawer so a succeeded/failed
 * outcome carries the same tone and glyph as every other success and failure
 * in the app — previously the routing chain hand-built its own pills with dots
 * while every other status used the registry's glyphs.
 */
export function attemptOutcomeTone(
  outcome: OrchestrationAttempt['outcome'],
  /**
   * Whether another processor was tried after this one. A failure only "failed
   * OVER" if something caught it — on the last attempt, or on the chain's
   * overall result, the honest word is just "Failed".
   */
  hasFallback = false,
): ToneDescriptor {
  switch (outcome) {
    case 'succeeded': return { tone: 'positive', label: 'Succeeded', icon: CircleCheckFilled }
    case 'failed':    return { tone: 'critical', label: hasFallback ? 'Failed over' : 'Failed', icon: CircleXFilled }
    case 'skipped':   return { tone: 'neutral', label: 'Skipped', isDefault: true, icon: CircleDashed }
  }
}

/**
 * Whether settlement funds have reached the merchant.
 *
 * `Sent` is toned positive rather than neutral: funds landing is the outcome
 * the merchant actually cares about, and rendering it grey made the column's
 * one meaningful value indistinguishable from an empty cell. The absent state
 * stays a default, so the column still reads as "green where money moved,
 * quiet everywhere else" rather than two competing chips per row.
 *
 * In the registry like every other cell value, so the Disbursed column stops
 * being the one table cell that hand-writes its own tone and label.
 */
export function disbursedTone(disbursed: boolean): ToneDescriptor {
  return disbursed
    ? { tone: 'positive', label: 'Sent', icon: BanknoteArrowUp }
    : { tone: 'neutral', label: 'Not disbursed', isDefault: true, icon: ClockFilled }
}

/**
 * The all-clear: a record whose every control sits at its default.
 *
 * Lives in the registry rather than in the drawer that renders it, because it
 * is the same statement the tables make by rendering a row of em-dashes — and
 * because a hand-written all-clear elsewhere would be free to pick a different
 * shield and a different green.
 */
export function allClearTone(): ToneDescriptor {
  return { tone: 'positive', label: 'No exceptions', icon: ShieldCheckFilled }
}

/** Outcome of a chargeback dispute. */
export function disputeStatusTone(status: CustomerDispute['status']): ToneDescriptor {
  switch (status) {
    case 'won':          return { tone: 'positive', label: 'Won', icon: CircleCheckFilled }
    case 'lost':         return { tone: 'critical', label: 'Lost', icon: CircleXFilled }
    case 'under-review': return { tone: 'caution', label: 'Under review', icon: Clock }
    case 'open':         return { tone: 'caution', label: 'Open', icon: Gavel }
  }
}

export function signalCountTone(count: number, threshold: number): Tone {
  if (count > threshold * 2) return 'critical'
  if (count > threshold) return 'caution'
  return 'neutral'
}
