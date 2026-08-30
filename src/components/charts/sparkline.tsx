/**
 * Inline sparkline for KPI cards.
 *
 * Hand-rolled SVG rather than a charting library: at this size a library adds
 * a wrapper, a responsive container and a render cycle to draw ~12 points. The
 * viewBox is fixed and the path is normalised into it, so the element occupies
 * a constant box and cannot shift the card as data loads.
 */
export function Sparkline({ values, tone = 'brand' }: {
  values: number[]
  tone?: 'brand' | 'positive' | 'critical'
}) {
  if (values.length < 2) return <div className="h-8 w-full" />

  const max = Math.max(...values)
  const min = Math.min(...values)
  const range = max - min || 1

  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * 100
    const y = 28 - ((value - min) / range) * 24
    return `${x.toFixed(2)},${y.toFixed(2)}`
  })

  const stroke = {
    brand: 'var(--brand)',
    positive: 'var(--tone-positive-dot)',
    critical: 'var(--tone-critical-dot)',
  }[tone]

  const gradientId = `spark-${tone}`

  return (
    <svg viewBox="0 0 100 32" preserveAspectRatio="none" className="h-8 w-full" aria-hidden>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.18" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,32 ${points.join(' ')} 100,32`} fill={`url(#${gradientId})`} />
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}
