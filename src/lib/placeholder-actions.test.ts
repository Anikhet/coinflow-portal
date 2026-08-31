import { describe, expect, it } from 'vitest'
import { NAV_GROUPS } from '@/lib/nav'
import { resolvePlaceholderExits } from '@/lib/placeholder-actions'

const BUILT_ROUTES = new Set(['/', '/purchases', '/customers'])

describe('resolvePlaceholderExits', () => {
  it('prefers the explicit per-route exit over the group fallback', () => {
    const exits = resolvePlaceholderExits('/chargebacks')
    expect(exits.primary).toMatchObject({ to: '/purchases', label: 'Review disputed payments' })
  })

  it('attaches the destination route\'s own nav icon to every action', () => {
    // The button should show the mark the user would click in the sidebar to
    // reach the same place, so the icon is keyed on the route, not the label.
    const iconFor = (to: string) =>
      NAV_GROUPS.flatMap((group) => group.items).find((item) => item.to === to)?.icon

    for (const route of ['/liquidity', '/chargebacks', '/3ds', '/does-not-exist']) {
      const { primary, secondary } = resolvePlaceholderExits(route)
      expect(primary.icon, `${route} primary`).toBe(iconFor(primary.to))
      expect(secondary.icon, `${route} secondary`).toBe(iconFor(secondary.to))
    }
  })

  it('falls back to the nav group when the route has no explicit entry', () => {
    // /3ds sits in Compliance and has no route-specific exit.
    expect(resolvePlaceholderExits('/3ds').primary.to).toBe('/customers')
  })

  it('falls back to the generic pair for routes absent from the nav', () => {
    const exits = resolvePlaceholderExits('/does-not-exist')
    expect(exits.primary.to).toBe('/')
    expect(exits.secondary.to).toBe('/purchases')
  })

  it('never sends the user to another unbuilt route', () => {
    const placeholders = NAV_GROUPS.flatMap((group) => group.items)
      .filter((item) => item.placeholder)
      .map((item) => item.to)

    for (const route of [...placeholders, '/unknown']) {
      const { primary, secondary } = resolvePlaceholderExits(route)
      expect(BUILT_ROUTES.has(primary.to), `${route} primary`).toBe(true)
      expect(BUILT_ROUTES.has(secondary.to), `${route} secondary`).toBe(true)
    }
  })

  it('does not point a route back at itself', () => {
    for (const group of NAV_GROUPS) {
      for (const item of group.items.filter((i) => i.placeholder)) {
        const { primary, secondary } = resolvePlaceholderExits(item.to)
        expect(primary.to).not.toBe(item.to)
        expect(secondary.to).not.toBe(item.to)
      }
    }
  })

  it('gives the two actions distinct destinations', () => {
    const { primary, secondary } = resolvePlaceholderExits('/liquidity')
    expect(primary.to).not.toBe(secondary.to)
  })
})
