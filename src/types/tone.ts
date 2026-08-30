/**
 * The closed set of semantic tones. This is the ONLY vocabulary the UI has for
 * expressing state.
 *
 * Brand violet is deliberately absent: it is reserved for interactive and
 * identity affordances. Keeping it out of the tone set guarantees that a violet
 * element can never be misread as a status, which is what allows a dense table
 * row to stay scannable.
 */
export type Tone = 'positive' | 'caution' | 'critical' | 'info' | 'neutral'
