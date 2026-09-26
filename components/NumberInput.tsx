"use client";

interface Props {
  ariaLabel: string;
  value: number;
  onChange: (value: number) => void;
  allowNegative?: boolean;
  className?: string;
  showBlankWhenZero?: boolean;
}

export function NumberInput({ ariaLabel, value, onChange, allowNegative = false, className, showBlankWhenZero = false }: Props) {
  const formatted = Number.isFinite(value) && !(showBlankWhenZero && value === 0) ? value.toLocaleString("ko-KR", { maximumFractionDigits: 2 }) : "";
  return (
    <input
      aria-label={ariaLabel}
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
