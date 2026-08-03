import * as React from 'react';
import { cn } from '@/lib/utils';

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        'text-[10px] uppercase tracking-[0.12em] text-[var(--color-studio-muted)]',
        className,
      )}
      {...props}
    />
  );
}
