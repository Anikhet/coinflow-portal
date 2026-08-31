/**
 * SIDEBAR IDENTITY
 * =============================================================================
 * Coinflow's real assets, taken from coinflow.cash: the `LogoMidnight` lockup
 * and the app icon they serve as apple-touch-icon. Not a redrawn stand-in —
 * a logo is the one thing in an interface that must not be approximated.
 *
 * DARK MODE. The lockup ships as midnight navy on transparent, which would
 * vanish on the dark canvas, so it is driven to white by `--logo-filter` —
 * exactly how the brand presents itself on midnight. That is a token, not a
 * Tailwind `dark:` utility, because this app themes from [data-theme] plus
 * prefers-color-scheme and has no `dark:` variant configured; `dark:` here
 * would silently do nothing when the user picks a theme explicitly.
 *
 * The monogram needs no such treatment: it carries its own navy tile, so it
 * reads on either ground.
 *
 * CLS. Both images declare intrinsic width and height, so the sidebar header
 * reserves their box before the bitmap decodes and the nav below never shifts.
 */
/**
 * Two marks, two components — not one component with a `compact` flag.
 *
 * The flag returned early into a completely different image with different
 * intrinsic dimensions and a different theming strategy, so nothing but the
 * name was shared. Naming each variant means a call site reads as the mark it
 * actually renders, and neither variant can grow a branch belonging to the
 * other.
 */

/** Square app icon. Carries its own navy tile, so it reads on either ground. */
export function CoinflowMark() {
  return (
    <img
      src="/coinflow-mark.png"
      alt="Coinflow"
      width={22}
      height={22}
      className="size-[22px] shrink-0 rounded-[6px]"
    />
  )
}

/** Full wordmark lockup, driven to white on dark by `--logo-filter`. */
export function CoinflowLockup() {
  return (
    <img
      src="/coinflow-lockup.png"
      alt="Coinflow"
      // Source is 1446x358 (~4.04:1); 77x19 keeps that ratio exactly, so the
      // browser never has to guess and the mark cannot end up subtly stretched.
      width={77}
      height={19}
      className="h-[19px] w-[77px] shrink-0 [filter:var(--logo-filter)]"
    />
  )
}
