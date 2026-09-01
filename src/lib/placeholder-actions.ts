import type { LucideIcon } from 'lucide-react'
import { findNavGroupLabel, NAV_GROUPS } from '@/lib/nav'

/**
 * PLACEHOLDER EXITS
 * =============================================================================
 * Every unbuilt route offers a way out, but "Go to Overview / View purchases"
 * on all twelve of them is a generic exit: it tells the user where the app CAN
 * go, not where the thing they just asked for actually lives. An operator who
 * clicked "Chargebacks" wants the disputed payments; one who clicked
 * "Compliance Center" wants the customer records the checks are run against.
 *
 * So the exit is derived from the route the user is standing on. Two inputs:
 *
 *   1. An explicit per-route entry (`ROUTE_EXITS`) where the destination is
 *      genuinely specific — a dispute queue points at Purchases, a KYC screen
 *      points at Customers.
 *   2. The nav group the route belongs to, as the fallback. Grouping already
 *      encodes intent ("Money movement", "Disputes & risk", "Compliance"), so
 *      a route added to the nav later inherits a sensible exit for free
 *      instead of silently falling back to the generic pair.
 *
 * Only the three built pages (/, /purchases, /customers) are ever named as
 * destinations — an exit that lands on another placeholder is not an exit.
 */

export interface PlaceholderAction {
  to: string
  label: string
}

/** An exit with its destination's nav icon attached — what the page renders. */
export interface ResolvedAction extends PlaceholderAction {
  icon: LucideIcon
}

export interface PlaceholderExits {
  /** Why this destination is the nearest built thing to what the user wanted. */
  description: string
  primary: PlaceholderAction
  secondary: PlaceholderAction
}

export interface ResolvedExits {
  description: string
  primary: ResolvedAction
  secondary: ResolvedAction
}

/**
 * Destination route → the icon the sidebar already uses for it.
 *
 * Derived from NAV_GROUPS rather than listed here, so a button's icon is
 * literally the mark the user would be clicking in the nav to reach the same
 * place. Labels differ per context ("See settled volume" vs "Go to Overview")
 * but both land on the overview, and both should carry the overview's icon —
 * which is why this keys on the ROUTE, not on the label.
 */
const NAV_ICON_BY_ROUTE: Record<string, LucideIcon> = Object.fromEntries(
  NAV_GROUPS.flatMap((group) => group.items).map((item) => [item.to, item.icon]),
)

function withIcon(action: PlaceholderAction): ResolvedAction {
  const icon = NAV_ICON_BY_ROUTE[action.to]
  if (!icon) {
    // Every exit points at one of the three built routes, all of which are in
    // the nav. Reaching here means an exit was pointed somewhere unlisted.
    throw new Error(`No nav icon for placeholder exit "${action.to}"`)
  }
  return { ...action, icon }
}

const OVERVIEW: PlaceholderAction = { to: '/', label: 'Go to Overview' }
const PURCHASES: PlaceholderAction = { to: '/purchases', label: 'View purchases' }
const CUSTOMERS: PlaceholderAction = { to: '/customers', label: 'View customers' }

const GENERIC: PlaceholderExits = {
  description: 'This prototype covers Home, Purchases and Customers.',
  primary: OVERVIEW,
  secondary: PURCHASES,
}

/** Routes whose nearest built equivalent is more specific than their group. */
const ROUTE_EXITS: Record<string, PlaceholderExits> = {
  '/chargebacks': {
    description: 'Disputes are not in this prototype, but the payments they are raised against are.',
    primary: { to: '/purchases', label: 'Review disputed payments' },
    secondary: OVERVIEW,
  },
  '/unmatched': {
    description: 'Reconciliation is not built. The settled transactions it matches against are.',
    primary: { to: '/purchases', label: 'Open the transaction ledger' },
    secondary: OVERVIEW,
  },
  '/liquidity': {
    description: 'Balances are not built. The volume that feeds them is on the overview.',
    primary: { to: '/', label: 'See settled volume' },
    secondary: PURCHASES,
  },
  '/compliance': {
    description: 'Compliance tooling is not built. The customer records it screens are.',
    primary: { to: '/customers', label: 'Open customer records' },
    secondary: PURCHASES,
  },
}

/** Fallback exit per nav group, keyed by the group heading in `NAV_GROUPS`. */
const GROUP_EXITS: Record<string, PlaceholderExits> = {
  'Money movement': {
    description: 'This screen is not built. Its underlying transactions are.',
    primary: { to: '/purchases', label: 'Open the transaction ledger' },
    secondary: OVERVIEW,
  },
  'Disputes & risk': {
    description: 'Risk tooling is not in this prototype, but the payments it acts on are.',
    primary: { to: '/purchases', label: 'Review recent payments' },
    secondary: OVERVIEW,
  },
  Compliance: {
    description: 'Compliance tooling is not built. The customers it applies to are.',
    primary: CUSTOMERS,
    secondary: OVERVIEW,
  },
}

/**
 * Resolve the pair of exits shown on an unbuilt route: explicit route entry
 * first, then the route's nav group, then the generic pair for anything that
 * is not in the nav at all (an unknown URL).
 */
export function resolvePlaceholderExits(pathname: string): ResolvedExits {
  const groupLabel = findNavGroupLabel(pathname)
  const exits =
    ROUTE_EXITS[pathname] ??
    (groupLabel ? GROUP_EXITS[groupLabel] : undefined) ??
    GENERIC

  return {
    description: exits.description,
    primary: withIcon(exits.primary),
    secondary: withIcon(exits.secondary),
  }
}
