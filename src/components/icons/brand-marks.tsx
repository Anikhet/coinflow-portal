/**
 * BRAND MARKS
 * =============================================================================
 * Payment identity is conveyed by glyph + plain text, never by a colored pill
 * (pill taxonomy rule 4). These marks carry the recognition load so the text
 * beside them can stay quiet and uncolored.
 *
 * Each mark renders inside a fixed 20x14 (card) or 16x16 (rail) box so table
 * cells reserve identical space regardless of which brand a row carries — a
 * varying glyph width would make an entire column ragged.
 *
 * Marks are simplified representations for a design prototype, not official
 * brand assets.
 */

const CARD_BOX = 'inline-flex size-[20px] shrink-0 items-center justify-center rounded-[3px]'

export function VisaMark() {
  return (
    <span className={`${CARD_BOX} bg-[#1434CB]`} aria-label="Visa">
      <svg viewBox="0 0 24 8" className="w-[15px]" fill="#fff">
        <path d="M9.6.3 6.3 7.7H4.2L2.6 1.9c-.1-.4-.2-.5-.5-.7C1.6.9.9.7.3.5L.4.3h3.4c.4 0 .8.3.9.8l.9 4.6L7.5.3h2.1Zm8.3 5c0-2-2.8-2.1-2.8-3 0-.3.3-.6 0.9-.7.3 0 1.1-.1 2 .3l.4-1.6c-.5-.2-1.1-.3-1.9-.3-2 0-3.4 1-3.4 2.5 0 1.1 1 1.7 1.7 2.1.8.4 1 .6 1 .9 0 .5-.6.7-1.1.7-.9 0-1.5-.2-1.9-.4l-.4 1.6c.4.2 1.2.4 2.1.4 2.1 0 3.4-1 3.4-2.5Zm5.2 2.4h1.8L23.3.3h-1.7c-.4 0-.7.2-.8.6l-2.9 6.8h2l.4-1.1h2.5l.3 1.1Zm-2.2-2.6 1-2.8.6 2.8h-1.6ZM12.4.3l-1.6 7.4H8.9L10.5.3h1.9Z"/>
      </svg>
    </span>
  )
}

export function MastercardMark() {
  return (
    <span className={`${CARD_BOX} bg-[#16161A]`} aria-label="Mastercard">
      <svg viewBox="0 0 24 15" className="w-[15px]">
        <circle cx="9" cy="7.5" r="7" fill="#EB001B" />
        <circle cx="15" cy="7.5" r="7" fill="#F79E1B" />
        <path d="M12 2.1a7 7 0 0 0 0 10.8 7 7 0 0 0 0-10.8Z" fill="#FF5F00" />
      </svg>
    </span>
  )
}

export function AmexMark() {
  return (
    <span className={`${CARD_BOX} bg-[#1F72CD]`} aria-label="American Express">
      <svg viewBox="0 0 24 10" className="w-[15px]" fill="#fff">
        <path d="M2.6.6 0 6.4h1.6l.5-1.2h2.6l.5 1.2h3.2V5.5l.3.9h1.7l.3-.9v.9h6.6l.8-.9.8.9H24l-2.6-2.9L24 .6h-2.9l-.8.8-.7-.8h-7.2l-.6 1.4-.6-1.4H8.6v.9L8.1.6H2.6Zm.5 1.2h.8l1 2.3V1.8h1.4l1.1 2.5 1-2.5h5.2v.6h-3v.9h2.9v.6h-2.9v.9h3v-.5l1.9-2 1.9 2.5V1.8h1.5l1.1 1.3 1.2-1.3h1.2l-1.8 2 1.8 2h-1.3l-1.1-1.3-1.2 1.3h-3.4V4.6h-1.5l-1.4 1.8H8.4V2.9L7 6.4H6L4.6 2.9v3.5H2.5l-.4-1.2H4l-.4-1H2.6l.5-1.4Z"/>
      </svg>
    </span>
  )
}

export function ApplePayMark() {
  return (
    <span className={`${CARD_BOX} bg-[#16161A]`} aria-label="Apple Pay">
      <svg viewBox="0 0 16 20" className="w-[10px]" fill="#fff">
        <path d="M13.1 10.6c0-2.2 1.8-3.2 1.9-3.3-1-1.5-2.6-1.7-3.2-1.7-1.4-.1-2.7.8-3.3.8-.7 0-1.7-.8-2.8-.8-1.5 0-2.8.8-3.5 2.1-1.5 2.6-.4 6.5 1.1 8.6.7 1.1 1.6 2.2 2.7 2.2 1.1 0 1.5-.7 2.8-.7s1.7.7 2.8.7c1.2 0 1.9-1.1 2.6-2.1.8-1.2 1.2-2.4 1.2-2.5-.1 0-2.3-.9-2.3-3.3Z"/>
        <path d="M11 4c.6-.7 1-1.8.9-2.8-.9 0-1.9.6-2.5 1.3-.6.7-1.1 1.7-.9 2.7 1 .1 1.9-.5 2.5-1.2Z"/>
      </svg>
    </span>
  )
}

export function GooglePayMark() {
  return (
    <span className={`${CARD_BOX} bg-surface ring-1 ring-inset ring-border-strong`} aria-label="Google Pay">
      <svg viewBox="0 0 24 24" className="w-[12px]">
        <path fill="#4285F4" d="M23 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.2a5.3 5.3 0 0 1-2.3 3.5v2.9h3.7c2.2-2 3.4-5 3.4-8.5Z"/>
        <path fill="#34A853" d="M12 23.5c3.1 0 5.7-1 7.6-2.8l-3.7-2.9c-1 .7-2.3 1.1-3.9 1.1-3 0-5.5-2-6.4-4.7H1.8v3C3.7 21 7.6 23.5 12 23.5Z"/>
        <path fill="#FBBC05" d="M5.6 14.2a6.9 6.9 0 0 1 0-4.4v-3H1.8a11.5 11.5 0 0 0 0 10.4l3.8-3Z"/>
        <path fill="#EA4335" d="M12 5.1c1.7 0 3.2.6 4.4 1.7l3.3-3.3C17.7 1.6 15.1.5 12 .5 7.6.5 3.7 3 1.8 6.8l3.8 3C6.5 7.1 9 5.1 12 5.1Z"/>
      </svg>
    </span>
  )
}

export function VenmoMark() {
  return (
    <span className={`${CARD_BOX} bg-[#008CFF]`} aria-label="Venmo">
      <svg viewBox="0 0 16 16" className="w-[10px]" fill="#fff">
        <path d="M12.9 1.3c.5.9.8 1.8.8 2.9 0 3.6-3 8.3-5.5 11.5H2.5L.3 2.3l5-.5 1.2 9.5C7.6 9.5 9 6.6 9 4.6c0-1.1-.2-1.8-.5-2.4l4.4-.9Z"/>
      </svg>
    </span>
  )
}

export function PayPalMark() {
  return (
    <span className={`${CARD_BOX} bg-[#003087]`} aria-label="PayPal">
      <svg viewBox="0 0 16 16" className="w-[10px]">
        <path fill="#fff" d="M6.2 14.5H3.7c-.2 0-.4-.2-.3-.4L5.3 1.6c0-.2.2-.3.4-.3h4.5c2.3 0 3.7 1.2 3.4 3.4-.4 2.5-2.1 3.7-4.5 3.7H7.4c-.2 0-.4.1-.4.3l-.5 5.4c0 .2-.1.4-.3.4Z"/>
        <path fill="#009CDE" d="M8.6 15.9H6.4c-.2 0-.3-.1-.3-.3l1.3-8c0-.2.2-.3.4-.3h1.4c2 0 3.3 1 3.1 3-.3 2.1-1.8 3.1-3.8 3.1h-.5l-.4 2.5Z" opacity=".85"/>
      </svg>
    </span>
  )
}

export function CashAppMark() {
  return (
    <span className={`${CARD_BOX} bg-[#00D64F]`} aria-label="Cash App">
      <svg viewBox="0 0 16 16" className="w-[10px]" fill="#fff">
        <path d="M9.6 3.1 9.9 1.6h-1.7l-.3 1.4c-1.6.1-2.9 1-2.9 2.6 0 1.5 1.2 2.1 2.5 2.5 1.2.4 1.7.7 1.7 1.3 0 .6-.6.9-1.4.9-1 0-2-.4-2.6-.9l-.9 1.5c.6.5 1.5.9 2.5 1l-.3 1.5h1.7l.3-1.5c1.8-.2 3-1.2 3-2.7 0-1.5-1.2-2.1-2.6-2.6-1.1-.4-1.6-.6-1.6-1.2 0-.5.5-.8 1.2-.8.9 0 1.7.4 2.2.8l1-1.4c-.6-.5-1.3-.8-2.1-.9Z"/>
      </svg>
    </span>
  )
}

export function SolanaMark({ className = 'size-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 20" className={className} aria-label="Solana">
      <defs>
        <linearGradient id="sol-g" x1="0" y1="20" x2="24" y2="0">
          <stop offset="0" stopColor="#9945FF" />
          <stop offset="1" stopColor="#14F195" />
        </linearGradient>
      </defs>
      <g fill="url(#sol-g)">
        <path d="M4 14.7a.8.8 0 0 1 .6-.3h18.1c.4 0 .6.5.3.8l-3.4 3.5a.8.8 0 0 1-.6.3H.9c-.4 0-.6-.5-.3-.8L4 14.7Z" />
        <path d="M4 1.3a.8.8 0 0 1 .6-.3h18.1c.4 0 .6.5.3.8l-3.4 3.5a.8.8 0 0 1-.6.3H.9c-.4 0-.6-.5-.3-.8L4 1.3Z" />
        <path d="M19.6 8a.8.8 0 0 0-.6-.3H.9c-.4 0-.6.5-.3.8L4 12a.8.8 0 0 0 .6.3h18.1c.4 0 .6-.5.3-.8L19.6 8Z" />
      </g>
    </svg>
  )
}

export function BankMark() {
  return (
    <span className={`${CARD_BOX} bg-[var(--tone-neutral-bg)] ring-1 ring-inset ring-[var(--tone-neutral-ring)]`} aria-label="Bank transfer">
      <svg viewBox="0 0 16 16" className="w-[11px]" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <path d="M2 6.5 8 3l6 3.5M3.5 6.5v5M6.5 6.5v5M9.5 6.5v5M12.5 6.5v5M2 13h12" />
      </svg>
    </span>
  )
}

export function PixMark() {
  return (
    <span className={`${CARD_BOX} bg-[#32BCAD]`} aria-label="PIX">
      <svg viewBox="0 0 16 16" className="w-[10px]" fill="#fff">
        <path d="M8 1.2 4.6 4.6h1.2c.4 0 .8.2 1.1.5L8 6.2l1.1-1.1c.3-.3.7-.5 1.1-.5h1.2L8 1.2ZM4.6 11.4 8 14.8l3.4-3.4h-1.2c-.4 0-.8-.2-1.1-.5L8 9.8l-1.1 1.1c-.3.3-.7.5-1.1.5H4.6ZM1.2 8l2.3-2.3h1.6c.2 0 .4.1.6.2L7.4 8l-1.7 2.1c-.2.1-.4.2-.6.2H3.5L1.2 8Zm13.6 0-2.3-2.3h-1.6c-.2 0-.4.1-.6.2L8.6 8l1.7 2.1c.2.1.4.2.6.2h1.6L14.8 8Z"/>
      </svg>
    </span>
  )
}

/**
 * PROCESSOR MARKS
 * -----------------------------------------------------------------------------
 * Each acquiring processor gets its own mark in its own brand colour, so the
 * Processor column is scanned by shape and hue rather than read letter by
 * letter. Two of these carry a real glyph (Stripe's S, Checkout's tick); the
 * bank processors have no widely-recognised symbol, so they use their brand
 * colour with a letterform — which is still identity, not a generic grey chip.
 *
 * They share CARD_BOX, so every processor occupies the same 20px square and the
 * column stays flush no matter which brand a row carries.
 *
 * These are simplified representations for a design prototype, not official
 * brand assets.
 */

/** Letterform mark for processors without a distinctive symbol. */
/**
 * Monogram fallback for processors with no drawable logo.
 *
 * The sizes here are the ONE sanctioned exception to the type scale: this is
 * lettering inside a mark, fitted to a fixed glyph box, not UI type. "MVB" needs
 * 7px to sit inside the same 20px chip that holds a single-letter "h" at 11px.
 * Forcing both onto the shared scale would either overflow the chip or leave the
 * one-letter marks tiny. `scripts/check-scale.mjs` exempts this file.
 */
function LetterMark({ label, text, className, size = 'text-[9px]' }: {
  label: string
  text: string
  className: string
  size?: string
}) {
  return (
    <span className={`${CARD_BOX} ${className}`} aria-label={label}>
      <span className={`${size} font-bold leading-none tracking-tight`}>{text}</span>
    </span>
  )
}

export function StripeMark() {
  return (
    <span className={`${CARD_BOX} bg-[#635BFF]`} aria-label="Stripe">
      <svg viewBox="0 0 16 16" className="w-[9px]" fill="#fff">
        <path d="M7.6 6.3c0-.6.5-.8 1.3-.8 1.1 0 2.6.4 3.7 1V3.1A9.6 9.6 0 0 0 8.9 2.5C6.1 2.5 4.2 4 4.2 6.4c0 3.8 5.2 3.2 5.2 4.8 0 .7-.6.9-1.5.9-1.2 0-2.8-.5-4-1.2v3.5c1.3.6 2.7.8 4 .8 2.9 0 4.9-1.4 4.9-3.9 0-4.1-5.2-3.4-5.2-5Z"/>
      </svg>
    </span>
  )
}

export function CheckoutMark() {
  return (
    <span className={`${CARD_BOX} bg-[#0B1F3F]`} aria-label="Checkout.com">
      <svg viewBox="0 0 16 16" className="w-[10px]" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 8.6 6.3 12 13 4.5" />
      </svg>
    </span>
  )
}

export function HighnoteMark() {
  return <LetterMark label="Highnote" text="h" className="bg-[#101014] text-[#C6F24E]" size="text-[11px]" />
}

export function FifthThirdMark() {
  return <LetterMark label="Fifth Third" text="53" className="bg-[#0033A0] text-white" />
}

export function MvbMark() {
  return <LetterMark label="MVB" text="MVB" className="bg-[#00447C] text-white" size="text-[7px]" />
}
