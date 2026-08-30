import { describe, expect, it } from 'vitest'
import {
  formatCurrency, formatCount, formatPercent, truncateId, formatRelative,
} from './format'

describe('formatCurrency', () => {
  it('always shows two decimal places so decimal points align in a column', () => {
    expect(formatCurrency(5)).toBe('$5.00')
    expect(formatCurrency(1234.5)).toBe('$1,234.50')
  })

  it('formats zero and negative values', () => {
    expect(formatCurrency(0)).toBe('$0.00')
    expect(formatCurrency(-12.3)).toBe('-$12.30')
  })
})

describe('formatCount', () => {
  it('groups thousands', () => {
    expect(formatCount(1000)).toBe('1,000')
    expect(formatCount(1234567)).toBe('1,234,567')
  })
})

describe('formatPercent', () => {
  it('always carries an explicit sign so direction is unambiguous', () => {
    expect(formatPercent(12.4)).toBe('+12.4%')
    expect(formatPercent(-2.8)).toBe('-2.8%')
    expect(formatPercent(0)).toBe('+0.0%')
  })
})

describe('truncateId', () => {
  it('truncates from the middle, preserving both ends', () => {
    // Both ends matter: two UUIDs commonly share a prefix, so a
    // trailing-only truncation would render distinct IDs identically.
    expect(truncateId('0ee9ea88dd8e424a80493f2e137cadb6')).toBe('0ee9ea…adb6')
  })

  it('returns short ids unchanged rather than adding an ellipsis', () => {
    expect(truncateId('abc')).toBe('abc')
    expect(truncateId('0123456789')).toBe('0123456789')
  })

  it('honours custom lead and tail lengths', () => {
    expect(truncateId('0123456789abcdef', 4, 2)).toBe('0123…ef')
  })
})

describe('formatRelative', () => {
  const now = new Date('2026-08-30T12:00:00.000Z').getTime()

  it('collapses very recent timestamps to "just now"', () => {
    expect(formatRelative('2026-08-30T11:59:40.000Z', now)).toBe('just now')
  })

  it('picks the largest fitting unit', () => {
    expect(formatRelative('2026-08-30T09:00:00.000Z', now)).toBe('3 hours ago')
    expect(formatRelative('2026-08-28T12:00:00.000Z', now)).toBe('2 days ago')
  })
})
