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
      { label: 'Home', to: '/', icon: House },
      { label: 'Liquidity', to: '/liquidity', icon: Wallet, placeholder: true },
    ],
  },
  {
    label: 'Money movement',
    items: [
      { label: 'Purchases', to: '/purchases', icon: CreditCard },
      { label: 'Customers', to: '/customers', icon: Users },
    ],
  },
  {
    label: 'Disputes & risk',
    items: [
      { label: 'Chargebacks', to: '/chargebacks', icon: Gavel, badge: 12, placeholder: true },
      { label: 'Unmatched', to: '/unmatched', icon: Unlink, badge: 3, placeholder: true },
      { label: 'Chargeback ops', to: '/chargeback-ops', icon: ClipboardList, placeholder: true },
      { label: 'Chargeback analytics', to: '/chargeback-analytics', icon: ChartColumnBig, placeholder: true },
      { label: 'Exposure', to: '/exposure', icon: Gauge, placeholder: true },
    ],
  },
  {
    label: 'Compliance',
    items: [
      { label: 'Compliance center', to: '/compliance', icon: BookCheck, placeholder: true },
      { label: '3DS stats', to: '/3ds', icon: ShieldCheck, placeholder: true },
      { label: 'ACH refund review', to: '/ach-refunds', icon: FileSearch, badge: 5, placeholder: true },
      { label: 'ACH returns', to: '/ach-returns', icon: BanknoteX, placeholder: true },
    ],
  },
]
