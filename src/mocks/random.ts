/**
 * Deterministic PRNG (mulberry32).
 *
 * A seeded generator rather than a random one so the dataset is byte-identical
 * on every reload. That matters for a design prototype: screenshots stay
 * reproducible, and edge cases we tune the UI around (a failed payment in row
 * three, a customer with five IP locations) do not vanish on refresh.
 */
export function createRandom(seed: number) {
  let state = seed >>> 0

  const next = () => {
    state |= 0
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  return {
    next,
    int: (min: number, max: number) => Math.floor(next() * (max - min + 1)) + min,
    float: (min: number, max: number) => next() * (max - min) + min,
    pick: <T,>(items: readonly T[]): T => items[Math.floor(next() * items.length)],
    /** Picks using explicit weights so distributions look realistic, not uniform. */
    weighted: <T,>(entries: ReadonlyArray<readonly [T, number]>): T => {
      const total = entries.reduce((sum, [, weight]) => sum + weight, 0)
      let roll = next() * total
      for (const [value, weight] of entries) {
        roll -= weight
        if (roll <= 0) return value
      }
      return entries[entries.length - 1][0]
    },
    bool: (probability = 0.5) => next() < probability,
    hex: (length: number) => {
      let out = ''
      while (out.length < length) out += Math.floor(next() * 16).toString(16)
      return out.slice(0, length)
    },
    base58: (length: number) => {
      const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
      let out = ''
      for (let i = 0; i < length; i += 1) out += alphabet[Math.floor(next() * alphabet.length)]
      return out
    },
  }
}

export type Random = ReturnType<typeof createRandom>
