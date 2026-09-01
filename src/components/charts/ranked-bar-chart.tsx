import type { ReactNode } from 'react'
import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatCompactCurrency, formatCount } from '@/lib/format'
import { formatShare, sliceSwatch } from './donut-slices'
import { SliceTooltip } from './slice-tooltip'
import type { BreakdownRow } from '@/types/breakdown'

/**
 * RANKED BAR CHART
 * =============================================================================
 * The same part-to-whole data as the donut, drawn as horizontal bars.
 *
 * This is the more RIGOROUS of the two views and the one to reach for when the
 * question is "how much bigger is this than that?". Every bar starts at a
 * shared zero baseline, so comparison is a length judgement — the one visual
 * comparison people make accurately. Angle, which the donut asks for, is among
 * the worst.
 *
 * Bars are horizontal rather than vertical, and each is identified by its MARK
 * — the Visa logo, the merchant's avatar, the funding-type glyph — rather than
 * by its name. The marks are the same ones the tables and the sidebar use, so a
 * merchant is one recognisable object everywhere it appears; a logo is also
 * matched faster than a word, and it cannot wrap onto two lines the way
 * "American Express" did and knock the axis out of alignment. The name is one
 * hover away in the tooltip, and spelled out in the Donut and List views.
 *
 * The donut still earns its tab: it shows the SHAPE of the whole (is this one
 * dominant slice or an even spread?), which a bar chart deliberately discards
 * by not drawing the whole at all.
 */

/** Row height, so the plot is sized by its content and never crushes bars. */
const ROW = 34

export function RankedBarChart({ slices, height }: {
  slices: BreakdownRow[]
  /**
   * Floor for the plot. It GROWS past this to fill whatever height its flex
   * parent has, so a card sharing a grid row with a taller neighbour spends
   * the extra height on thicker bars instead of leaving it blank.
   */
  height?: number
}) {
  const plotHeight = height ?? Math.max(slices.length * ROW + 16, 120)

  // Keyed by label because that is what the category axis passes back to the
  // tick renderer — recharts hands ticks the axis VALUE, not the source row.
  const marks = new Map(slices.map((slice) => [slice.label, slice.media]))

  return (
    <div className="w-full flex-1" style={{ minHeight: plotHeight }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={slices}
          layout="vertical"
          margin={{ top: 4, right: 60, bottom: 0, left: 0 }}
          barCategoryGap="22%"
        >
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="label"
            tickLine={false}
            axisLine={false}
            width={36}
            tick={<MarkTick marks={marks} />}
            interval={0}
          />
          <Tooltip
            content={<BarTooltip />}
            cursor={{ fill: 'var(--surface-hover)' }}
            wrapperStyle={{ zIndex: 10 }}
          />
          <Bar dataKey="amount" radius={[3, 3, 3, 3]} isAnimationActive={false}>
            {slices.map((slice, index) => (
              <Cell key={slice.key} fill={sliceSwatch(index)} />
            ))}
            {/* The value sits at the end of its own bar rather than in a legend
                column, so the number and the length it encodes are read as one
                object. The right margin above reserves room for it. */}
            <LabelList
              dataKey="amount"
              position="right"
              className="fill-ink text-xs tabular-nums"
              formatter={(value: unknown) => formatCompactCurrency(Number(value ?? 0))}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

/**
 * Draws a row's mark in place of its name on the category axis.
 *
 * `foreignObject` because the marks are React DOM — brand SVGs, avatars, lucide
 * icons already used elsewhere — and re-authoring each of them as raw SVG for
 * this one chart would be a second copy to keep in sync. Rows without a mark
 * fall back to their text, so the axis is never blank.
 */
function MarkTick({ x = 0, y = 0, payload, marks }: {
  x?: number
  y?: number
  payload?: { value?: string }
  marks?: Map<string, ReactNode>
}) {
  const label = payload?.value ?? ''
  const mark = marks?.get(label)

  if (!mark) {
    return (
      <text x={x - 8} y={y} dy={4} textAnchor="end" className="fill-ink-muted text-xs">
        {label}
      </text>
    )
  }

  return (
    <foreignObject x={x - 28} y={y - 10} width={20} height={20}>
      <span className="grid size-5 place-items-center" title={label}>
        {mark}
      </span>
    </foreignObject>
  )
}

interface BarTooltipEntry {
  payload?: BreakdownRow
}

function BarTooltip({ active, payload }: { active?: boolean; payload?: BarTooltipEntry[] }) {
  const slice = payload?.[0]?.payload
  if (!active || !slice) return null

  // The axis shows only the mark, so the tooltip is where the mark and its
  // NAME are stated together — without it a reader who does not recognise a
  // logo has no way to resolve it.
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
