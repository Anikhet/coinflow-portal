import type { PaymentMethod, Processor } from '@/types/payment'
import {
  VisaMark, MastercardMark, AmexMark, ApplePayMark, GooglePayMark,
  VenmoMark, PayPalMark, CashAppMark, BankMark, PixMark, SolanaMark,
} from './brand-marks'

/**
 * Resolves a payment method to its glyph + label. Rendered as glyph + plain
 * text (never a pill) so identity columns stay visually quiet and the status
 * pill remains the only colored element in the row.
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

export function methodLabel(method: PaymentMethod) {
  return METHOD_LABEL[method]
}

export function MethodGlyph({ method, cardBrand }: {
  method: PaymentMethod
  cardBrand?: 'visa' | 'mastercard' | 'amex' | null
}) {
  switch (method) {
    case 'apple-pay':   return <ApplePayMark />
    case 'google-pay':  return <GooglePayMark />
    case 'venmo':       return <VenmoMark />
    case 'paypal':      return <PayPalMark />
    case 'cashapp':     return <CashAppMark />
    case 'bank':        return <BankMark />
    case 'pix':         return <PixMark />
    case 'crypto':      return <span className="inline-flex size-[20px] shrink-0 items-center justify-center"><SolanaMark className="w-[15px]" /></span>
    case 'card':
      if (cardBrand === 'mastercard') return <MastercardMark />
      if (cardBrand === 'amex') return <AmexMark />
      return <VisaMark />
  }
}

export function CardBrandGlyph({ brand }: { brand: 'visa' | 'mastercard' | 'amex' }) {
  if (brand === 'mastercard') return <MastercardMark />
  if (brand === 'amex') return <AmexMark />
  return <VisaMark />
}

/**
 * Processors are infrastructure, not brands the operator needs to recognise by
 * logo. A two-letter monogram in a neutral chip identifies them at a glance
 * without introducing eleven more color-bearing logos into the table.
 */
const PROCESSOR_LABEL: Record<Processor, string> = {
  fifththird: 'Fifth Third',
  highnote: 'Highnote',
  mvb: 'MVB',
  checkout: 'Checkout',
  stripe: 'Stripe',
}

export function processorLabel(processor: Processor) {
  return PROCESSOR_LABEL[processor]
}

export function ProcessorGlyph({ processor }: { processor: Processor }) {
  const initials = PROCESSOR_LABEL[processor]
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <span
      aria-hidden
      className="inline-flex size-[20px] shrink-0 items-center justify-center rounded-[3px] bg-surface-sunk text-[9px] font-semibold tracking-tight text-ink-muted ring-1 ring-inset ring-border"
    >
      {initials}
    </span>
  )
}
