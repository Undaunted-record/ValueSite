"use client";

import { AssumptionSlider } from "./AssumptionSlider";
import { NumberInput } from "./NumberInput";
import { DEFAULT_ASSUMPTIONS } from "@/data/demo";
import { calculateDcf } from "@/lib/valuation/dcf";
import { calculateEvBridge } from "@/lib/valuation/evBridge";
import { calculateCostOfEquity, calculateWacc } from "@/lib/valuation/wacc";
import { useValuationStore } from "@/store/useValuationStore";
import type { Assumptions } from "@/types/valuation";

const advancedFields: Array<{ key: keyof Assumptions; label: string; scale: number; suffix: string }> = [
  { key: "riskFreeRate", label: "무위험수익률", scale: 100, suffix: "%" }, { key: "beta", label: "베타", scale: 1, suffix: "x" },
  { key: "equityRiskPremium", label: "주식위험프리미엄(ERP)", scale: 100, suffix: "%" }, { key: "costOfDebt", label: "세전 타인자본비용", scale: 100, suffix: "%" },
  { key: "taxRate", label: "세율", scale: 100, suffix: "%" }, { key: "debtWeight", label: "부채 비중", scale: 100, suffix: "%" },
  { key: "daPercentRevenue", label: "D&A / 매출액", scale: 100, suffix: "%" }, { key: "capexPercentRevenue", label: "CAPEX / 매출액", scale: 100, suffix: "%" },
  { key: "nwcPercentRevenue", label: "NWC 증감 / 매출액", scale: 100, suffix: "%" },
];

export function AssumptionsPanel() {
  const { mode, company, assumptions, terminalMethod, updateAssumption, setTerminalMethod, resetAssumptions } = useValuationStore();
  const calculatedWacc = calculateWacc(assumptions);
  const costOfEquity = calculateCostOfEquity(assumptions);
  const invalidTerminal = terminalMethod === "gordon" && assumptions.wacc <= assumptions.terminalGrowth;
  const price = (next: Assumptions) => calculateEvBridge(calculateDcf(company, next, terminalMethod).enterpriseValue, company).impliedSharePrice;
  const currentPrice = price(assumptions);
  const impact = (field: keyof Assumptions) => {
    const comparison = price({ ...assumptions, [field]: DEFAULT_ASSUMPTIONS[field] });
    if (!currentPrice || !comparison || currentPrice === comparison) return "기본 가정과 동일";
    const change = currentPrice / comparison - 1;
    return `기본값 대비 주당가치 ${change >= 0 ? "+" : ""}${(change * 100).toFixed(1)}%`;
  };

  return (
    <section id="dcf" className="panel section-panel input-panel">
      <div className="section-heading"><div><p className="section-kicker">03 · 주요 가정</p><h2>가정을 직접 검증하세요</h2><p>슬라이더나 숫자 입력을 바꾸면 결과가 즉시 갱신됩니다.</p></div><button className="secondary-button" onClick={resetAssumptions}>모든 가정 초기화</button></div>
      <div className="terminal-toggle"><span>최종가치 계산 방식</span><button aria-pressed={terminalMethod === "gordon"} className={terminalMethod === "gordon" ? "active" : ""} onClick={() => setTerminalMethod("gordon")}>고든 성장모형</button><button aria-pressed={terminalMethod === "exitMultiple"} className={terminalMethod === "exitMultiple" ? "active" : ""} onClick={() => setTerminalMethod("exitMultiple")}>출구배수</button></div>
      <div className="slider-grid">
        <AssumptionSlider label="WACC" description="미래 현금흐름의 위험을 반영한 할인율입니다." value={assumptions.wacc} defaultValue={DEFAULT_ASSUMPTIONS.wacc} min={0.06} max={0.15} step={0.001} scale={100} suffix="%" impactText={impact("wacc")} onChange={(value) => updateAssumption("wacc", value)} />
        <AssumptionSlider label="영구성장률" description="예측기간 이후 현금흐름의 장기 성장률입니다." disabled={terminalMethod !== "gordon"} value={assumptions.terminalGrowth} defaultValue={DEFAULT_ASSUMPTIONS.terminalGrowth} min={0} max={0.05} step={0.001} scale={100} suffix="%" impactText={impact("terminalGrowth")} onChange={(value) => updateAssumption("terminalGrowth", value)} />
        <AssumptionSlider label="출구배수" description="마지막 연도 EBITDA에 적용하는 최종가치 배수입니다." disabled={terminalMethod !== "exitMultiple"} value={assumptions.exitMultiple} defaultValue={DEFAULT_ASSUMPTIONS.exitMultiple} min={3} max={15} step={0.1} suffix="x" impactText={impact("exitMultiple")} onChange={(value) => updateAssumption("exitMultiple", value)} />
      </div>
      {invalidTerminal && <div className="inline-error" role="alert">영구성장률은 WACC보다 낮아야 합니다. 현재 조합으로는 DCF를 계산할 수 없습니다.</div>}
      {mode === "advanced" && <details className="advanced-assumptions disclosure"><summary>고급 WACC·현금흐름 가정</summary><div className="advanced-content"><div className="advanced-title"><div><h3>세부 가정</h3><p>직접 수정하기 전까지 시스템 기본 가정을 적용합니다.</p></div><button className="secondary-button" onClick={() => updateAssumption("wacc", calculatedWacc)}>계산된 WACC 적용</button></div><div className="formula-strip"><span>자기자본비용 <strong>{(costOfEquity * 100).toFixed(2)}%</strong></span><span>계산된 WACC <strong>{(calculatedWacc * 100).toFixed(2)}%</strong></span><span>자기자본 비중 <strong>{((1 - assumptions.debtWeight) * 100).toFixed(1)}%</strong></span></div><div className="input-grid">{advancedFields.map((field) => <label key={field.key}>{field.label}<div className="number-with-suffix"><NumberInput ariaLabel={`${field.label} ${field.suffix} 시스템 기본 가정`} value={Number((assumptions[field.key] * field.scale).toFixed(2))} onChange={(value) => updateAssumption(field.key, value / field.scale)} /><span>{field.suffix}</span></div><small>시스템 기본 가정</small></label>)}</div></div></details>}
    </section>
  );
}
