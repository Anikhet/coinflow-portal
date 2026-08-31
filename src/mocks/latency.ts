/**
 * Artificial delay on every mock call.
 *
 * Deliberate: it means loading states, skeletons and empty states are exercised
 * on every navigation during development, rather than being bolted on at
 * integration time when the real API turns out to be slow.
 */
export const latency = (ms = 260) => new Promise<void>((resolve) => setTimeout(resolve, ms))
