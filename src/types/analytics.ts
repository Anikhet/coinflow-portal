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
  payments: { amount: number; count: number; deltaPct: number; spark: number[] }
  customers: { count: number; deltaPct: number; spark: number[] }
  payouts: { amount: number; count: number; deltaPct: number; spark: number[] }
}
