import { findNavGroupLabel } from '@/lib/nav'

/**
 * PLACEHOLDER HEADER SUMMARIES
 * =============================================================================
 * Every page header carries a line under the title saying what the screen is
 * for. Unbuilt routes are no exception: a header reading only "Exposure" tells
 * an operator nothing about what they clicked, and the empty state below it
 * explains where to go NEXT, not what this screen would have shown.
 *
 * So each placeholder gets a one-line description of the screen it stands in
 * for, resolved the same way the exits are — explicit route entry first, then
 * the route's nav group, then a generic line for URLs that are not in the nav
 * at all. Adding a nav item later inherits its group's line rather than
 * shipping a bare title.
 */

/** What each unbuilt screen would show, keyed by route. */
const ROUTE_SUMMARIES: Record<string, string> = {
  '/liquidity': 'Balances, payouts and available funds across your merchant accounts.',
  '/chargebacks': 'Disputes raised against your payments, with evidence and deadlines.',
  '/unmatched': 'Settled transactions that could not be reconciled to an order.',
  '/chargeback-ops': 'The working queue for responding to open disputes.',
  '/chargeback-analytics': 'Dispute rates and outcomes broken down by reason and method.',
  '/exposure': 'Outstanding risk by merchant, method and settlement window.',
  '/compliance': 'KYC, sanctions and rule checks run against your customer records.',
  '/3ds': 'Authentication rates and challenge outcomes for card payments.',
  '/ach-refunds': 'ACH refunds held for manual review before they are released.',
  '/ach-returns': 'Returned ACH debits with their return codes and reasons.',
}

/** Fallback line per nav group, keyed by the group heading in `NAV_GROUPS`. */
const GROUP_SUMMARIES: Record<string, string> = {
  'Money movement': 'Part of money movement — not built in this prototype.',
  'Disputes & risk': 'Part of disputes and risk — not built in this prototype.',
  Compliance: 'Part of compliance — not built in this prototype.',
}

const GENERIC_SUMMARY = 'This URL does not match any screen in this prototype.'

/** The header line for an unbuilt route: route entry, then group, then generic. */
export function resolvePlaceholderSummary(pathname: string): string {
  const groupLabel = findNavGroupLabel(pathname)
  return (
    ROUTE_SUMMARIES[pathname] ??
    (groupLabel ? GROUP_SUMMARIES[groupLabel] : undefined) ??
    GENERIC_SUMMARY
  )
}
