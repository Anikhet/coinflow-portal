/**
 * Formatting helpers. Currency and dates are formatted in exactly one place so
 * the payments table, drawers and charts can never disagree about how a value
 * reads.
 */

const USD = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const USD_COMPACT = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
})

const COUNT = new Intl.NumberFormat('en-US')

export const formatCurrency = (value: number) => USD.format(value)
export const formatCompactCurrency = (value: number) => USD_COMPACT.format(value)
export const formatCount = (value: number) => COUNT.format(value)
export const formatPercent = (value: number, digits = 1) =>
  `${value >= 0 ? '+' : ''}${value.toFixed(digits)}%`

/**
 * Truncates a long identifier from the middle. Hashes and UUIDs are
 * distinguished by their *ends* — a leading-truncation would make many
 * different IDs render identically.
 */
export function truncateId(id: string, lead = 6, tail = 4) {
  if (id.length <= lead + tail + 1) return id
  return `${id.slice(0, lead)}…${id.slice(-tail)}`
}

export function formatDateTime(iso: string, timezone: 'local' | 'utc' = 'local') {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: timezone === 'utc' ? 'UTC' : undefined,
  })
}

export function formatDateOnly(iso: string, timezone: 'local' | 'utc' = 'local') {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: timezone === 'utc' ? 'UTC' : undefined,
  })
}

/**
 * Compact timestamp for dense table columns.
 *
 * A relative string ("7 hours ago") repeated down twenty rows is visually
 * identical on every line and tells the reader nothing about ordering within
 * the page. Showing clock time for today's records and an absolute date for
 * older ones makes every cell distinct and directly comparable.
 */
export function formatTableTime(iso: string, timezone: 'local' | 'utc' = 'local') {
  const date = new Date(iso)
  const zone = timezone === 'utc' ? 'UTC' : undefined
  const today = new Date().toLocaleDateString('en-US', { timeZone: zone })
  const isToday = date.toLocaleDateString('en-US', { timeZone: zone }) === today

  if (isToday) {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric', minute: '2-digit', hour12: true, timeZone: zone,
    })
  }

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: zone })
}

/**
 * Clock time only — for lists whose rows sit under a date heading. Repeating
 * "Aug 29" on every row beneath a heading that already says AUG 29, 2026 spends
 * the widest part of the line restating the one fact the reader just read.
 */
export function formatTimeOnly(iso: string, timezone: 'local' | 'utc' = 'local') {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: timezone === 'utc' ? 'UTC' : undefined,
  })
}

const RELATIVE = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
const UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ['year', 31536000], ['month', 2592000], ['day', 86400],
  ['hour', 3600], ['minute', 60], ['second', 1],
]

export function formatRelative(iso: string, now = Date.now()) {
  const deltaSeconds = (new Date(iso).getTime() - now) / 1000
  const magnitude = Math.abs(deltaSeconds)
  if (magnitude < 45) return 'just now'
  for (const [unit, seconds] of UNITS) {
    if (magnitude >= seconds) return RELATIVE.format(Math.round(deltaSeconds / seconds), unit)
  }
  return 'just now'
}
