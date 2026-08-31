#!/usr/bin/env node
/**
 * DESIGN SCALE GUARD
 * =============================================================================
 * Fails if any component reaches outside the declared type scale.
 *
 * A scale that is only a convention decays: the next person needing something
 * "a bit bigger" types `text-[16px]`, nothing objects, and six months later
 * there are twenty sizes again. That is exactly how this codebase accumulated
 * twelve — including three pairs (14/15, 17/18, 24/26) no reader can tell
 * apart. The scale holds because this check runs, not because it is documented.
 *
 * Run: pnpm check:scale
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = 'src'

/** Lettering inside a brand mark is fitted to a glyph box, not UI type. */
const EXEMPT = new Set(['src/components/icons/brand-marks.tsx'])

/** Arbitrary font sizes: the whole point is that these should not exist. */
const ARBITRARY_TEXT = /text-\[\d+px\]/g

/**
 * Spacing is a 2px-based scale. These Tailwind steps resolve to 14px and 28px,
 * which sit off it — the only two values in the codebase that ever did.
 */
const OFF_SCALE_SPACING = /\b(?:p|px|py|pt|pb|pl|pr|gap|gap-x|gap-y|space-y|space-x|m|mt|mb|ml|mr)-(?:3\.5|7)\b/g

function walk(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry)
    return statSync(full).isDirectory() ? walk(full) : [full]
  })
}

const violations = []

for (const file of walk(ROOT)) {
  if (!file.endsWith('.tsx')) continue
  const rel = relative('.', file)
  if (EXEMPT.has(rel)) continue

  const source = readFileSync(file, 'utf8')

  for (const [pattern, rule] of [
    [ARBITRARY_TEXT, 'off-scale font size — use text-xs|sm|base|lg|xl|2xl'],
    [OFF_SCALE_SPACING, 'off-scale spacing — the scale is 2px-based'],
  ]) {
    for (const match of source.matchAll(pattern)) {
      const line = source.slice(0, match.index).split('\n').length
      violations.push(`${rel}:${line}  ${match[0]}  — ${rule}`)
    }
  }
}

if (violations.length > 0) {
  console.error(`\n✖ ${violations.length} design-scale violation(s):\n`)
  for (const violation of violations) console.error(`  ${violation}`)
  console.error('\nScale is declared in src/index.css under TYPE SCALE.\n')
  process.exit(1)
}

console.log('✔ design scale clean — no off-scale type or spacing')
