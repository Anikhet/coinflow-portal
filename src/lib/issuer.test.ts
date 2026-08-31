import { describe, expect, it } from 'vitest'
import { issuerHue, issuerMonogram, issuerShortName } from '@/lib/issuer'

/** The issuers the seed data actually produces. */
const ISSUERS = [
  'BANK OF AMERICA NATIONAL ASSOCIATION', 'JPMORGAN CHASE BANK N.A.', 'CAPITAL ONE N.A.',
  'WELLS FARGO BANK N.A.', 'NAVY FEDERAL CREDIT UNION', 'SYNCHRONY BANK', 'USAA FEDERAL SAVINGS BANK',
]

describe('issuerShortName', () => {
  it('strips trailing legal suffixes, including stacked ones', () => {
    expect(issuerShortName('BANK OF AMERICA NATIONAL ASSOCIATION')).toBe('BANK OF AMERICA')
    expect(issuerShortName('JPMORGAN CHASE BANK N.A.')).toBe('JPMORGAN CHASE')
    expect(issuerShortName('USAA FEDERAL SAVINGS BANK')).toBe('USAA')
    expect(issuerShortName('SYNCHRONY BANK')).toBe('SYNCHRONY')
  })

  it('only strips suffixes at the end, never mid-name', () => {
    expect(issuerShortName('BANK OF AMERICA NATIONAL ASSOCIATION')).toContain('BANK OF')
  })

  it('never returns an empty label', () => {
    expect(issuerShortName('BANK')).toBe('BANK')
    expect(issuerShortName('   ')).toBe('')
  })
})

describe('issuerMonogram', () => {
  it('skips stop words when picking letters', () => {
    expect(issuerMonogram('BANK OF AMERICA NATIONAL ASSOCIATION')).toBe('BA')
  })

  it('takes two letters from a single-word issuer', () => {
    expect(issuerMonogram('SYNCHRONY BANK')).toBe('SY')
    expect(issuerMonogram('USAA FEDERAL SAVINGS BANK')).toBe('US')
  })

  it('is always one or two characters for every seeded issuer', () => {
    for (const issuer of ISSUERS) {
      expect(issuerMonogram(issuer)).toMatch(/^[A-Z?]{1,2}$/)
    }
  })

  it('distinguishes all seven seeded issuers by monogram', () => {
    expect(new Set(ISSUERS.map(issuerMonogram)).size).toBe(ISSUERS.length)
  })
})

describe('issuerHue', () => {
  it('is stable across a change of legal suffix', () => {
    expect(issuerHue('WELLS FARGO BANK N.A.')).toBe(issuerHue('WELLS FARGO NATIONAL ASSOCIATION'))
  })

  it('lands on the coarse twelve-stop wheel', () => {
    for (const issuer of ISSUERS) {
      expect(issuerHue(issuer) % 30).toBe(0)
    }
  })
})
