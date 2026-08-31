import { describe, expect, it } from 'vitest'
import {
  attemptLimitTone, attemptOutcomeTone, blockedTone, customerProtectionTone,
  disbursedTone, fraudOverrideTone, kycTone, paymentStatusTone, protectionTone,
  threeDSProcessingTone, threeDSTone, verificationTone,
} from './tone-map'
import type { ToneDescriptor } from './tone-map'

/**
 * Exhaustive lists rather than a loop over the union types: TypeScript unions
 * are erased at runtime, so the only way to be sure every state is covered is
 * to name them. If a state is added to a union without being added here, the
 * mapper's own switch stops being exhaustive and tsc fails — so the two checks
 * together catch both halves.
 */
const EVERY_DESCRIPTOR: Array<[string, ToneDescriptor]> = [
  ...(['settled', 'initiated', 'failed', 'refunded', 'disputed'] as const)
    .map((s) => [`paymentStatus:${s}`, paymentStatusTone(s)] as [string, ToneDescriptor]),
  ...(['approved', 'declined', 'standard'] as const)
    .map((s) => [`protection:${s}`, protectionTone(s)] as [string, ToneDescriptor]),
  ...(['authenticated', 'attempted', 'failed', 'standard'] as const)
    .map((s) => [`threeDS:${s}`, threeDSTone(s)] as [string, ToneDescriptor]),
  ...(['verified', 'pending', 'not-started', 'rejected'] as const)
    .map((s) => [`kyc:${s}`, kycTone(s)] as [string, ToneDescriptor]),
  ...(['functional', 'degraded', 'off'] as const)
    .map((s) => [`threeDSProcessing:${s}`, threeDSProcessingTone(s)] as [string, ToneDescriptor]),
  ...(['standard', 'restricted', 'elevated'] as const)
    .map((s) => [`attemptLimit:${s}`, attemptLimitTone(s)] as [string, ToneDescriptor]),
  ...(['enforced', 'not-found', 'standard'] as const)
    .map((s) => [`verification:${s}`, verificationTone(s)] as [string, ToneDescriptor]),
  ...(['standard', 'allow', 'deny'] as const)
    .map((s) => [`fraudOverride:${s}`, fraudOverrideTone(s)] as [string, ToneDescriptor]),
  ...(['succeeded', 'failed', 'skipped'] as const)
    .map((s) => [`attemptOutcome:${s}`, attemptOutcomeTone(s)] as [string, ToneDescriptor]),
  ['customerProtection:true', customerProtectionTone(true)],
  ['customerProtection:false', customerProtectionTone(false)],
  ['blocked:true', blockedTone(true)],
  ['blocked:false', blockedTone(false)],
  ['disbursed:true', disbursedTone(true)],
  ['disbursed:false', disbursedTone(false)],
]

describe('tone registry', () => {
  it('gives every state a glyph, including the unremarkable ones', () => {
    // A controls grid where half the values have an icon and half do not reads
    // as a rendering bug rather than as a distinction.
    for (const [name, descriptor] of EVERY_DESCRIPTOR) {
      expect(descriptor.icon, `${name} has no icon`).toBeDefined()
    }
  })

  it('gives every state a non-empty label', () => {
    for (const [name, descriptor] of EVERY_DESCRIPTOR) {
      expect(descriptor.label.length, `${name} has no label`).toBeGreaterThan(0)
    }
  })

  it('reserves critical for states that genuinely went wrong', () => {
    const critical = EVERY_DESCRIPTOR.filter(([, d]) => d.tone === 'critical').map(([name]) => name)
    // A default value can never be critical — defaults render as a muted dash,
    // so a critical default would be an alarm nobody can see.
    for (const [name, descriptor] of EVERY_DESCRIPTOR) {
      if (descriptor.isDefault) expect(descriptor.tone, `${name}`).not.toBe('critical')
    }
    expect(critical.length).toBeGreaterThan(0)
  })
})
