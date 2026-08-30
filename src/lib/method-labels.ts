import type { PaymentMethod, Processor } from '@/types/payment'

/**
 * Display names for payment rails and processors.
 *
 * Kept out of the icon component module so that file exports components only —
 * a module mixing components and plain functions breaks React Fast Refresh,
 * which silently full-reloads the page on edit instead of preserving state.
 */

const METHOD_LABEL: Record<PaymentMethod, string> = {
  card: 'Card',
  'apple-pay': 'Apple Pay',
  'google-pay': 'Google Pay',
  venmo: 'Venmo',
  paypal: 'PayPal',
  cashapp: 'Cash App',
  bank: 'Bank',
  crypto: 'Crypto',
  pix: 'PIX',
}

const PROCESSOR_LABEL: Record<Processor, string> = {
  fifththird: 'Fifth Third',
  highnote: 'Highnote',
  mvb: 'MVB',
  checkout: 'Checkout',
  stripe: 'Stripe',
}

export const methodLabel = (method: PaymentMethod) => METHOD_LABEL[method]
export const processorLabel = (processor: Processor) => PROCESSOR_LABEL[processor]

/** Two-letter monogram used by the processor chip. */
export function processorInitials(processor: Processor) {
  return PROCESSOR_LABEL[processor]
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}
