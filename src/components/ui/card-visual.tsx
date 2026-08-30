import { CardBrandGlyph } from '@/components/icons/method-icon'

/**
 * Payment instrument render.
 *
 * Kept from the original design — it was the one genuinely delightful element
 * in the product, and it earns its space by making the drawer instantly
 * identifiable as "a card payment" before any text is read.
 *
 * The topographic pattern is a generated SVG rather than a raster asset: it
 * scales to any width, adds no network request, and costs about 400 bytes.
 * Aspect ratio is fixed at 1.586 (ISO/IEC 7810 ID-1, the real card ratio) so
 * the element reserves its exact box before paint and cannot shift the content
 * beneath it.
 */
export function CardVisual({ brand, last4, expiry, holder }: {
  brand: 'visa' | 'mastercard' | 'amex'
  last4: string
  expiry: string
  holder: string
}) {
  return (
    <div
      className="relative w-full overflow-hidden rounded-[14px] bg-[#101018] text-white shadow-lg"
      style={{ aspectRatio: '1.586' }}
    >
      <svg
        className="absolute inset-0 size-full opacity-[0.16]"
        viewBox="0 0 320 202"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        {/* Concentric contour rings, offset to sit off-centre like a topo map. */}
        {Array.from({ length: 13 }).map((_, index) => (
          <ellipse
            key={index}
            cx={232}
            cy={96}
            rx={16 + index * 15}
            ry={11 + index * 10.5}
            fill="none"
            stroke="white"
            strokeWidth={0.9}
            transform={`rotate(-18 232 96)`}
          />
        ))}
      </svg>

      <div className="relative flex size-full flex-col justify-between p-4">
        <div className="flex items-start justify-between">
          <CardBrandGlyph brand={brand} />
          {/* Contactless glyph */}
          <svg viewBox="0 0 24 24" className="size-5 opacity-70" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
            <path d="M7 8a7 7 0 0 1 0 8M11 5.5a11 11 0 0 1 0 13M15 3a15 15 0 0 1 0 18" />
          </svg>
        </div>

        <div>
          {/* Grouped with explicit spans rather than a single tracked string:
              letter-spacing pushes the bullets apart individually, which made
              the groups read as twelve separate dots instead of three blocks. */}
          <p className="flex items-center gap-3 font-mono text-[15px] text-white/90">
            <span aria-hidden>••••</span>
            <span aria-hidden>••••</span>
            <span aria-hidden>••••</span>
            <span className="tracking-[0.08em]">{last4}</span>
            <span className="sr-only">Card ending in {last4}</span>
          </p>
          <div className="mt-2.5 flex items-end justify-between">
            <p className="truncate text-[11px] uppercase tracking-wide text-white/60">{holder}</p>
            <p className="shrink-0 font-mono text-[12px] tabular-nums text-white/80">{expiry}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
