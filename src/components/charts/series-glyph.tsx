import { ArrowRightLeft, Banknote, Clock, Globe, Landmark, Network, Sigma, Zap } from 'lucide-react'
import { MethodGlyph } from '@/components/icons/method-icon'
import type { PaymentMethod } from '@/types/payment'
import type { PayoutRail } from '@/types/payout'
import { TOTAL_KEY } from './series'

/**
 * Resolves a chart series key to its mark.
 *
 * The two charts on the dashboard are keyed differently — one by payment
 * method, the other by payout rail — and they share this picker, so a single
 * resolver has to cover both. Method keys reuse the same brand marks the tables
 * use, so Apple Pay looks identical wherever it appears.
 *
 * Rails have no brand marks to reuse (nobody ships an "ACH Same Day" logo), so
 * they take a lucide glyph chosen for what the rail IS — a lightning bolt for
 * instant, a clock for same-day, a bank front for the wire rails. Every mark
 * renders in the same 20px box so rows stay aligned whichever chart is open.
 */

const METHOD_KEYS = new Set<PaymentMethod>([
  'card', 'apple-pay', 'google-pay', 'venmo', 'paypal', 'cashapp', 'bank', 'crypto', 'pix',
])

/**
 * Rails, by what the rail actually is rather than by who operates it.
 *
 * Every silhouette is distinct. A first pass gave IBAN, EFT and Interac the
 * same bank glyph, which is the failure this app already fixed in the sidebar:
 * three identical marks carry no information, and the reader has to fall back
 * to reading every label anyway.
 */
const RAIL_ICON: Partial<Record<PayoutRail, typeof Zap>> = {
  'asap-rtp': Zap,          // instant
  'same-day': Clock,        // settles today
  standard: Banknote,       // the slow default
  iban: Globe,              // international account number
  wire: ArrowRightLeft,     // bank-to-bank transfer
  interac: Landmark,        // a specific domestic bank network
  eft: Network,             // batched electronic transfer
}

const BOX = 'inline-flex size-5 shrink-0 items-center justify-center'

export function SeriesGlyph({ seriesKey }: { seriesKey: string }) {
  if (seriesKey === TOTAL_KEY) {
    return (
      <span className={BOX} aria-hidden>
        <Sigma className="size-3.5 text-ink-faint" />
      </span>
    )
  }

  // Card and the wallets are shared between both charts, so methods win first.
  if (METHOD_KEYS.has(seriesKey as PaymentMethod)) {
    return <MethodGlyph method={seriesKey as PaymentMethod} cardBrand="visa" />
  }

  const RailIcon = RAIL_ICON[seriesKey as PayoutRail]
  if (RailIcon) {
    return (
      <span className={BOX} aria-hidden>
        <RailIcon className="size-3.5 text-ink-muted" />
      </span>
    )
  }

  // Unknown key: hold the box so the column does not jump rather than
  // rendering nothing.
  return <span className={BOX} aria-hidden />
}
