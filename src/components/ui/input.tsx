import * as React from 'react';
import { cn } from '@/lib/utils';

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => (
  <input
    type={type}
    className={cn(
      'flex h-8 w-full rounded-md border border-[var(--color-studio-line)] bg-black/30 px-2 py-1 text-sm text-[var(--color-studio-text)] placeholder:text-[var(--color-studio-muted)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-studio-accent)] disabled:opacity-50',
      className,
    )}
    ref={ref}
    {...props}
  />
));
Input.displayName = 'Input';
