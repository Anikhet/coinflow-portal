import { describe, expect, it } from 'vitest'
import { describeCriteria, humanize } from './criteria'

describe('describeCriteria', () => {
  it('returns nothing for an untouched view, so callers can detect a truly empty dataset', () => {
    expect(describeCriteria('', {}, {})).toEqual([])
  })

  it('ignores whitespace-only search and empty filter groups', () => {
    expect(describeCriteria('   ', { status: [] }, { riskOnly: false })).toEqual([])
  })

  it('echoes the trimmed search term', () => {
    expect(describeCriteria('  acme ', {}, {})).toEqual(['Search: “acme”'])
  })

  it('lists up to two filter values and counts beyond that', () => {
    expect(describeCriteria('', { status: ['failed', 'refunded'] }, {})).toEqual(['Status: failed, refunded'])
    expect(describeCriteria('', { status: ['a', 'b', 'c'] }, {})).toEqual(['Status: 3 selected'])
  })

  it('includes only enabled toggles', () => {
    expect(describeCriteria('', {}, { riskOnly: true, archived: false })).toEqual(['Risk only'])
  })

  it('combines search, filters and toggles in that order', () => {
    expect(describeCriteria('bob', { merchant: ['Acme'] }, { riskOnly: true })).toEqual([
      'Search: “bob”',
      'Merchant: Acme',
      'Risk only',
    ])
  })
})

describe('humanize', () => {
  it('splits camelCase into sentence case', () => {
    expect(humanize('riskOnly')).toBe('Risk only')
    expect(humanize('merchant')).toBe('Merchant')
    expect(humanize('last4Digits')).toBe('Last4 digits')
  })
})
