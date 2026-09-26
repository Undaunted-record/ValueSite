import type { ValuationRange } from "@/types/valuation";

interface Props { ranges: ValuationRange[]; currentPrice: number; medianValue: number; }

export function FootballField({ ranges, currentPrice, medianValue }: Props) {
  const values = ranges.flatMap((item) => [item.low, item.high]).concat(currentPrice || [], medianValue || []);
  const min = Math.max(0, Math.min(...values) * 0.85);
  const max = Math.max(...values) * 1.12 || 1;
  const position = (value: number) => `${Math.max(0, Math.min(100, (value - min) / (max - min) * 100))}%`;

  return (
    <div className="football-chart">
      <div className="chart-legend"><span className="legend-current">현재 주가</span><span className="legend-median">선택 방법 중앙값</span><span>○ 저점·고점　● 기준값</span></div>
      <div className="football-axis"><span>축 최솟값 ₩{Math.round(min).toLocaleString()}</span><span>차트 축 범위</span><span>축 최댓값 ₩{Math.round(max).toLocaleString()}</span></div>
      <div className="field-body">
        {currentPrice > 0 && <div className="current-price-line" style={{ left: position(currentPrice) }}><span>현재 주가<br />₩{currentPrice.toLocaleString()}</span></div>}
        {medianValue > 0 && <div className="median-price-line" style={{ left: position(medianValue) }}><span>중앙값<br />₩{Math.round(medianValue).toLocaleString()}</span></div>}
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
