import type { ReactNode } from 'react'
import type { GlossaryTerm } from '@/lib/glossary'

/** Which drawing of a part-to-whole split the card is showing. */
export type BreakdownView = 'donut' | 'bars' | 'list'

export interface BreakdownRow {
  key: string
  label: string
  amount: number
  count: number
  /** 0–1 share of the total. */
  share: number
  /**
   * Leading mark — a card logo, a merchant avatar, a rail glyph. Supplied by
   * the caller rather than derived here: the breakdown card renders
   * part-to-whole rows for anything, and teaching it about brands and
   * merchants would tie a generic chart to two specific datasets.
   */
  media?: ReactNode
}

/** One dimension of a split, e.g. "By brand" or "By funding type". */
export interface BreakdownGroup {
  label: string
  rows: BreakdownRow[]
  term?: GlossaryTerm
}
