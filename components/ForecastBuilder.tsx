"use client";

import { useEffect, useMemo, useState } from "react";
import { buildSimpleForecast, historicalReference } from "@/lib/valuation/forecast";
import { useValuationStore } from "@/store/useValuationStore";
import { NumberInput } from "./NumberInput";

export function ForecastBuilder() {
  const { company, applyForecast, resetForecast } = useValuationStore();
  const reference = useMemo(() => historicalReference(company.financials), [company.financials]);
  const [growth, setGrowth] = useState(() => Number((reference.revenueGrowth * 100).toFixed(1)));
  const [ebitMargin, setEbitMargin] = useState(() => Number((reference.ebitMargin * 100).toFixed(1)));
  const [netMargin, setNetMargin] = useState(() => Number((reference.netMargin * 100).toFixed(1)));
  const estimateYears = company.financials.filter((period) => period.type === "estimate").map((period) => period.year);
  const actuals = company.financials.filter((period) => period.type === "actual");
  const latestActualYear = actuals.at(-1)?.year;
  useEffect(() => {
    if (!latestActualYear || company.financials.some((period) => period.type === "estimate" && period.revenue > 0)) return;
    setGrowth(Number((reference.revenueGrowth * 100).toFixed(1)));
    setEbitMargin(Number((reference.ebitMargin * 100).toFixed(1)));
    setNetMargin(Number((reference.netMargin * 100).toFixed(1)));
  }, [latestActualYear, reference, company.financials]);
  const preview = buildSimpleForecast(actuals, estimateYears, { revenueGrowth: growth / 100, ebitMargin: ebitMargin / 100, netMargin: netMargin / 100 });
  const canApply = (actuals.at(-1)?.revenue ?? 0) > 0 && preview.length > 0;
  const useReference = () => {
    setGrowth(Number((reference.revenueGrowth * 100).toFixed(1)));
    setEbitMargin(Number((reference.ebitMargin * 100).toFixed(1)));
    setNetMargin(Number((reference.netMargin * 100).toFixed(1)));
  };

  return (
    <details className="forecast-builder" open={!company.financials.some((period) => period.type === "estimate" && period.revenue > 0)}>
      <summary><span><strong>간편 전망치 작성</strong><small>성장률과 마진으로 3개년 추정치를 계산합니다.</small></span><span>직접 입력도 가능</span></summary>
      <div className="forecast-content">
        <div className="forecast-reference">
          <span>과거 평균 성장률 <strong>{(reference.revenueGrowth * 100).toFixed(1)}%</strong></span>
          <span>최근 EBIT 마진 <strong>{(reference.ebitMargin * 100).toFixed(1)}%</strong></span>
          <span>최근 순이익률 <strong>{(reference.netMargin * 100).toFixed(1)}%</strong></span>
          <button className="text-button" type="button" onClick={useReference}>참고치 적용</button>
        </div>
        <div className="forecast-inputs">
          <label>연간 매출 성장률<div className="number-with-suffix"><NumberInput ariaLabel="연간 매출 성장률" allowNegative value={growth} onChange={setGrowth} /><span>%</span></div></label>
          <label>EBIT 마진<div className="number-with-suffix"><NumberInput ariaLabel="EBIT 마진" allowNegative value={ebitMargin} onChange={setEbitMargin} /><span>%</span></div></label>
          <label>순이익률<div className="number-with-suffix"><NumberInput ariaLabel="순이익률" allowNegative value={netMargin} onChange={setNetMargin} /><span>%</span></div></label>
        </div>
        <div className="forecast-formula">매출액 = 직전 연도 × (1 + 성장률)　·　EBIT = 매출액 × EBIT 마진　·　순이익 = 매출액 × 순이익률</div>
        <div className="table-wrap"><table className="forecast-preview"><thead><tr><th>미리보기</th>{preview.map((period) => <th key={period.year}>{period.year}</th>)}</tr></thead><tbody><tr><th>매출액</th>{preview.map((period) => <td key={period.year}>{period.revenue.toLocaleString("ko-KR", { maximumFractionDigits: 1 })}</td>)}</tr><tr><th>EBIT</th>{preview.map((period) => <td key={period.year}>{period.ebit.toLocaleString("ko-KR", { maximumFractionDigits: 1 })}</td>)}</tr><tr><th>당기순이익</th>{preview.map((period) => <td key={period.year}>{period.netIncome.toLocaleString("ko-KR", { maximumFractionDigits: 1 })}</td>)}</tr></tbody></table></div>
        {!canApply && <p className="inline-notice">최근 실적 매출액을 먼저 입력하거나 OpenDART에서 불러와 주세요.</p>}
        <div className="forecast-actions"><button className="primary-button" disabled={!canApply} onClick={() => applyForecast(preview)}>전망치 적용</button><button className="secondary-button" onClick={resetForecast}>전망치 초기화</button></div>
      </div>
    </details>
  );
}
