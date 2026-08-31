/**
 * GLOSSARY
 * =============================================================================
 * Plain-language definitions for the payments jargon this console is full of.
 *
 * Centralised for the same reason the tone registry is: "Chargeback protection"
 * appears on the payments table, in the payment drawer, on the customers table
 * and in the customer drawer. Four hand-written explanations drift into four
 * subtly different meanings, and the one a reader happens to hit decides what
 * they believe.
 *
 * Copy rules, applied to every entry:
 *  - Lead with what it IS, in one sentence, no jargon of its own.
 *  - Then why an operator should care, if it is not obvious.
 *  - No marketing voice, no "simply" or "just".
 */

export const GLOSSARY = {
  // -- headline metrics ----------------------------------------------------
  settledVolume:
    'Total value of payments that completed and were captured, before fees. Excludes failed, refunded and still-processing payments.',
  payouts:
    'Money withdrawn by customers from the platform to their own bank, card or wallet. Separate from merchant settlement.',
  customers:
    'Customers who signed up during this period. A returning customer who paid again is not counted here.',

  // -- payment attributes --------------------------------------------------
  chargebackProtection:
    'Cover that shifts liability for a chargeback from the merchant to Coinflow. When approved, a disputed payment costs the merchant nothing.',
  threeDSecure:
    'An extra authentication step run by the card network (Visa Secure, Mastercard Identity Check). A successful check moves fraud liability to the issuing bank.',
  responseCode:
    'The issuing bank’s reason for declining. Codes distinguish problems the customer can fix (insufficient funds) from ones they cannot (do not honor).',
  disbursed:
    'Whether funds for this payment have left Coinflow for the merchant’s account. Settled and disbursed are different steps.',
  processor:
    'The acquiring partner that carried this payment to the card networks. Coinflow routes across several, so the same merchant can appear under different processors.',
  chain:
    'Payments settled on Solana carry an on-chain record. The glyph links to the wallet and transaction on a block explorer.',
  subtotal:
    'The amount charged to the customer, before Coinflow fees are deducted.',
  statementDescriptor:
    'The text the customer sees on their bank statement. A descriptor they do not recognise is a common cause of chargebacks.',
  cvvResponse:
    'The issuer’s verdict on the security code. "Not processed" is normal for wallet payments, where no code is entered.',
  orchestration:
    'The rule that decides which processor to try, and in what order. A payment declined by one processor can be retried on another without the customer noticing.',
  interchange:
    'The fee the issuing bank keeps from each card payment. Rates vary by card brand and funding type, which is why the mix matters.',

  // -- customer attributes -------------------------------------------------
  blocked:
    'A blocked customer cannot make new payments. Applied manually or by a fraud rule.',
  attemptLimit:
    'How many payment attempts this customer may make in a window before being throttled. Restricted means a fraud rule has tightened it.',
  verification:
    'Whether identity checks are enforced for this customer. "Not found" means no verification record exists yet.',
  fraudOverride:
    'A manual decision that overrules the fraud engine for this customer, in either direction. Rare and worth reviewing.',
  threeDSProcessing:
    'Whether 3-D Secure can currently run for this customer. Degraded or off means checks are being skipped, so more fraud liability sits with the merchant.',
  kyc:
    'Know Your Customer — the identity verification required before a customer can move money. Pending means documents are submitted but not yet cleared.',
  riskSignals:
    'Distinct names, billing addresses and IP locations seen on this account. A high count of any one is a sign of account sharing or takeover.',
  overriddenVolume:
    'Value of payments that were allowed or blocked by a manual override rather than by the fraud engine.',

  // -- breakdowns ----------------------------------------------------------
  cardBreakdown:
    'Settled card volume split by brand and by funding type. Brand mix drives interchange cost; funding mix drives approval rates and chargeback exposure.',
  merchantPayouts:
    'Net settlement owed to each merchant for this period, after Coinflow fees. Lower than gross payment volume by exactly the fees charged.',
  fundingType:
    'Whether the card draws on a bank balance (debit), a credit line (credit) or preloaded funds (prepaid). Prepaid cards decline more often and are more common in fraud.',
} as const

export type GlossaryTerm = keyof typeof GLOSSARY
