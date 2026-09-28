"use client";

interface Props {
  ariaLabel: string;
  value: number;
  onChange: (value: number) => void;
  allowNegative?: boolean;
  className?: string;
  showBlankWhenZero?: boolean;
  required?: boolean;
  describedBy?: string;
}

export function NumberInput({ ariaLabel, value, onChange, allowNegative = false, className, showBlankWhenZero = false, required = false, describedBy }: Props) {
  const formatted = Number.isFinite(value) && !(showBlankWhenZero && value === 0) ? value.toLocaleString("ko-KR", { maximumFractionDigits: 2 }) : "";
  return (
    <input
      aria-label={ariaLabel}
      aria-required={required}
      aria-describedby={describedBy}
      required={required}
      className={className}
      inputMode="decimal"
      value={formatted}
      onChange={(event) => {
        const normalized = event.target.value.replaceAll(",", "").trim();
        if (normalized === "" || (allowNegative && normalized === "-")) return onChange(0);
        const next = Number(normalized);
        if (Number.isFinite(next) && (allowNegative || next >= 0)) onChange(next);
      }}
    />
  );
}
