export function CoinflowLogo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className="grid size-7 shrink-0 place-items-center rounded-[8px] bg-ink">
        <svg viewBox="0 0 32 32" className="size-[18px]" aria-hidden>
          <path d="M23 11.2A8 8 0 1 0 23 20.8" stroke="var(--surface)" strokeWidth="3.4" strokeLinecap="round" fill="none" />
        </svg>
      </span>
      {!compact && <span className="text-[15px] font-semibold tracking-tight text-ink">Coinflow</span>}
    </div>
  )
}
