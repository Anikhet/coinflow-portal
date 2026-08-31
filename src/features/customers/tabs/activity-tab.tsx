import { CardBrandGlyph } from '@/components/icons/method-icon'
import { StatusCell } from '@/components/table/cells'
import { EmptyState } from '@/components/table/empty-state'
import { formatCurrency, formatDateOnly, formatTimeOnly } from '@/lib/format'
import { activityTone } from '@/lib/tone-map'
import { useUiStore } from '@/stores/ui-store'
import type { Timezone } from '@/stores/ui-store'
import type { CustomerActivity } from '@/types'

/** Activity: the customer's payment and payout history as a dated timeline. */

export function ActivityTab({ activity }: { activity: CustomerActivity[] }) {
  // Read from the store, not a prop: the tabs are siblings and none of them is
  // an ancestor of the others, so threading the timezone down would make the
  // drawer a message bus for a value it does not itself render.
  const timezone = useUiStore((state) => state.timezone)

  // A brand-new customer has no history yet. Rendering nothing leaves the tab
  // blank below a populated tab bar, which reads as a failed render.
  if (activity.length === 0) {
    return (
      <div className="flex min-h-[240px] items-center justify-center p-5">
        <EmptyState
          glyph="activity"
          title="No activity yet"
          description="Authorizations and refunds appear here."
        />
      </div>
    )
  }

  const groups = activity.reduce<Record<string, CustomerActivity[]>>((accumulator, event) => {
    const key = formatDateOnly(event.at, timezone)
    ;(accumulator[key] ??= []).push(event)
    return accumulator
  }, {})

  return (
    <div className="pb-6">
      {Object.entries(groups).map(([date, events]) => (
        <section key={date}>
          {/* The heading is the only rule in the layout, and it stays visible
              while its own events scroll — a long history should never leave
              the reader looking at undated rows. */}
          <h3 className="sticky top-0 z-10 border-b border-border bg-surface/95 px-5 py-2 text-xs font-semibold uppercase tracking-[0.06em] text-ink-faint backdrop-blur">
            {date}
          </h3>

          <ul>
            {events.map((event) => (
              <ActivityRow key={event.id} event={event} timezone={timezone} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

function ActivityRow({ event, timezone }: { event: CustomerActivity; timezone: Timezone }) {
  const tone = activityTone(event.status)
  // Routine outcomes are stated in words; only a deviation earns a pill.
  const isRoutine = tone.tone === 'positive'

  return (
    <li className="grid grid-cols-[60px_1fr_auto] items-baseline gap-3 border-b border-border px-5 py-2.5 last:border-0">
      <span className="text-sm tabular-nums leading-5 text-ink-faint">
        {formatTimeOnly(event.at, timezone)}
      </span>

      <span className="min-w-0">
        <span className="flex items-center gap-1.5">
          {/* The brand mark rides with the label rather than owning a column of
              its own: only card events have one, so a dedicated column was
              empty on every payout and left a ragged gutter. */}
          {event.brand && <CardBrandGlyph brand={event.brand} />}
          <span className="truncate text-base font-medium capitalize leading-5 text-ink">
            {event.kind.replace('-', ' ')}
          </span>
          {!isRoutine && <StatusCell descriptor={tone} />}
        </span>

        {(event.rail || event.responseCode || event.note) && (
          <span className="mt-0.5 block truncate text-sm leading-4 text-ink-faint">
            {[
              event.rail,
              event.responseCode && event.responseCode !== '00' && `code ${event.responseCode}`,
              event.note,
            ]
              .filter(Boolean)
              .join(' · ')}
          </span>
        )}
      </span>

      {event.amount > 0 && (
        <span className="w-[88px] shrink-0 text-base tabular-nums leading-5 text-ink">
          {formatCurrency(event.amount)}
        </span>
      )}
    </li>
  )
}
