"use client";

import { AssumptionSlider } from "./AssumptionSlider";
import { NumberInput } from "./NumberInput";
import { DEFAULT_ASSUMPTIONS } from "@/data/demo";
import { calculateDcf } from "@/lib/valuation/dcf";
import { calculateEvBridge } from "@/lib/valuation/evBridge";
import { calculateCostOfEquity, calculateWacc } from "@/lib/valuation/wacc";
import { useValuationStore } from "@/store/useValuationStore";
import type { Assumptions } from "@/types/valuation";
import { ForecastBuilder } from "./ForecastBuilder";
import { INDUSTRY_WACC_DEFAULTS } from "@/lib/valuation/assumptions";

const advancedFields: Array<{ key: keyof Assumptions; label: string; scale: number; suffix: string }> = [
  { key: "riskFreeRate", label: "무위험수익률", scale: 100, suffix: "%" }, { key: "beta", label: "베타", scale: 1, suffix: "x" },
  { key: "equityRiskPremium", label: "주식위험프리미엄(ERP)", scale: 100, suffix: "%" }, { key: "costOfDebt", label: "세전 타인자본비용", scale: 100, suffix: "%" },
  { key: "taxRate", label: "세율", scale: 100, suffix: "%" }, { key: "debtWeight", label: "부채 비중", scale: 100, suffix: "%" },
  { key: "daPercentRevenue", label: "D&A / 매출액", scale: 100, suffix: "%" }, { key: "capexPercentRevenue", label: "CAPEX / 매출액", scale: 100, suffix: "%" },
  { key: "nwcPercentRevenue", label: "NWC 증감 / 매출액", scale: 100, suffix: "%" },
];

export function AssumptionsPanel() {
  const { mode, company, methods, assumptions, terminalMethod, updateAssumption, setTerminalMethod, resetAssumptions } = useValuationStore();
  const calculatedWacc = calculateWacc(assumptions);
  const costOfEquity = calculateCostOfEquity(assumptions);
  const invalidTerminal = terminalMethod === "gordon" && assumptions.wacc <= assumptions.terminalGrowth;
  const usesDcf = methods.includes("dcf");
  const industryWacc = INDUSTRY_WACC_DEFAULTS[company.industry] ?? DEFAULT_ASSUMPTIONS.wacc;
  const price = (next: Assumptions) => calculateEvBridge(calculateDcf(company, next, terminalMethod).enterpriseValue, company).impliedSharePrice;
  const currentPrice = price(assumptions);
  const impact = (field: keyof Assumptions) => {
    const comparison = price({ ...assumptions, [field]: DEFAULT_ASSUMPTIONS[field] });
    if (!currentPrice || !comparison || currentPrice === comparison) return "기본 가정과 동일";
    const change = currentPrice / comparison - 1;
    return `기본값 대비 주당가치 ${change >= 0 ? "+" : ""}${(change * 100).toFixed(1)}%`;
  };

  return (
    <section id="assumptions" className="panel section-panel input-panel">
      <div className="section-heading"><div><p className="section-kicker">03 · 전망 및 주요 가정</p><h2>전망 및 DCF 가정</h2><p>미래 실적을 작성하고 핵심 가정을 검토합니다.</p></div><button className="secondary-button" onClick={resetAssumptions}>DCF 가정 초기화</button></div>
      <ForecastBuilder />
      {usesDcf && mode === "quick" && <div className="quick-assumption-summary"><div><strong>적용할 DCF 시스템 가정</strong><p>간편 모드에서는 공개된 가정을 사용합니다. 고급 모드에서 수정할 수 있습니다.</p></div><dl><div><dt>WACC</dt><dd>{(assumptions.wacc * 100).toFixed(1)}%</dd><small>{company.industry} 기본 검토값</small></div><div><dt>영구성장률</dt><dd>{(assumptions.terminalGrowth * 100).toFixed(1)}%</dd><small>시스템 기본 가정</small></div><div><dt>세율</dt><dd>{(assumptions.taxRate * 100).toFixed(1)}%</dd><small>시스템 기본 가정</small></div><div><dt>D&A / 매출액</dt><dd>{(assumptions.daPercentRevenue * 100).toFixed(1)}%</dd><small>{company.industry === "성숙 제조업" ? "업종 기본값" : "시스템 기본 가정"}</small></div><div><dt>CAPEX / 매출액</dt><dd>{(assumptions.capexPercentRevenue * 100).toFixed(1)}%</dd><small>시스템 기본 가정</small></div></dl>{assumptions.wacc !== industryWacc && <button className="secondary-button" onClick={() => updateAssumption("wacc", industryWacc)}>업종 기본 WACC {(industryWacc * 100).toFixed(1)}% 적용</button>}{company.industry === "은행·금융" && <p className="inline-notice">금융회사는 일반적인 FCFF 기반 WACC보다 P/B·P/E 접근이 더 적합할 수 있습니다.</p>}</div>}
      {usesDcf && mode === "advanced" && <><div className="subsection-heading"><h3>DCF 가정</h3><p>변경 내용은 계산 결과에 즉시 반영됩니다.</p></div>
      <div className="terminal-toggle"><span>최종가치 계산 방식</span><button aria-pressed={terminalMethod === "gordon"} className={terminalMethod === "gordon" ? "active" : ""} onClick={() => setTerminalMethod("gordon")}>고든 성장모형</button><button aria-pressed={terminalMethod === "exitMultiple"} className={terminalMethod === "exitMultiple" ? "active" : ""} onClick={() => setTerminalMethod("exitMultiple")}>출구배수</button></div>
      <div className="slider-grid">
        <AssumptionSlider label="WACC" description="6%는 절대 하한이 아닙니다. 4%~20%에서 입력하고 6%~15% 밖에서는 가정을 재확인하세요." value={assumptions.wacc} defaultValue={industryWacc} min={0.04} max={0.20} step={0.001} scale={100} suffix="%" impactText={impact("wacc")} onChange={(value) => updateAssumption("wacc", value)} />
        <AssumptionSlider label="영구성장률" description="예측기간 이후 현금흐름의 장기 성장률입니다." disabled={terminalMethod !== "gordon"} value={assumptions.terminalGrowth} defaultValue={DEFAULT_ASSUMPTIONS.terminalGrowth} min={0} max={0.05} step={0.001} scale={100} suffix="%" impactText={impact("terminalGrowth")} onChange={(value) => updateAssumption("terminalGrowth", value)} />
        <AssumptionSlider label="출구배수" description="마지막 연도 EBITDA에 적용하는 최종가치 배수입니다." disabled={terminalMethod !== "exitMultiple"} value={assumptions.exitMultiple} defaultValue={DEFAULT_ASSUMPTIONS.exitMultiple} min={3} max={15} step={0.1} suffix="x" impactText={impact("exitMultiple")} onChange={(value) => updateAssumption("exitMultiple", value)} />
      </div>
      {assumptions.wacc < 0.06 && <div className="inline-notice" role="status">WACC {(assumptions.wacc * 100).toFixed(1)}%는 일반적인 성숙기업 검토 범위보다 낮습니다. 무위험수익률, Beta, ERP와 자본구조를 확인해 주세요.</div>}
      {assumptions.wacc > 0.15 && <div className="inline-notice" role="status">WACC {(assumptions.wacc * 100).toFixed(1)}%는 높은 사업·재무 위험을 전제로 합니다.</div>}
      {invalidTerminal && <div className="inline-error" role="alert">영구성장률은 WACC보다 낮아야 합니다. 현재 조합으로는 DCF를 계산할 수 없습니다.</div>}
      <details className="advanced-assumptions disclosure"><summary>고급 WACC·현금흐름 가정</summary><div className="advanced-content"><div className="advanced-title"><div><h3>세부 가정</h3><p>직접 수정하기 전까지 시스템 기본 가정을 적용합니다.</p></div><button className="secondary-button" onClick={() => updateAssumption("wacc", calculatedWacc)}>계산된 WACC 적용</button></div><div className="formula-strip"><span>자기자본비용 <strong>{(costOfEquity * 100).toFixed(2)}%</strong></span><span>계산된 WACC <strong>{(calculatedWacc * 100).toFixed(2)}%</strong></span><span>자기자본 비중 <strong>{((1 - assumptions.debtWeight) * 100).toFixed(1)}%</strong></span></div><div className="input-grid">{advancedFields.map((field) => <label key={field.key}>{field.label}<div className="number-with-suffix"><NumberInput ariaLabel={`${field.label} ${field.suffix} 시스템 기본 가정`} value={Number((assumptions[field.key] * field.scale).toFixed(2))} onChange={(value) => updateAssumption(field.key, value / field.scale)} /><span>{field.suffix}</span></div><small>시스템 기본 가정</small></label>)}</div></div></details></>}
    </section>
  );
}
