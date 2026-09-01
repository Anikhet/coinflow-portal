import { useId } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { formatCompactCurrency, formatCount } from '@/lib/format'
import { formatShare, sliceSwatch } from './donut-slices'
import { SliceTooltip } from './slice-tooltip'
import type { BreakdownRow } from '@/types/breakdown'

/**
 * DONUT CHART
 * =============================================================================
 * The part-to-whole mark used by the breakdown cards, in the shadcn pie-chart
 * style: a donut with the total stated in the hole.
 *
 * A donut is read by ANGLE, which the eye judges poorly past a handful of
 * slices — so this is deliberately paired with a ranked legend carrying exact
 * amounts (see BreakdownPieCard). The ring answers "is this one big slice or an
 * even split?" at a glance; the legend answers "how much, exactly?".
 *
 * The hole is not decoration: it removes the centre of the disc, where slice
 * area is least informative, and buys a slot for the total — the number that
 * gives every percentage below it a denominator.
 *
 * Slices reuse the same categorical hues as the line charts, assigned by RANK
 * (largest first), so the same brand or merchant keeps its colour across a
 * reload as long as its position holds.
 */

export function DonutChart({ slices, total, centerLabel }: {
  slices: BreakdownRow[]
  /** Stated in the hole. Passed in rather than summed here so it agrees exactly
   *  with the card's headline, which is rounded upstream. */
  total: number
  centerLabel: string
}) {
  // SVG ids are document-global and several donuts render on this page.
  const chartId = useId()

  return (
    <div className="relative h-[196px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          {/* The centre total is a sibling overlay that paints AFTER the
              chart, so at equal stacking it covered the hover card — the
              figure showed through "Share 15.2%". Recharts renders its tooltip
              inside the chart, so the fix belongs here rather than on the
              overlay: lift the tooltip above everything the chart draws. */}
          <Tooltip content={<DonutTooltip />} cursor={false} wrapperStyle={{ zIndex: 10 }} />
          <Pie
            data={slices}
            dataKey="amount"
            nameKey="label"
            innerRadius="62%"
            outerRadius="94%"
            paddingAngle={2}
            strokeWidth={2}
            stroke="var(--surface)"
            isAnimationActive={false}
          >
            {slices.map((slice, index) => (
              <Cell key={`${chartId}-${slice.key}`} fill={sliceSwatch(index)} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      {/* Centred over the hole rather than drawn as an SVG label: it inherits
          the app's type scale and tabular numerals that way, and the ring's
          radius is a percentage so an SVG-space y offset would drift. */}
      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        <div className="text-center">
          <p className="text-lg font-semibold tabular-nums leading-tight text-ink">
            {formatCompactCurrency(total)}
          </p>
          <p className="text-xs leading-tight text-ink-faint">{centerLabel}</p>
        </div>
      </div>
    </div>
  )
}

interface DonutTooltipEntry {
  payload?: BreakdownRow
}

function DonutTooltip({ active, payload }: { active?: boolean; payload?: DonutTooltipEntry[] }) {
  const slice = payload?.[0]?.payload
  if (!active || !slice) return null

  return (
    <SliceTooltip
      mark={slice.media}
      label={slice.label}
      figures={[
        { label: 'Amount', value: formatCompactCurrency(slice.amount) },
        { label: 'Share', value: formatShare(slice.share) },
        { label: 'Payments', value: formatCount(slice.count) },
      ]}
    />
  )
}
