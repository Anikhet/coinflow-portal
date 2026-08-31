import { ControlValue, Fact, FactGrid, Section } from '@/components/ui/detail'
import { AttributePill, StatusPill } from '@/components/ui/status-pill'
import { fraudOverrideTone, kycTone, verificationTone } from '@/lib/tone-map'
import type { Customer } from '@/types'

/** Verification: the identity detail behind the KYC status. */

/** Identity verification detail behind the KYC status. */
export function VerificationTab({ customer }: { customer: Customer }) {
  const kyc = kycTone(customer.kyc)
  return (
    <>
      <Section title="Identity" term="kyc">
        <div className="overflow-hidden rounded-[var(--radius-control)] border border-border">
          <div className="flex items-center justify-between gap-4 border-b border-border px-3 py-2.5">
            <span className="text-base text-ink">KYC status</span>
            <StatusPill descriptor={kyc} />
          </div>
          <div className="flex items-center justify-between gap-4 border-b border-border px-3 py-2.5">
            <span className="text-base text-ink">Legal name</span>
            <span className="text-base text-ink-muted">{customer.name}</span>
          </div>
          <div className="flex items-center justify-between gap-4 px-3 py-2.5">
            <span className="text-base text-ink">Enforcement</span>
            <AttributePill descriptor={verificationTone(customer.verification)} />
          </div>
        </div>
      </Section>

      <Section title="Checks">
        <FactGrid>
          <Fact
            label="Verification"
            term="verification"
            value={<ControlValue descriptor={verificationTone(customer.verification)} />}
          />
          <Fact
            label="Fraud override"
            term="fraudOverride"
            value={<ControlValue descriptor={fraudOverrideTone(customer.fraudOverride)} />}
          />
        </FactGrid>
      </Section>
    </>
  )
}
