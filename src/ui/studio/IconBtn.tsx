import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
  danger?: boolean;
  label: string;
  children: ReactNode;
  size?: 'sm' | 'md';
};

/** Shared icon control for rails / floating bars (Canva-like discoverability). */
export function IconBtn({
  active,
  danger,
  label,
  children,
  size = 'md',
  className = '',
  type = 'button',
  ...rest
}: Props) {
  return (
    <button
      type={type}
      title={label}
      aria-label={label}
      className={[
        'icon-btn',
        size === 'sm' ? 'icon-btn-sm' : '',
        active ? 'active' : '',
        danger ? 'danger' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {children}
    </button>
  );
}
