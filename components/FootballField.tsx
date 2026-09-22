import type { ValuationRange } from "@/types/valuation";

interface Props { ranges: ValuationRange[]; currentPrice: number; }

export function FootballField({ ranges, currentPrice }: Props) {
  const values = ranges.flatMap((item) => [item.low, item.high]).concat(currentPrice || []);
  const min = Math.max(0, Math.min(...values) * 0.85);
  const max = Math.max(...values) * 1.12 || 1;
  const position = (value: number) => `${Math.max(0, Math.min(100, (value - min) / (max - min) * 100))}%`;

  return (
    <div className="football-chart">
      <div className="football-axis"><span>₩{Math.round(min).toLocaleString()}</span><span>IMPLIED SHARE PRICE</span><span>₩{Math.round(max).toLocaleString()}</span></div>
      <div className="field-body">
        {currentPrice > 0 && <div className="current-price-line" style={{ left: position(currentPrice) }}><span>Current<br />₩{currentPrice.toLocaleString()}</span></div>}
        {ranges.map((item) => <div className="field-row" key={item.method}>
          <strong>{item.label}<small>{item.metric}</small></strong>
          <div className="field-track">
            <div className="range-line" style={{ left: position(item.low), width: `calc(${position(item.high)} - ${position(item.low)})` }}>
              <i className="low-dot" /><i className="base-dot" style={{ left: `calc(${(item.base - item.low) / Math.max(1, item.high - item.low) * 100}% - 6px)` }} /><i className="high-dot" />
            </div>
          </div>
          <span>₩{Math.round(item.low).toLocaleString()} – ₩{Math.round(item.high).toLocaleString()}</span>
        </div>)}
      </div>
    </div>
  );
}
