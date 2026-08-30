import { describe, expect, it } from 'vitest'
import {
  paymentStatusTone, protectionTone, threeDSTone, kycTone, activityTone,
  customerExceptions, signalCountTone,
} from './tone-map'
import type { Customer } from '@/types'

/**
 * These tests defend the pill taxonomy, not just the return values.
 * The rules they enforce are the reason the tables stay readable:
 *   - a status never maps to a "default" (hidden) descriptor
 *   - a default attribute value is always flagged isDefault, so it renders as
 *     an em-dash rather than a pill
 *   - a fully-normal customer produces ZERO exceptions
 */

const baseCustomer: Customer = {
  id: 'c1', shortId: 'c1', createdAt: '2026-01-01T00:00:00.000Z', merchant: 'acme',
  name: 'Ada Lovelace', email: 'ada@example.com',
  protectionEnabled: true, blocked: false, threeDSProcessing: 'functional',
  attemptLimit: 'standard', verification: 'enforced', fraudOverride: 'standard',
  kyc: 'verified', totalVolume: 100, paymentCount: 4, overriddenVolume: 0,
  overriddenCount: 0, disputeCount: 0,
  names: [], billingAddresses: [], ipLocations: [], cards: [], activity: [],
}

describe('paymentStatusTone', () => {
  it('maps each status to a distinct, non-default descriptor', () => {
    const statuses = ['settled', 'initiated', 'failed', 'refunded', 'disputed'] as const
    for (const status of statuses) {
      const descriptor = paymentStatusTone(status)
      expect(descriptor.label).toBeTruthy()
      // A status must always be visible — it is the anchor pill of the row.
      expect(descriptor.isDefault).toBeFalsy()
    }
  })

  it('marks only in-flight states as pulsing', () => {
    expect(paymentStatusTone('initiated').pulse).toBe(true)
    expect(paymentStatusTone('settled').pulse).toBeFalsy()
    expect(paymentStatusTone('failed').pulse).toBeFalsy()
  })

  it('uses the critical tone for both failure modes', () => {
    expect(paymentStatusTone('failed').tone).toBe('critical')
    expect(paymentStatusTone('disputed').tone).toBe('critical')
  })
})

describe('attribute tones', () => {
  it('flags the majority value as default so it renders as an em-dash', () => {
    expect(threeDSTone('standard').isDefault).toBe(true)
    expect(kycTone('not-started').isDefault).toBe(true)
  })

  it('treats protection as default-when-approved, since most payments are', () => {
    // Inverted polarity: "protected" is the boring majority, so it must NOT
    // draw a pill. Only its absence or refusal is notable.
    expect(protectionTone('approved').isDefault).toBe(true)
    expect(protectionTone('standard').isDefault).toBeFalsy()
    expect(protectionTone('declined').isDefault).toBeFalsy()
  })

  it('does not flag non-default values as default', () => {
    expect(threeDSTone('authenticated').isDefault).toBeFalsy()
    expect(kycTone('verified').isDefault).toBeFalsy()
  })

  /**
   * Green is reserved for the Status column. If any attribute mapper returned
   * `positive`, a row could show two unrelated greens.
   */
  it('reserves the positive tone for status, never for attributes', () => {
    const attributeTones = [
      protectionTone('approved').tone, protectionTone('declined').tone,
      protectionTone('standard').tone, threeDSTone('authenticated').tone,
      threeDSTone('attempted').tone, threeDSTone('failed').tone,
      threeDSTone('standard').tone,
    ]
    expect(attributeTones).not.toContain('positive')
  })

  it('never assigns the brand color, which is reserved for interaction', () => {
    const tones = [
      protectionTone('approved').tone, threeDSTone('failed').tone,
      kycTone('rejected').tone, activityTone('pending').tone,
    ]
    expect(tones).not.toContain('brand')
  })
})

describe('customerExceptions', () => {
  it('returns nothing for a fully default customer, keeping the row quiet', () => {
    expect(customerExceptions(baseCustomer)).toEqual([])
  })

  it('surfaces a blocked customer as critical', () => {
    const result = customerExceptions({ ...baseCustomer, blocked: true })
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ tone: 'critical', label: 'Blocked' })
  })

  it('accumulates every deviation independently', () => {
    const result = customerExceptions({
      ...baseCustomer,
      blocked: true,
      protectionEnabled: false,
      threeDSProcessing: 'off',
      attemptLimit: 'restricted',
      verification: 'not-found',
      fraudOverride: 'deny',
    })
    expect(result).toHaveLength(6)
  })

  it('pluralises the dispute count', () => {
    expect(customerExceptions({ ...baseCustomer, disputeCount: 1 })[0].label).toBe('1 dispute')
    expect(customerExceptions({ ...baseCustomer, disputeCount: 3 })[0].label).toBe('3 disputes')
  })

  it('treats an elevated attempt limit as informational, not a problem', () => {
    const result = customerExceptions({ ...baseCustomer, attemptLimit: 'elevated' })
    expect(result[0].tone).toBe('info')
  })
})

describe('signalCountTone', () => {
  it('stays neutral at or below the threshold', () => {
    expect(signalCountTone(1, 3)).toBe('neutral')
    expect(signalCountTone(3, 3)).toBe('neutral')
  })

  it('escalates past the threshold and again past double it', () => {
    expect(signalCountTone(4, 3)).toBe('caution')
    expect(signalCountTone(6, 3)).toBe('caution')
    expect(signalCountTone(7, 3)).toBe('critical')
  })
})
