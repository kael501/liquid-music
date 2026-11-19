import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { springSnappy } from '../lib/motion';
import { cn } from '../lib/utils';

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-7 w-12 shrink-0 rounded-full transition-colors duration-300',
        checked ? 'bg-emerald-400/90' : 'bg-white/15',
      )}
    >
      <motion.span
        className="absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow-md"
        animate={{ x: checked ? 20 : 0 }}
        transition={springSnappy}
      />
    </button>
  );
}

interface SegmentedProps<T extends string | number> {
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (v: T) => void;
  id: string;
}

export function Segmented<T extends string | number>({ value, options, onChange, id }: SegmentedProps<T>) {
  return (
    <div className="flex rounded-full bg-white/10 p-1" role="radiogroup">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          onClick={() => onChange(o.value)}
          className={cn(
            'relative rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
            o.value === value ? 'text-black' : 'text-white/70 hover:text-white',
          )}
        >
          {o.value === value && (
            <motion.span layoutId={`seg-${id}`} transition={springSnappy} className="absolute inset-0 rounded-full bg-white" />
          )}
          <span className="relative">{o.label}</span>
        </button>
      ))}
    </div>
  );
}

export function RangeInput({
  value,
  min,
  max,
  step,
  onChange,
  label,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  label: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <input
      type="range"
      aria-label={label}
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="h-1.5 w-40 cursor-pointer appearance-none rounded-full accent-white sm:w-56"
      style={{ background: `linear-gradient(to right, #fff ${pct}%, rgba(255,255,255,0.18) ${pct}%)` }}
    />
  );
}

export function SettingRow({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="min-w-0">
        <p className="text-[15px] font-semibold">{title}</p>
        {description && <p className="mt-0.5 text-sm text-white/55">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export function SettingSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="glass glass-thin rounded-3xl px-5 py-2 sm:px-6">
      <div className="relative z-10">
        <h2 className="pt-4 text-xs font-semibold uppercase tracking-[0.16em] text-white/50">{title}</h2>
        <div className="divide-y divide-white/10">{children}</div>
      </div>
    </section>
  );
}
