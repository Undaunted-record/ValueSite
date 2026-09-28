"use client";

import { useEffect, useMemo, useState } from "react";
import { buildSimpleForecast, getForecastRequirements, historicalReference } from "@/lib/valuation/forecast";
import { useValuationStore } from "@/store/useValuationStore";
import { NumberInput } from "./NumberInput";

const RequiredMark = () => <><span className="required-mark" aria-hidden="true"> *</span><span className="sr-only"> 필수</span></>;

export function ForecastBuilder() {
  const { company, methods, applyForecast, resetForecast } = useValuationStore();
  const reference = useMemo(() => historicalReference(company.financials), [company.financials]);
  const referenceValues = useMemo(() => [reference.revenueGrowth, reference.ebitMargin, reference.netMargin].map((value) => Number((value * 100).toFixed(1))), [reference]);
  const [entryMode, setEntryMode] = useState<"uniform" | "annual">("uniform");
  const [growth, setGrowth] = useState<number[]>(() => Array(3).fill(referenceValues[0]));
  const [ebitMargin, setEbitMargin] = useState<number[]>(() => Array(3).fill(referenceValues[1]));
  const [netMargin, setNetMargin] = useState<number[]>(() => Array(3).fill(referenceValues[2]));
  const estimateYears = company.financials.filter((period) => period.type === "estimate").map((period) => period.year);
  const actuals = company.financials.filter((period) => period.type === "actual");
  const latestActualYear = actuals.at(-1)?.year;
  const requirements = getForecastRequirements(methods);
  const needsEbit = requirements.ebitMargin;
  const needsNetIncome = requirements.netMargin;
  const needsForecast = requirements.revenueGrowth;

  useEffect(() => {
    if (!latestActualYear || company.financials.some((period) => period.type === "estimate" && period.revenue > 0)) return;
    setGrowth(Array(3).fill(referenceValues[0]));
    setEbitMargin(Array(3).fill(referenceValues[1]));
    setNetMargin(Array(3).fill(referenceValues[2]));
  }, [latestActualYear, referenceValues, company.financials]);

  const forecastValues = {
    revenueGrowth: entryMode === "uniform" ? growth[0] : growth,
    ebitMargin: entryMode === "uniform" ? ebitMargin[0] : ebitMargin,
    netMargin: entryMode === "uniform" ? netMargin[0] : netMargin,
  };
  const toDecimal = (value: number | number[]) => Array.isArray(value) ? value.map((item) => item / 100) : value / 100;
  const preview = buildSimpleForecast(actuals, estimateYears, {
    revenueGrowth: toDecimal(forecastValues.revenueGrowth),
    ebitMargin: toDecimal(forecastValues.ebitMargin),
    netMargin: toDecimal(forecastValues.netMargin),
  });
  const canApply = needsForecast && (actuals.at(-1)?.revenue ?? 0) > 0 && preview.length > 0;
  const useReference = () => {
    setGrowth(Array(3).fill(referenceValues[0]));
    setEbitMargin(Array(3).fill(referenceValues[1]));
    setNetMargin(Array(3).fill(referenceValues[2]));
  };
  const updateYear = (setter: React.Dispatch<React.SetStateAction<number[]>>, index: number, value: number) => setter((current) => current.map((item, currentIndex) => currentIndex === index ? value : item));

  if (!needsForecast) return <div className="inline-notice">선택한 평가 방법은 미래 전망치 입력 없이 계산할 수 있습니다.</div>;

  return (
    <details className="forecast-builder" open={!company.financials.some((period) => period.type === "estimate" && period.revenue > 0)}>
      <summary><span><strong>3단계 · 미래 전망 설정</strong><small>성장률과 필요한 이익률만 확인하면 됩니다.</small></span><span>직접 입력도 가능</span></summary>
      <div className="forecast-content">
        <p className="required-guide"><span aria-hidden="true">*</span> 표시된 항목은 선택한 평가 방법의 계산에 필요합니다.</p>
        <div className="forecast-reference">
          <span>최근 실적 평균 성장률 <strong>{referenceValues[0].toFixed(1)}%</strong></span>
          <span>최근 EBIT 마진 <strong>{referenceValues[1].toFixed(1)}%</strong></span>
          <span>최근 순이익률 <strong>{referenceValues[2].toFixed(1)}%</strong></span>
          <button className="text-button" type="button" onClick={useReference}>참고치 적용</button>
        </div>
        <div className="forecast-mode" aria-label="전망 입력 방식">
          <button type="button" aria-pressed={entryMode === "uniform"} className={entryMode === "uniform" ? "active" : ""} onClick={() => setEntryMode("uniform")}>3개년 동일 적용</button>
          <button type="button" aria-pressed={entryMode === "annual"} className={entryMode === "annual" ? "active" : ""} onClick={() => setEntryMode("annual")}>연도별 입력</button>
        </div>
        {entryMode === "uniform" ? <div className="forecast-inputs">
          <label>연간 매출 성장률<RequiredMark /><div className="number-with-suffix"><NumberInput ariaLabel="연간 매출 성장률 필수" required allowNegative value={growth[0]} onChange={(value) => setGrowth(Array(3).fill(value))} /><span>%</span></div></label>
          {needsEbit && <label>EBIT 마진<RequiredMark /><div className="number-with-suffix"><NumberInput ariaLabel="EBIT 마진 필수" required allowNegative value={ebitMargin[0]} onChange={(value) => setEbitMargin(Array(3).fill(value))} /><span>%</span></div></label>}
          {needsNetIncome && <label>순이익률<RequiredMark /><div className="number-with-suffix"><NumberInput ariaLabel="순이익률 필수" required allowNegative value={netMargin[0]} onChange={(value) => setNetMargin(Array(3).fill(value))} /><span>%</span></div>{netMargin[0] <= 0 && <small className="field-note">P/E 계산에는 양수 순이익률이 필요합니다.</small>}</label>}
        </div> : <div className="annual-forecast-grid">
          {estimateYears.map((year, index) => <fieldset key={year}><legend>{year}</legend>
            <label>매출 성장률<RequiredMark /><div className="number-with-suffix"><NumberInput ariaLabel={`${year} 매출 성장률 필수`} required allowNegative value={growth[index] ?? growth[0]} onChange={(value) => updateYear(setGrowth, index, value)} /><span>%</span></div></label>
            {needsEbit && <label>EBIT 마진<RequiredMark /><div className="number-with-suffix"><NumberInput ariaLabel={`${year} EBIT 마진 필수`} required allowNegative value={ebitMargin[index] ?? ebitMargin[0]} onChange={(value) => updateYear(setEbitMargin, index, value)} /><span>%</span></div></label>}
            {needsNetIncome && <label>순이익률<RequiredMark /><div className="number-with-suffix"><NumberInput ariaLabel={`${year} 순이익률 필수`} required allowNegative value={netMargin[index] ?? netMargin[0]} onChange={(value) => updateYear(setNetMargin, index, value)} /><span>%</span></div></label>}
          </fieldset>)}
        </div>}
        <div className="forecast-formula">매출액 = 직전 연도 × (1 + 성장률)　·　EBIT = 매출액 × EBIT 마진　·　순이익 = 매출액 × 순이익률</div>
        <div className="table-wrap"><table className="forecast-preview"><thead><tr><th>적용 전 미리보기</th>{preview.map((period) => <th key={period.year}>{period.year}</th>)}</tr></thead><tbody><tr><th>매출액</th>{preview.map((period) => <td key={period.year}>{period.revenue.toLocaleString("ko-KR", { maximumFractionDigits: 1 })}</td>)}</tr>{needsEbit && <tr><th>EBIT</th>{preview.map((period) => <td key={period.year}>{period.ebit.toLocaleString("ko-KR", { maximumFractionDigits: 1 })}</td>)}</tr>}{needsNetIncome && <tr><th>당기순이익</th>{preview.map((period) => <td key={period.year}>{period.netIncome.toLocaleString("ko-KR", { maximumFractionDigits: 1 })}</td>)}</tr>}</tbody></table></div>
        {!canApply && <p className="inline-notice">최근 실적 매출액을 먼저 입력하거나 OpenDART에서 불러와 주세요.</p>}
        <div className="forecast-actions"><button className="primary-button" disabled={!canApply} onClick={() => applyForecast(preview)}>전망치 적용</button><button className="secondary-button" onClick={resetForecast}>전망치 초기화</button></div>
      </div>
    </details>
  );
}
