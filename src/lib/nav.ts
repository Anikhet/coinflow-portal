import {
  LayoutDashboard, Droplets, CreditCard, Users, Undo2, Unlink, Wrench,
  ChartColumnBig, Gauge, ScrollText, ShieldCheck, FileSearch, CornerUpLeft,
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
 *    silhouette and each one is semantically loaded:
 *
 *      Unlink      unmatched chargebacks — a broken association
 *      Undo2       chargebacks — money reversing
 *      CornerUpLeft ACH returns — a rail-level bounce back
 *      Wrench      chargeback ops — tooling, not analysis
 *      FileSearch  refund review — a queue of things to read
 *      Gauge       exposure — a level being watched
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
      { label: 'Home', to: '/', icon: LayoutDashboard },
      { label: 'Liquidity', to: '/liquidity', icon: Droplets, placeholder: true },
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
      { label: 'Chargebacks', to: '/chargebacks', icon: Undo2, badge: 12, placeholder: true },
      { label: 'Unmatched', to: '/unmatched', icon: Unlink, badge: 3, placeholder: true },
      { label: 'Chargeback ops', to: '/chargeback-ops', icon: Wrench, placeholder: true },
      { label: 'Chargeback analytics', to: '/chargeback-analytics', icon: ChartColumnBig, placeholder: true },
      { label: 'Exposure', to: '/exposure', icon: Gauge, placeholder: true },
    ],
  },
  {
    label: 'Compliance',
    items: [
      { label: 'Compliance center', to: '/compliance', icon: ScrollText, placeholder: true },
      { label: '3DS stats', to: '/3ds', icon: ShieldCheck, placeholder: true },
      { label: 'ACH refund review', to: '/ach-refunds', icon: FileSearch, badge: 5, placeholder: true },
      { label: 'ACH returns', to: '/ach-returns', icon: CornerUpLeft, placeholder: true },
    ],
  },
]
