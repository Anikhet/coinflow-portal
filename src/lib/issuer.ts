import { hueFor } from '@/lib/avatar'

/**
 * ISSUER IDENTITY
 * =============================================================================
 * Card networks return an issuer as its legal entity name in caps — "BANK OF
 * AMERICA NATIONAL ASSOCIATION", "USAA FEDERAL SAVINGS BANK". Rendering that
 * beside a generic bank glyph means every issuer in the product looks
 * identical, and the reader has to parse a 35-character legal string to answer
 * a one-bit question: which bank is this?
 *
 * We cannot ship the banks' actual logos — they are trademarks, and redrawing
 * seven of them in a prototype (or fetching them from a logo CDN at render
 * time) buys fidelity with a lie or a network dependency. So the mark is
 * DERIVED and honest about being derived: a monogram of the bank's colloquial
 * short name, tinted by a hue hashed from that same name.
 *
 * Two rules make it work:
 *
 * SHORTEN BEFORE HASHING
 *   The legal suffixes are noise that all seven issuers share. "BANK OF AMERICA
 *   NATIONAL ASSOCIATION" and "WELLS FARGO BANK N.A." must monogram as BA and
 *   WF, not as BO/WF-by-accident, and the hue must come from the short name so
 *   a bank renaming its legal entity does not recolour it.
 *
 * A CIRCLE, NOT A SQUARE
 *   `Avatar` (rounded square) means "an account inside this system" — a
 *   customer, a merchant. An issuer is an outside institution the merchant
 *   never onboarded. Same hue machinery, different silhouette, so the two
 *   cannot be confused at 20px. See `IssuerMark`.
 */

/**
 * Legal-entity suffixes carried by essentially every US issuer. Stripped as
 * whole words from the END only — "BANK OF AMERICA" must keep its leading
 * "BANK", and a hypothetical "NATIONAL BANK OF X" must keep "NATIONAL".
 */
const LEGAL_SUFFIXES = [
  'NATIONAL ASSOCIATION', 'FEDERAL SAVINGS BANK', 'FEDERAL CREDIT UNION',
  'CREDIT UNION', 'SAVINGS BANK', 'N.A.', 'NA', 'N.A', 'BANK', 'INC.', 'INC',
]

/** Words that never earn a monogram letter — they identify no institution. */
const STOP_WORDS = new Set(['OF', 'THE', 'AND', 'FOR'])

/**
 * Strip trailing legal suffixes, repeatedly — "USAA FEDERAL SAVINGS BANK"
 * sheds "FEDERAL SAVINGS BANK" in one pass, "JPMORGAN CHASE BANK N.A." sheds
 * "N.A." and then "BANK". Falls back to the input if stripping would empty it,
 * because an issuer literally named "BANK" is better than an empty label.
 */
export function issuerShortName(legalName: string): string {
  let name = legalName.trim().toUpperCase().replace(/,/g, '')

  let changed = true
  while (changed) {
    changed = false
    for (const suffix of LEGAL_SUFFIXES) {
      if (name.length > suffix.length && name.endsWith(` ${suffix}`)) {
        name = name.slice(0, -(suffix.length + 1)).trim()
        changed = true
      }
    }
  }

  return name || legalName.trim().toUpperCase()
}

/**
 * Up to two letters from the short name's significant words: "BANK OF AMERICA"
 * → BA (the "OF" is skipped), "SYNCHRONY" → SY, "USAA" → US.
 *
 * Two letters, not three: the mark is a 20px chip, and a third glyph costs
 * legibility for a distinction the tint already makes.
 */
export function issuerMonogram(legalName: string): string {
  const words = issuerShortName(legalName)
    .split(/[\s_\-.]+/)
    .filter((word) => word && !STOP_WORDS.has(word))

  if (words.length === 0) return '?'
  if (words.length === 1) return words[0].slice(0, 2)
  return words[0][0] + words[1][0]
}

/**
 * Hue for the issuer's chip, hashed from the SHORT name so the tint survives a
 * change of legal suffix. Reuses the avatar wheel (twelve coarse stops) — one
 * hue derivation in the product, not two that can drift.
 */
export function issuerHue(legalName: string): number {
  return hueFor(issuerShortName(legalName))
}
