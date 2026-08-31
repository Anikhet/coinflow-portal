export interface SeriesPoint {
  date: string
  [seriesKey: string]: string | number
}

export interface MethodSeries {
  key: string
  label: string
  total: number
}

export interface OverviewMetrics {
  payments: { amount: number; count: number; deltaPct: number }
  customers: { count: number; deltaPct: number }
  payouts: { amount: number; count: number; deltaPct: number }

  /**
   * Share of attempted payments the issuer approved. The most sensitive early
   * warning on a payments dashboard — volume tells you what happened, this
   * tells you whether something is wrong right now. It moves within minutes of
   * a processor or rules problem.
   */
  approvalRate: { pct: number; deltaPct: number; approved: number; attempted: number }

  /**
   * Disputed payments as a share of settled ones, carried with the network
   * threshold it is measured against. The raw count is meaningless on its own:
   * 21 disputes is fine at this volume and a crisis at a hundredth of it. Card
   * networks place a merchant into a monitoring programme above roughly 0.9%,
   * so the number only means something beside that line.
   */
  chargebackRate: { pct: number; deltaPct: number; disputes: number; threshold: number }
}
