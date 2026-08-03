import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-1.5 rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-studio-accent)]',
  {
    variants: {
      variant: {
        default:
          'bg-[var(--color-studio-accent)] text-[var(--color-studio-bg)] hover:opacity-90',
        ghost:
          'bg-transparent text-[var(--color-studio-muted)] hover:text-[var(--color-studio-text)] hover:bg-white/5 border border-transparent',
        outline:
          'border border-[var(--color-studio-line)] bg-transparent text-[var(--color-studio-text)] hover:border-[var(--color-studio-accent)]',
        icon: 'h-8 w-8 p-0 text-[var(--color-studio-muted)] hover:text-[var(--color-studio-text)] hover:bg-white/5',
      },
      size: {
        default: 'h-8 px-3',
        sm: 'h-7 px-2 text-xs',
        icon: 'h-8 w-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';
