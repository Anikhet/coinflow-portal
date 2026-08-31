import type { EmptyGlyphName } from '@/components/icons/empty-glyphs'
import {
  House, Wallet, CreditCard, Users, Gavel, Unlink, ClipboardList,
  ChartColumnBig, Gauge, BookCheck, ShieldCheck, FileSearch, BanknoteX,
  type LucideIcon,
} from 'lucide-react'

/**
 * SIDEBAR INFORMATION ARCHITECTURE
 * =============================================================================
 * Two deliberate departures from the original nav:
 *
 * 1. GROUPING. The original filed all eleven destinations under a single
 *    "PAYMENTS & PAYOUTS" heading, which makes the heading meaningless and
 *    forces linear scanning of the whole list. Splitting into four intent-based
 *    groups (money movement / disputes / compliance) means an operator scans
 *    one group of 2-5, not a list of 11.
 *
 * 2. ICON DISTINCTNESS. The original used a shield for five different
 *    chargeback and compliance routes, so icon shape carried zero information
 *    and every item had to be read as text. Here every icon is a distinct
 *    silhouette and each one is semantically loaded.
 *
 *    Icons are chosen for what they DEPICT, not for the word in the label —
 *    Lucide's own icon design guide makes this point (floppy-disk, not "save").
 *    Droplets for "Liquidity" was the failure mode: it illustrates the metaphor
 *    buried in the word rather than the thing on the page, which is a balance
 *    of available funds. Two icons here therefore disagree with their label's
 *    imagery on purpose:
 *
 *      Wallet         liquidity — funds you can draw on, not water
 *      Gavel          chargebacks — an adjudicated dispute. Stripe and Adyen
 *                     both file this under "Disputes"; the gavel is the settled
 *                     convention for it, and it beats a generic undo arrow that
 *                     could equally mean refund, void or reversal.
 *      Unlink         unmatched — a broken association, literally
 *      ClipboardList  chargeback ops — a work QUEUE. The old wrench read as a
 *                     settings screen, which is the one thing ops is not.
 *      ChartColumnBig chargeback analytics — aggregate, not per-case
 *      Gauge          exposure — a level being watched against a limit
 *      BookCheck      compliance center — a rulebook, audited
 *      FileSearch     refund review — a queue of things to read
 *      BanknoteX      ACH returns — a bank debit that came back rejected. The
 *                     old corner arrow said only "something went backwards".
 *
 *    Exactly ONE shield survives (3DS Stats), so the shield silhouette now
 *    uniquely identifies a single destination.
 */

export interface NavItem {
  label: string
  to: string
  icon: LucideIcon
  /**
   * The mark its placeholder page draws. Named here beside the nav icon so the
   * two are chosen together — the outline in the rail and the solid glyph on
   * the page it leads to should be the same idea, and a route added later
   * cannot forget one of them.
   */
  glyph: EmptyGlyphName
  /** Live counts render as a tabular badge; undefined renders nothing. */
  badge?: number
  /** Routes not implemented in this prototype are visibly inert, not broken. */
  placeholder?: boolean
}

export interface NavGroup {
  label: string | null
  items: NavItem[]
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: null,
    items: [
      { label: 'Home', to: '/', glyph: 'overview', icon: House },
      { label: 'Liquidity', to: '/liquidity', glyph: 'liquidity', icon: Wallet, placeholder: true },
    ],
  },
  {
    label: 'Money movement',
    items: [
      { label: 'Purchases', to: '/purchases', glyph: 'payments', icon: CreditCard },
      { label: 'Customers', to: '/customers', glyph: 'customers', icon: Users },
    ],
  },
  {
    label: 'Disputes & risk',
    items: [
      { label: 'Chargebacks', to: '/chargebacks', glyph: 'disputes', icon: Gavel, badge: 12, placeholder: true },
      { label: 'Unmatched', to: '/unmatched', glyph: 'unmatched', icon: Unlink, badge: 3, placeholder: true },
      { label: 'Chargeback Ops', to: '/chargeback-ops', glyph: 'queue', icon: ClipboardList, placeholder: true },
      { label: 'Chargeback Analytics', to: '/chargeback-analytics', glyph: 'analytics', icon: ChartColumnBig, placeholder: true },
      { label: 'Exposure', to: '/exposure', glyph: 'exposure', icon: Gauge, placeholder: true },
    ],
  },
  {
    label: 'Compliance',
    items: [
      { label: 'Compliance Center', to: '/compliance', glyph: 'rulebook', icon: BookCheck, placeholder: true },
      { label: '3DS Stats', to: '/3ds', glyph: 'authentication', icon: ShieldCheck, placeholder: true },
      { label: 'ACH Refund Review', to: '/ach-refunds', glyph: 'review', icon: FileSearch, badge: 5, placeholder: true },
      { label: 'ACH Returns', to: '/ach-returns', glyph: 'returns', icon: BanknoteX, placeholder: true },
    ],
  },
]
