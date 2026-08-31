import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/cn'

/**
 * Sizes are fixed-height so a toolbar of mixed buttons, inputs and selects
 * aligns on a single baseline and never shifts as labels change.
 */
const button = cva(
  'inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-[var(--radius-control)] font-medium transition-[background-color,color,box-shadow] disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary: 'bg-brand text-brand-contrast hover:bg-brand-hover',
        secondary: 'bg-surface text-ink ring-1 ring-inset ring-border hover:bg-surface-hover',
        ghost: 'text-ink-muted hover:bg-surface-hover hover:text-ink',
        /* The identity button: the same violet gradient and light source the
           empty-state mark wears (`--control-brand`), so a page whose mark and
           whose primary action are the only two coloured objects on it reads as
           one designed surface rather than two unrelated blues. Reserved for
           the single most important action on a page — `primary` stays the flat
           workhorse, because a toolbar of gradients is noise. Hover brightens
           rather than swapping colour, which works in both themes without a
           second gradient definition. */
        brand:
          'bg-brand bg-[image:var(--control-brand)] text-brand-contrast shadow-[0_1px_2px_var(--brand-ring)] transition-[filter,box-shadow] hover:brightness-110 hover:shadow-[0_2px_6px_var(--brand-ring)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]',
        danger: 'bg-[var(--tone-critical-bg)] text-[var(--tone-critical-fg)] ring-1 ring-inset ring-[var(--tone-critical-ring)] hover:brightness-95',
      },
      size: {
        sm: 'h-7 px-2 text-sm [&_svg]:size-3.5',
        md: 'h-8 px-2.5 text-base [&_svg]:size-4',
        lg: 'h-9 px-4 text-base [&_svg]:size-4',
        icon: 'size-8 [&_svg]:size-4',
        'icon-sm': 'size-7 [&_svg]:size-3.5',
      },
    },
    defaultVariants: { variant: 'secondary', size: 'md' },
  },
)

interface ButtonProps extends ComponentProps<'button'>, VariantProps<typeof button> {
  asChild?: boolean
}

export function Button({ className, variant, size, asChild, ...props }: ButtonProps) {
  const Component = asChild ? Slot : 'button'
  return <Component className={cn(button({ variant, size }), className)} {...props} />
}
