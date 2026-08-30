import type { ReactElement } from 'react'
import type { PaymentMethod, Processor } from '@/types/payment'
import {
  VisaMark, MastercardMark, AmexMark, ApplePayMark, GooglePayMark,
  VenmoMark, PayPalMark, CashAppMark, BankMark, PixMark, SolanaMark,
  StripeMark, CheckoutMark, HighnoteMark, FifthThirdMark, MvbMark,
} from './brand-marks'

/**
 * Resolves a payment method to its glyph + label. Rendered as glyph + plain
 * text (never a pill) so identity columns stay visually quiet and the status
 * pill remains the only colored element in the row.
 */

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
 * Every processor carries its own brand mark in its own colour.
 *
 * The previous grey monogram made the column uniform: five identical chips
 * whose only difference was two small letters, so the eye had to READ every
 * row to answer "which processor?". Distinct marks let that question be
 * answered by shape and hue at a glance — the same reason the card brands get
 * real logos. All five occupy the identical 20px box, so the column stays
 * flush and no row grows taller than its neighbours.
 */
const PROCESSOR_MARK: Record<Processor, () => ReactElement> = {
  stripe: StripeMark,
  checkout: CheckoutMark,
  highnote: HighnoteMark,
  fifththird: FifthThirdMark,
  mvb: MvbMark,
}

export function ProcessorGlyph({ processor }: { processor: Processor }) {
  const Mark = PROCESSOR_MARK[processor]
  return <Mark />
}
