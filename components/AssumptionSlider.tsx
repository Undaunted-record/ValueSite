"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  label: string;
  value: number;
  defaultValue: number;
  min: number;
  max: number;
  step: number;
  suffix: string;
  scale?: number;
  description?: string;
  disabled?: boolean;
  impactText?: string;
  onChange: (value: number) => void;
}

export function AssumptionSlider({ label, value, defaultValue, min, max, step, suffix, scale = 1, description, disabled = false, impactText, onChange }: Props) {
  const [previous, setPrevious] = useState(value);
  const last = useRef(value);

  useEffect(() => {
    if (last.current !== value) {
      setPrevious(last.current);
      last.current = value;
    }
  }, [value]);

  const shown = value * scale;
  const decimals = step * scale < 1 ? 1 : 0;

  return (
    <div className={`slider-card ${disabled ? "disabled" : ""}`}>
      <div className="slider-head">
        <div>
          <strong>{label}</strong>
          <span className="default-tag">기본값 {(defaultValue * scale).toFixed(decimals)}{suffix}</span>
        </div>
        <button className="text-button" disabled={disabled} onClick={() => onChange(defaultValue)}>초기화</button>
      </div>
      {description && <p className="slider-description">{description}</p>}
      <div className="slider-value-row">
        <input
          className="range"
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          aria-label={`${label} 슬라이더`}
          disabled={disabled}
          onChange={(event) => onChange(Number(event.target.value))}
        />
        <div className="number-with-suffix compact-number">
          <input
            aria-label={label}
            type="number"
            min={min * scale}
            max={max * scale}
            step={step * scale}
            value={Number(shown.toFixed(decimals + 1))}
            disabled={disabled}
            onChange={(event) => onChange(Number(event.target.value) / scale)}
          />
          <span>{suffix}</span>
        </div>
      </div>
      <div className="range-labels"><span>{(min * scale).toFixed(decimals)}{suffix}</span><span>{(max * scale).toFixed(decimals)}{suffix}</span></div>
      {previous !== value && <small className="previous-value">변경 전 {(previous * scale).toFixed(decimals + 1)}{suffix}</small>}
      {disabled && <small className="inactive-note">현재 계산에 사용되지 않음</small>}
      {!disabled && impactText && <small className="impact-note">{impactText}</small>}
    </div>
  );
}
