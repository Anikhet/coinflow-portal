import { describe, expect, it } from 'vitest'
import { hueFor, initialsFor } from './avatar'

describe('initialsFor', () => {
  it('takes one letter per word for multi-word names', () => {
    expect(initialsFor('Coinflow Admin')).toBe('CA')
  })

  it('takes two letters from a single word', () => {
    expect(initialsFor('courtside')).toBe('CO')
  })

  it('treats underscores, hyphens and dots as word boundaries', () => {
    expect(initialsFor('Triumph_TCG')).toBe('TT')
    expect(initialsFor('ice-box')).toBe('IB')
    expect(initialsFor('acme.co')).toBe('AC')
  })

  it('ignores extra words beyond the first two', () => {
    expect(initialsFor('a b c d')).toBe('AB')
  })

  it('survives empty and whitespace-only names', () => {
    expect(initialsFor('')).toBe('?')
    expect(initialsFor('   ')).toBe('?')
  })

  it('distinguishes names that share their first two characters', () => {
    // The regression this module exists for: both were "CO" before.
    expect(initialsFor('Coinflow Admin')).not.toBe(initialsFor('courtside'))
  })
})

describe('hueFor', () => {
  it('is stable for the same name', () => {
    expect(hueFor('packz')).toBe(hueFor('packz'))
  })

  it('stays on the wheel', () => {
    for (const name of ['a', 'packz', 'Coinflow Admin', '', 'ünïcødé']) {
      const hue = hueFor(name)
      expect(hue).toBeGreaterThanOrEqual(0)
      expect(hue).toBeLessThan(360)
    }
  })

  it('lands on discrete stops so adjacent hues stay distinguishable', () => {
    expect(hueFor('icybox') % 30).toBe(0)
  })

  it('separates the names that collide on initials', () => {
    expect(hueFor('Coinflow Admin')).not.toBe(hueFor('courtside'))
  })
})
