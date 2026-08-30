import { createRandom, type Random } from './random'
import type {
  Payment, PaymentMethod, PaymentStatus, Processor,
  ProtectionState, ThreeDSState, OrchestrationAttempt, PaymentFee,
} from '@/types/payment'
import type { Customer, CustomerActivity, CustomerCard, SignalRow } from '@/types/customer'

/**
 * SEEDED FIXTURE DATASET
 * =============================================================================
 * Generates a realistic corpus once at module load. Distributions are weighted
 * rather than uniform because a uniform dataset would misrepresent the UI: real
 * payment traffic is ~85% settled, so a table where a fifth of rows are red
 * would make the status column look far busier than it does in production, and
 * we would tune the design against the wrong picture.
 */

const MERCHANTS = ['Triumph_TCG', 'courtside', 'icybox', 'packz', 'northgate', 'lumen_labs'] as const

const FIRST_NAMES = ['Ava','Noah','Mia','Liam','Zoe','Ethan','Ivy','Kai','Nora','Owen','Ruby','Silas','Elena','Marcus','Priya','Devon','Yuki','Omar','Lena','Theo'] as const
const LAST_NAMES = ['Reyes','Okafor','Lindqvist','Nakamura','Haddad','Moreau','Costa','Whitfield','Bergman','Alvarez','Novak','Iqbal','Petrov','Sandoval','Kowalski','Adeyemi'] as const

const CITIES = [
  ['Chicago, IL', 'US'], ['Austin, TX', 'US'], ['Brooklyn, NY', 'US'], ['Denver, CO', 'US'],
  ['Seattle, WA', 'US'], ['Miami, FL', 'US'], ['Toronto, ON', 'CA'], ['Lisbon', 'PT'],
  ['Berlin', 'DE'], ['São Paulo', 'BR'], ['Manila', 'PH'], ['Lagos', 'NG'],
] as const

const ISSUERS = [
  'BANK OF AMERICA NATIONAL ASSOCIATION', 'JPMORGAN CHASE BANK N.A.', 'CAPITAL ONE N.A.',
  'WELLS FARGO BANK N.A.', 'NAVY FEDERAL CREDIT UNION', 'SYNCHRONY BANK', 'USAA FEDERAL SAVINGS BANK',
] as const

const DECLINE_CODES = [
  ['05', 'Do not honor'], ['51', 'Insufficient funds'], ['97', 'CVV mismatch'],
  ['14', 'Invalid card number'], ['54', 'Expired card'], ['61', 'Exceeds withdrawal limit'],
] as const

const METHOD_WEIGHTS: ReadonlyArray<readonly [PaymentMethod, number]> = [
  ['card', 34], ['apple-pay', 22], ['google-pay', 11], ['venmo', 8], ['paypal', 8],
  ['cashapp', 6], ['bank', 5], ['crypto', 4], ['pix', 2],
]

const STATUS_WEIGHTS: ReadonlyArray<readonly [PaymentStatus, number]> = [
  ['settled', 82], ['failed', 9], ['initiated', 4], ['refunded', 3], ['disputed', 2],
]

const PROCESSOR_WEIGHTS: ReadonlyArray<readonly [Processor, number]> = [
  ['fifththird', 38], ['highnote', 27], ['mvb', 17], ['checkout', 12], ['stripe', 6],
]

const AMOUNT_TIERS: ReadonlyArray<readonly [[number, number], number]> = [
  [[5, 25], 34], [[25, 100], 28], [[100, 400], 20],
  [[400, 2500], 12], [[2500, 12000], 5], [[12000, 40000], 1],
]

function fullName(random: Random) {
  return `${random.pick(FIRST_NAMES)} ${random.pick(LAST_NAMES)}`
}

function emailFor(name: string, random: Random) {
  const host = random.pick(['gmail.com', 'proton.me', 'outlook.com', 'fastmail.com', 'icloud.com'])
  return `${name.toLowerCase().replace(/[^a-z]/g, '.')}${random.int(2, 89)}@${host}`
}

function amountFor(random: Random) {
  const [min, max] = random.weighted(AMOUNT_TIERS)
  return Math.round(random.float(min, max) * 100) / 100
}

function streetAddress(random: Random) {
  const [city] = random.pick(CITIES)
  const street = random.pick(['Maple', 'Sycamore', 'Lakeshore', 'Fremont', 'Bell', 'Ardmore', 'Kingsley'])
  return `${random.int(100, 9800)} ${street} ${random.pick(['St', 'Ave', 'Rd', 'Blvd'])}, ${city}`
}

/** Builds the fee breakdown. Rates approximate real interchange + platform fees. */
function buildFees(random: Random, subtotal: number, protection: ProtectionState, isCrypto: boolean): PaymentFee[] {
  const round = (value: number) => Math.round(value * 100) / 100
  const cardFee = round(subtotal * 0.0055 + 0.1)
  const protectionFee = protection === 'approved' ? round(subtotal * 0.0095) : 0
  const networkFee = round(subtotal * 0.002 + 0.45)
  const gasFee = isCrypto ? Math.round(random.float(0.0003, 0.0007) * 10000) / 10000 : 0

  return [
    { label: 'Credit card fees', total: cardFee, paidByMerchant: cardFee, paidByCustomer: 0 },
    { label: 'Chargeback protection fees', total: protectionFee, paidByMerchant: protectionFee, paidByCustomer: 0 },
    { label: 'Network fees', total: networkFee, paidByMerchant: networkFee, paidByCustomer: 0 },
    { label: 'Transaction gas fees', total: gasFee, paidByMerchant: gasFee, paidByCustomer: 0 },
  ]
}

/**
 * Builds the processor routing chain. A failed first attempt that succeeds on
 * retry is the single most valuable thing this drawer can show an operator, so
 * multi-attempt chains are generated at a meaningful rate rather than as a rare
 * edge case.
 */
function buildAttempts(random: Random, processor: Processor, status: PaymentStatus): OrchestrationAttempt[] {
  const succeeded = status === 'settled' || status === 'refunded' || status === 'disputed'

  if (random.bool(0.24)) {
    const fallback = random.pick(PROCESSOR_WEIGHTS.map(([p]) => p).filter((p) => p !== processor))
    return [
      { processor: fallback, outcome: 'failed' },
      { processor, outcome: succeeded ? 'succeeded' : 'failed' },
    ]
  }

  return [{ processor, outcome: succeeded ? 'succeeded' : 'failed' }]
}

function buildPayment(random: Random, now: number, customerPool: Array<{ id: string; name: string; email: string }>): Payment {
  const method = random.weighted(METHOD_WEIGHTS)
  const status = random.weighted(STATUS_WEIGHTS)
  const processor = random.weighted(PROCESSOR_WEIGHTS)
  const subtotal = amountFor(random)
  const isCardLike = method === 'card' || method === 'apple-pay' || method === 'google-pay'
  const cardBrand = isCardLike
    ? random.weighted([['visa', 55], ['mastercard', 33], ['amex', 12]] as const)
    : null

  const failed = status === 'failed'
  const [code, codeLabel] = failed ? random.pick(DECLINE_CODES) : (['00', 'Approved'] as const)

  const protection: ProtectionState = failed
    ? 'standard'
    : random.weighted([['approved', 74], ['standard', 22], ['declined', 4]] as const)

  const threeDS: ThreeDSState = random.weighted([
    ['standard', 68], ['authenticated', 22], ['attempted', 7], ['failed', 3],
  ] as const)

  const customer = random.pick(customerPool)
  const settlesOnChain = status === 'settled' && random.bool(0.82)

  // Spread across the last 7 days, front-loaded so the top of the table is fresh.
  const minutesAgo = Math.round(random.float(0, 1) ** 1.15 * 7 * 24 * 60)
  const createdAt = new Date(now - minutesAgo * 60_000).toISOString()

  const id = `${random.hex(8)}-${random.hex(4)}-${random.hex(4)}-${random.hex(4)}-${random.hex(12)}`

  return {
    id,
    shortId: `${id.slice(0, 4)}…${id.slice(-4)}`,
    createdAt,
    merchant: random.pick(MERCHANTS),
    method,
    processor,
    cardBrand,
    cardLast4: isCardLike ? String(random.int(1000, 9999)) : null,
    cardExpiry: isCardLike ? `${String(random.int(1, 12)).padStart(2, '0')}/${random.int(27, 32)}` : null,
    subtotal,
    customerId: customer.id,
    customerName: customer.name,
    customerEmail: customer.email,
    status,
    responseCode: code,
    responseLabel: codeLabel,
    disbursed: status === 'settled' && random.bool(0.68),
    protection,
    threeDS,
    chainTx: settlesOnChain ? random.base58(64) : null,
    chainWallet: settlesOnChain ? random.base58(44) : null,
    issuer: random.pick(ISSUERS),
    issuerCountry: 'US',
    fundingType: random.weighted([['debit', 58], ['credit', 38], ['prepaid', 4]] as const),
    cvvResponse: failed && code === '97' ? 'N' : random.pick(['M', 'P', 'M', 'M']),
    cvvLabel: failed && code === '97' ? 'No match' : random.pick(['Match', 'Not processed', 'Match', 'Match']),
    statementDescriptor: random.pick(['TRIUMPH', 'COURTSIDE', 'ICYBOX', 'PACKZ']),
    transactionType: method === 'apple-pay' || method === 'google-pay' ? 'Mobile wallet' : method === 'card' ? 'Card not present' : 'Alternative rail',
    orchestrationRule: `mvb_${processor}_50_50 v${random.int(8, 14)}`,
    attempts: buildAttempts(random, processor, status),
    fees: buildFees(random, subtotal, protection, settlesOnChain),
  }
}

function buildSignals(random: Random, count: number, make: () => string, totalVolume: number): SignalRow[] {
  const rows: SignalRow[] = []
  let remaining = totalVolume
  for (let i = 0; i < count; i += 1) {
    const isLast = i === count - 1
    const share = isLast ? remaining : Math.round(remaining * random.float(0.3, 0.75) * 100) / 100
    remaining = Math.round((remaining - share) * 100) / 100
    rows.push({ value: make(), count: random.int(1, 60), volume: Math.max(0, share) })
  }
  return rows.sort((a, b) => b.volume - a.volume)
}

function buildCards(random: Random, count: number, now: number): CustomerCard[] {
  return Array.from({ length: count }, () => {
    const paymentCount = random.weighted([[0, 25], [random.int(1, 5), 40], [random.int(6, 30), 25], [random.int(31, 90), 10]] as const)
    const addedAt = new Date(now - random.int(1, 200) * 86_400_000).toISOString()
    return {
      id: random.hex(16),
      brand: random.weighted([['visa', 58], ['mastercard', 32], ['amex', 10]] as const),
      last4: String(random.int(1000, 9999)),
      expiry: `${String(random.int(1, 12)).padStart(2, '0')}/${random.int(27, 32)}`,
      paymentCount,
      addedAt,
      firstPaymentAt: paymentCount > 0 ? new Date(new Date(addedAt).getTime() + random.int(1, 400) * 60_000).toISOString() : null,
      billingAddress: streetAddress(random),
    }
  }).sort((a, b) => b.paymentCount - a.paymentCount)
}

function buildActivity(random: Random, count: number, now: number): CustomerActivity[] {
  return Array.from({ length: count }, () => {
    const kind = random.weighted([['payment', 62], ['payout', 26], ['method-added', 8], ['dispute', 4]] as const)
    const status: CustomerActivity['status'] =
      kind === 'dispute' ? 'opened'
      : kind === 'payout' ? random.weighted([['completed', 88], ['pending', 12]] as const)
      : kind === 'method-added' ? 'completed'
      : random.weighted([['settled', 84], ['failed', 16]] as const)

    const failed = status === 'failed'
    return {
      id: random.hex(12),
      kind,
      at: new Date(now - Math.round(random.float(0, 1) ** 1.5 * 210 * 86_400_000)).toISOString(),
      amount: kind === 'method-added' ? 0 : amountFor(random),
      status,
      brand: kind === 'payment' ? random.weighted([['visa', 6], ['mastercard', 3], ['amex', 1]] as const) : null,
      rail: kind === 'payout' ? random.pick(['Card', 'ASAP (RTP)', 'Same day', 'Standard']) : null,
      responseCode: kind === 'payment' ? (failed ? random.pick(DECLINE_CODES)[0] : '00') : null,
      note: failed ? random.pick(['CVV: No match', 'Issuer declined', 'Velocity limit']) : null,
    }
  }).sort((a, b) => +new Date(b.at) - +new Date(a.at))
}

function buildCustomer(random: Random, now: number): Customer {
  const name = fullName(random)
  const id = `${random.hex(8)}-${random.hex(4)}-${random.hex(12)}`
  const paymentCount = random.int(1, 180)
  const totalVolume = Math.round(paymentCount * random.float(9, 62) * 100) / 100

  // ~18% of customers carry at least one risk exception. Keeping this low is
  // the point: the table must look calm so that exceptions actually stand out.
  const risky = random.bool(0.18)
  const veryRisky = risky && random.bool(0.3)

  const disputeCount = veryRisky ? random.int(1, 4) : random.bool(0.05) ? 1 : 0

  return {
    id,
    shortId: `${id.slice(0, 8)}`,
    createdAt: new Date(now - random.int(3, 640) * 86_400_000).toISOString(),
    merchant: random.pick(MERCHANTS),
    name,
    email: emailFor(name, random),
    protectionEnabled: !(risky && random.bool(0.35)),
    blocked: veryRisky && random.bool(0.4),
    threeDSProcessing: risky ? random.weighted([['functional', 50], ['degraded', 35], ['off', 15]] as const) : 'functional',
    attemptLimit: risky ? random.weighted([['standard', 45], ['restricted', 40], ['elevated', 15]] as const) : 'standard',
    verification: risky ? random.weighted([['enforced', 40], ['not-found', 45], ['standard', 15]] as const) : 'enforced',
    fraudOverride: veryRisky ? random.weighted([['standard', 40], ['allow', 30], ['deny', 30]] as const) : 'standard',
    kyc: risky
      ? random.weighted([['verified', 30], ['pending', 40], ['not-started', 20], ['rejected', 10]] as const)
      : random.weighted([['verified', 82], ['pending', 18]] as const),
    totalVolume,
    paymentCount,
    overriddenVolume: veryRisky ? Math.round(totalVolume * random.float(0.05, 0.3) * 100) / 100 : 0,
    overriddenCount: veryRisky ? random.int(1, 6) : 0,
    disputeCount,
    names: buildSignals(random, veryRisky ? random.int(2, 4) : 1, () => fullName(random), totalVolume),
    billingAddresses: buildSignals(random, risky ? random.int(2, 3) : 1, () => streetAddress(random), totalVolume),
    ipLocations: buildSignals(random, risky ? random.int(4, 9) : random.int(1, 3), () => {
      const [city, country] = random.pick(CITIES)
      return `${city} · ${country} · ${random.int(24, 199)}.${random.int(0, 255)}.${random.int(0, 255)}.${random.int(1, 254)}`
    }, totalVolume),
    cards: buildCards(random, random.int(1, 7), now),
    activity: buildActivity(random, random.int(12, 60), now),
  }
}

// -- module-level generation ------------------------------------------------

const SEED = 20260830
const NOW = new Date('2026-08-30T15:50:00Z').getTime()
const random = createRandom(SEED)

export const CUSTOMERS: Customer[] = Array.from({ length: 260 }, () => buildCustomer(random, NOW))
  .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))

const CUSTOMER_POOL = CUSTOMERS.map((c) => ({ id: c.id, name: c.name, email: c.email }))

export const PAYMENTS: Payment[] = Array.from({ length: 1400 }, () => buildPayment(random, NOW, CUSTOMER_POOL))
  .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))

export { NOW as DATASET_NOW }
