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
        danger: 'bg-[var(--tone-critical-bg)] text-[var(--tone-critical-fg)] ring-1 ring-inset ring-[var(--tone-critical-ring)] hover:brightness-95',
      },
      size: {
        sm: 'h-7 px-2 text-[12px] [&_svg]:size-3.5',
        md: 'h-8 px-2.5 text-[13px] [&_svg]:size-4',
        lg: 'h-9 px-3.5 text-[13px] [&_svg]:size-4',
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
