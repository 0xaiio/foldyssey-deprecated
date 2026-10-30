import type { ReactNode } from 'react';

export function Icon({
  name,
  size = 18,
  className,
}: {
  name:
    | 'scissors'
    | 'fold'
    | 'unfold'
    | 'arrow-right'
    | 'check'
    | 'close'
    | 'download'
    | 'save'
    | 'trash'
    | 'undo'
    | 'redo'
    | 'rotate'
    | 'spark'
    | 'info'
    | 'grid'
    | 'flip'
    | 'play'
    | 'chevron-left'
    | 'chevron-right';
  size?: number;
  className?: string;
}) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className,
    'aria-hidden': true,
  };
  switch (name) {
    case 'scissors':
      return (
        <svg {...common}>
          <circle cx="6" cy="18" r="2.6" />
          <circle cx="18" cy="18" r="2.6" />
          <path d="M7.7 16.1 17 3.6M16.3 16.1 7 3.6" />
        </svg>
      );
    case 'fold':
      return (
        <svg {...common}>
          <path d="M3 5h9v14H3z" />
          <path d="M12 5l8 2.4v11.2L12 19z" />
          <path d="M12 5v14" strokeDasharray="2 2.5" />
        </svg>
      );
    case 'unfold':
      return (
        <svg {...common}>
          <path d="M3 6h18v12H3z" />
          <path d="M12 6v12" strokeDasharray="2 2.5" />
          <path d="M8 10l-2.5 2L8 14M16 10l2.5 2L16 14" />
        </svg>
      );
    case 'arrow-right':
      return (
        <svg {...common}>
          <path d="M4 12h15M13 6l6 6-6 6" />
        </svg>
      );
    case 'check':
      return (
        <svg {...common}>
          <path d="M4.5 12.5l5 5 10-11" />
        </svg>
      );
    case 'close':
      return (
        <svg {...common}>
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      );
    case 'download':
      return (
        <svg {...common}>
          <path d="M12 3v12M7 11l5 5 5-5M4 20h16" />
        </svg>
      );
    case 'save':
      return (
        <svg {...common}>
          <path d="M5 4h11l3 3v13H5z" />
          <path d="M8 4v6h7V4M8 20v-6h8v6" />
        </svg>
      );
    case 'trash':
      return (
        <svg {...common}>
          <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />
        </svg>
      );
    case 'undo':
      return (
        <svg {...common}>
          <path d="M4 9h10a5 5 0 0 1 0 10H8" />
          <path d="M8 5L4 9l4 4" />
        </svg>
      );
    case 'redo':
      return (
        <svg {...common}>
          <path d="M20 9H10a5 5 0 0 0 0 10h6" />
          <path d="M16 5l4 4-4 4" />
        </svg>
      );
    case 'rotate':
      return (
        <svg {...common}>
          <path d="M20 12a8 8 0 1 1-2.6-5.9" />
          <path d="M20 4v5h-5" />
        </svg>
      );
    case 'spark':
      return (
        <svg {...common}>
          <path d="M12 3v5M12 16v5M3 12h5M16 12h5M6.5 6.5l3 3M14.5 14.5l3 3M17.5 6.5l-3 3M9.5 14.5l-3 3" />
        </svg>
      );
    case 'info':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 11v5M12 8h.01" />
        </svg>
      );
    case 'grid':
      return (
        <svg {...common}>
          <path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" />
        </svg>
      );
    case 'flip':
      return (
        <svg {...common}>
          <path d="M12 3v18" strokeDasharray="2 2.5" />
          <path d="M9 7L4 12l5 5V7zM15 7l5 5-5 5V7z" />
        </svg>
      );
    case 'play':
      return (
        <svg {...common}>
          <path d="M7 4l13 8-13 8V4z" />
        </svg>
      );
    case 'chevron-left':
      return (
        <svg {...common}>
          <path d="M14 5l-7 7 7 7" />
        </svg>
      );
    case 'chevron-right':
      return (
        <svg {...common}>
          <path d="M10 5l7 7-7 7" />
        </svg>
      );
    default:
      return null;
  }
}

export function Tag({
  children,
  tone = 'default',
  className = '',
}: {
  children: ReactNode;
  tone?: 'default' | 'red' | 'teal' | 'gold';
  className?: string;
}) {
  const toneClass =
    tone === 'red' ? 'tag-red' : tone === 'teal' ? 'tag-teal' : tone === 'gold' ? 'tag-gold' : '';
  return <span className={`tag ${toneClass} ${className}`}>{children}</span>;
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <p className="eyebrow mb-3">{children}</p>;
}

export function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div>
      <div className="eyebrow">{label}</div>
      <div className="mt-1 font-display text-[1.05rem] leading-tight text-ink tabular-nums sm:text-2xl">{value}</div>
      {hint && <div className="mt-0.5 text-[0.68rem] leading-snug text-ink-faint sm:text-xs">{hint}</div>}
    </div>
  );
}

export function SliderRow({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
  disabled,
  id,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
  disabled?: boolean;
  id?: string;
}) {
  return (
    <div className="w-full">
      <div className="mb-0.5 flex items-baseline justify-between">
        <label htmlFor={id} className="text-[0.8rem] text-ink-soft">
          {label}
        </label>
        <span className="font-mono text-[0.78rem] tabular-nums text-ink">{format ? format(value) : value.toFixed(2)}</span>
      </div>
      <input
        id={id}
        className="slider"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}
