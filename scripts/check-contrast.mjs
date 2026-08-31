#!/usr/bin/env node
/**
 * TEXT CONTRAST GUARD
 * =============================================================================
 * Every ink token is checked against the surfaces it is actually used on.
 *
 * The palette is authored in OKLCH, which is excellent for building an even
 * lightness ramp and useless for judging legibility by eye — a token can look
 * like a reasonable "muted grey" and still fall below the WCAG AA floor. So the
 * conversion to sRGB and the contrast ratio are computed here rather than
 * trusted to intuition.
 *
 * Run: pnpm check:contrast
 */
import { readFileSync } from 'node:fs'

/** OKLCH -> linear sRGB (Björn Ottosson's transform). */
function oklchToLinearSrgb(L, C, H) {
  const h = (H * Math.PI) / 180
  const a = C * Math.cos(h)
  const b = C * Math.sin(h)

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b
  const s_ = L - 0.0894841775 * a - 1.291485548 * b

  const l = l_ ** 3
  const m = m_ ** 3
  const s = s_ ** 3

  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
}

const clamp = (v) => Math.min(1, Math.max(0, v))

function luminance([r, g, b]) {
  return 0.2126 * clamp(r) + 0.7152 * clamp(g) + 0.0722 * clamp(b)
}

function contrast(fg, bg) {
  const a = luminance(oklchToLinearSrgb(...fg))
  const b = luminance(oklchToLinearSrgb(...bg))
  const [hi, lo] = a > b ? [a, b] : [b, a]
  return (hi + 0.05) / (lo + 0.05)
}

/** Pulls `--name: oklch(L C H)` declarations out of a CSS block. */
function readTokens(css, blockStart, blockEnd) {
  const block = css.slice(css.indexOf(blockStart), css.indexOf(blockEnd))
  const tokens = {}
  for (const [, name, l, c, h] of block.matchAll(
    /--([\w-]+):\s*oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)/g,
  )) {
    tokens[name] = [Number(l), Number(c), Number(h)]
  }
  return tokens
}

const css = readFileSync('src/index.css', 'utf8')

// Both themes are checked. Dark mode is where a "muted" token most often slips
// below the floor, because a low-chroma grey on a near-black surface looks
// far more legible than it measures.
const light = readTokens(css, ':root {', '@media (prefers-color-scheme: dark)')
const dark = readTokens(css, ':root[data-theme="dark"] {', '/* Expose tokens')

/**
 * Every text token, the surface it sits on, and the WCAG floor for the size it
 * is used at. 4.5 is normal text; 3.0 applies only to >=24px or >=18.66px bold.
 */
const CHECKS = [
  ['ink on surface', 'ink', 'surface', 4.5],
  ['ink on canvas', 'ink', 'canvas', 4.5],
  ['ink-muted on surface', 'ink-muted', 'surface', 4.5],
  ['ink-muted on canvas', 'ink-muted', 'canvas', 4.5],
  ['ink-faint on surface', 'ink-faint', 'surface', 4.5],
  ['ink-faint on canvas', 'ink-faint', 'canvas', 4.5],
  ['ink-faint on surface-sunk', 'ink-faint', 'surface-sunk', 4.5],
  ['brand on surface', 'brand', 'surface', 4.5],
  ['tone-positive-fg on tone-positive-bg', 'tone-positive-fg', 'tone-positive-bg', 4.5],
  ['tone-caution-fg on tone-caution-bg', 'tone-caution-fg', 'tone-caution-bg', 4.5],
  ['tone-critical-fg on tone-critical-bg', 'tone-critical-fg', 'tone-critical-bg', 4.5],
  ['tone-info-fg on tone-info-bg', 'tone-info-fg', 'tone-info-bg', 4.5],
  ['tone-neutral-fg on tone-neutral-bg', 'tone-neutral-fg', 'tone-neutral-bg', 4.5],
]

/**
 * Perceptual distance in OKLab. Used for the separation checks below, where the
 * question is "do these look like different colours?" rather than "is this text
 * legible?" — contrast ratio answers the second and is useless for the first.
 */
function distance(a, b) {
  const toLab = ([L, C, H]) => [L, C * Math.cos((H * Math.PI) / 180), C * Math.sin((H * Math.PI) / 180)]
  const [l1, a1, b1] = toLab(a)
  const [l2, a2, b2] = toLab(b)
  return Math.hypot(l1 - l2, a1 - a2, b1 - b2)
}

const TONES = ['positive', 'caution', 'critical', 'info', 'neutral']

/**
 * Brand must never be mistaken for a status.
 *
 * This is the rule the whole colour system rests on, and it is the one that
 * broke: the dark theme had brand at hue 163 — a green, 5 degrees from the
 * success tone — so the active nav rail, the focus ring and a "Settled" badge
 * were the same colour. Contrast checks would never have caught it, because
 * both were perfectly legible. Only separation catches it.
 */
const MIN_BRAND_SEPARATION = 0.13

let failed = 0

for (const [themeName, tokens] of [['light', light], ['dark', dark]]) {
  const rows = CHECKS.map(([label, fg, bg, required]) => {
    if (!tokens[fg] || !tokens[bg]) return { label, missing: true }
    const ratio = contrast(tokens[fg], tokens[bg])
    return { label, ratio: +ratio.toFixed(2), required, pass: ratio >= required }
  })

  const width = Math.max(...rows.map((r) => r.label.length))
  console.log(`\n  ${themeName.toUpperCase()}`)

  for (const row of rows) {
    if (row.missing) {
      console.log(`  ?  ${row.label.padEnd(width)}  token not found`)
      continue
    }
    if (!row.pass) failed += 1
    const mark = row.pass ? '✔' : '✖'
    console.log(
      `  ${mark}  ${row.label.padEnd(width)}  ${String(row.ratio).padStart(6)} : 1   (needs ${row.required})`,
    )
  }
  console.log(`  -- brand separation --`)
  for (const tone of TONES) {
    const fg = tokens[`tone-${tone}-fg`]
    if (!tokens.brand || !fg) continue
    const d = distance(tokens.brand, fg)
    const pass = d >= MIN_BRAND_SEPARATION
    if (!pass) failed += 1
    console.log(
      `  ${pass ? '✔' : '✖'}  brand vs ${tone.padEnd(10)} ${d.toFixed(3)}   (needs ${MIN_BRAND_SEPARATION})`,
    )
  }
}

if (failed > 0) {
  console.error(`\n✖ ${failed} colour check(s) failed.\n`)
  process.exit(1)
}
console.log('\n✔ contrast meets WCAG AA and brand is separable from every tone\n')
