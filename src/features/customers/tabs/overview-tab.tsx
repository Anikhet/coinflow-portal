import { ControlValue, Fact, FactGrid, Section, StatCard, StatGrid } from '@/components/ui/detail'
import { AttributePill, StatusPill } from '@/components/ui/status-pill'
import { formatCount, formatCurrency, formatDateOnly } from '@/lib/format'
import { attemptLimitTone, customerProtectionTone, fraudOverrideTone, kycTone, signalCountTone, threeDSProcessingTone, verificationTone } from '@/lib/tone-map'
import type { ToneDescriptor } from '@/lib/tone-map'
import { useUiStore } from '@/stores/ui-store'
import type { Customer, SignalRow } from '@/types'
import { Fingerprint, MapPin, User } from 'lucide-react'

/**
 * Overview: lifetime totals, exceptions, KYC, the risk-signal tables and the
 * control grid — the tab an operator lands on and often never leaves.
 */

export function OverviewTab({ customer }: { customer: Customer }) {
  const timezone = useUiStore((state) => state.timezone)

  return (
    <>
      <Section title="Lifetime">
        <StatGrid>
          <StatCard
            label="Total volume"
            glyph="liquidity"
            value={formatCurrency(customer.totalVolume)}
            hint={`${formatCount(customer.paymentCount)} payments`}
          />
          <StatCard
            label="Overridden volume"
            term="overriddenVolume"
            glyph="exposure"
            value={formatCurrency(customer.overriddenVolume)}
            hint={`${formatCount(customer.overriddenCount)} payments`}
          />
        </StatGrid>
      </Section>


      {/* Production shows KYC as its own labelled card above the signal
          tables, not as a pill in the header alone — the status and the name it
          was verified against are read together. */}
      <Section title="KYC">
        <div className="overflow-hidden rounded-[var(--radius-control)] border border-border">
          <div className="flex items-center justify-between gap-4 border-b border-border px-3 py-2.5">
            <span className="text-base text-ink">Status</span>
            <StatusPill descriptor={kycTone(customer.kyc)} />
          </div>
          <div className="flex items-center justify-between gap-4 px-3 py-2.5">
            <span className="text-base text-ink">Name</span>
            <span className="truncate text-base text-ink-muted">{customer.name}</span>
          </div>
        </div>
      </Section>

      <SignalsSections customer={customer} />

      {/* Not in the production drawer, and deliberate: the table now renders
          default values as an em-dash rather than a badge, so without this the
          question "what IS this customer's attempt limit?" would have nowhere
          to be answered. */}
      <Section title="Controls">
        <FactGrid>
          {/* Every control renders through the same tone registry the tables
              use, so a restricted attempt limit is a struck-through hand here
              and a struck-through hand there. The label text now comes from the
              descriptor rather than CONTROL_LABELS, which keeps one spelling
              per state instead of two that can drift apart. */}
          <Fact label="Chargeback protection" term="chargebackProtection" value={<ControlValue descriptor={customerProtectionTone(customer.protectionEnabled)} />} />
          <Fact label="3DS processing" term="threeDSProcessing" value={<ControlValue descriptor={threeDSProcessingTone(customer.threeDSProcessing)} />} />
          <Fact label="Attempt limit" term="attemptLimit" value={<ControlValue descriptor={attemptLimitTone(customer.attemptLimit)} />} />
          <Fact label="Verification" term="verification" value={<ControlValue descriptor={verificationTone(customer.verification)} />} />
          <Fact label="Fraud override" term="fraudOverride" value={<ControlValue descriptor={fraudOverrideTone(customer.fraudOverride)} />} />
          <Fact label="Member since" value={formatDateOnly(customer.createdAt, timezone)} hint={customer.merchant} />
        </FactGrid>
      </Section>
    </>
  )
}

function SignalsSections({ customer }: { customer: Customer }) {
  return (
    <>
      <SignalTable icon={User} title="Names" rows={customer.names} threshold={1} />
      <SignalTable icon={MapPin} title="Billing addresses" rows={customer.billingAddresses} threshold={2} />
      <SignalTable icon={Fingerprint} title="IP locations" rows={customer.ipLocations} threshold={3} />
    </>
  )
}

/**
 * A distinct-value table. The heading carries the cardinality tone: the row
 * values themselves are never colored, because no individual address is
 * suspicious — it is the *number of them* that is.
 */
function SignalTable({ icon, title, rows, threshold }: {
  /** Component, not a node — so it can be handed straight to a ToneDescriptor. */
  icon: ToneDescriptor['icon']
  title: string
  rows: SignalRow[]
  threshold: number
}) {
  const tone = signalCountTone(rows.length, threshold)

  return (
    <Section
      title={title}
      action={
        <AttributePill descriptor={{ tone, label: `${rows.length} distinct`, icon }} />
      }
    >
      <div className="overflow-hidden rounded-[var(--radius-control)] border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-sunk">
              <th scope="col" className="px-2.5 py-1.5 text-left font-medium text-ink-faint">Value</th>
              <th scope="col" className="px-2.5 py-1.5 text-right font-medium text-ink-faint">Count</th>
              <th scope="col" className="px-2.5 py-1.5 text-right font-medium text-ink-faint">Volume</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.value} className="border-b border-border last:border-0">
                <td className="max-w-0 truncate px-2.5 py-1.5 text-ink">{row.value}</td>
                <td className="px-2.5 py-1.5 text-right tabular-nums text-ink-muted">{row.count}</td>
                <td className="px-2.5 py-1.5 text-right tabular-nums text-ink">{formatCurrency(row.volume)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {tone !== 'neutral' && (
        <p className="mt-2 text-sm leading-snug text-ink-muted">
          {rows.length} distinct values is above the expected range for a single customer and may
          indicate account sharing or takeover.
        </p>
      )}
    </Section>
  )
}
