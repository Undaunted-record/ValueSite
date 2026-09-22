"use client";

import { AssumptionSlider } from "./AssumptionSlider";
import { DEFAULT_ASSUMPTIONS } from "@/data/demo";
import { calculateCostOfEquity, calculateWacc } from "@/lib/valuation/wacc";
import { useValuationStore } from "@/store/useValuationStore";
import type { Assumptions } from "@/types/valuation";

const advancedFields: Array<{ key: keyof Assumptions; label: string; scale: number; suffix: string; step: number }> = [
  { key: "riskFreeRate", label: "무위험수익률", scale: 100, suffix: "%", step: 0.1 },
  { key: "beta", label: "베타(Beta)", scale: 1, suffix: "x", step: 0.05 },
  { key: "equityRiskPremium", label: "주식위험프리미엄(ERP)", scale: 100, suffix: "%", step: 0.1 },
  { key: "costOfDebt", label: "세전 타인자본비용", scale: 100, suffix: "%", step: 0.1 },
  { key: "taxRate", label: "세율", scale: 100, suffix: "%", step: 0.5 },
  { key: "debtWeight", label: "부채 비중", scale: 100, suffix: "%", step: 1 },
  { key: "daPercentRevenue", label: "D&A / 매출액", scale: 100, suffix: "%", step: 0.1 },
  { key: "capexPercentRevenue", label: "CAPEX / 매출액", scale: 100, suffix: "%", step: 0.1 },
  { key: "nwcPercentRevenue", label: "NWC 증감 / 매출액", scale: 100, suffix: "%", step: 0.1 },
];

export function AssumptionsPanel() {
  const { mode, assumptions, terminalMethod, updateAssumption, setTerminalMethod } = useValuationStore();
  const calculatedWacc = calculateWacc(assumptions);
  const costOfEquity = calculateCostOfEquity(assumptions);

  return (
    <section id="dcf" className="panel section-panel">
      <div className="section-heading">
        <div><p className="section-kicker">03 · 주요 가정 조정</p><h2>가정을 직접 검증하세요</h2><p>슬라이더를 움직이거나 숫자를 입력하면 모든 밸류에이션 결과가 즉시 바뀝니다.</p></div>
      </div>
      <div className="slider-grid">
        <AssumptionSlider label="WACC" value={assumptions.wacc} defaultValue={DEFAULT_ASSUMPTIONS.wacc} min={0.06} max={0.15} step={0.001} scale={100} suffix="%" onChange={(value) => updateAssumption("wacc", value)} />
        <AssumptionSlider label="영구성장률" value={assumptions.terminalGrowth} defaultValue={DEFAULT_ASSUMPTIONS.terminalGrowth} min={0} max={0.05} step={0.001} scale={100} suffix="%" onChange={(value) => updateAssumption("terminalGrowth", value)} />
        <AssumptionSlider label="출구배수(Exit Multiple)" value={assumptions.exitMultiple} defaultValue={DEFAULT_ASSUMPTIONS.exitMultiple} min={3} max={15} step={0.1} suffix="x" onChange={(value) => updateAssumption("exitMultiple", value)} />
      </div>
      <div className="terminal-toggle">
        <span>최종가치(Terminal Value) 계산 방식</span>
        <button className={terminalMethod === "gordon" ? "active" : ""} onClick={() => setTerminalMethod("gordon")}>고든 성장모형</button>
        <button className={terminalMethod === "exitMultiple" ? "active" : ""} onClick={() => setTerminalMethod("exitMultiple")}>출구배수</button>
      </div>

      {mode === "advanced" && (
        <div className="advanced-assumptions">
          <div className="advanced-title"><div><h3>고급 WACC·현금흐름 가정</h3><p>직접 수정하기 전까지 표시된 기본 가정을 적용합니다.</p></div><button className="secondary-button" onClick={() => updateAssumption("wacc", calculatedWacc)}>계산된 WACC 적용</button></div>
          <div className="formula-strip"><span>자기자본비용 <strong>{(costOfEquity * 100).toFixed(2)}%</strong></span><span>계산된 WACC <strong>{(calculatedWacc * 100).toFixed(2)}%</strong></span><span>자기자본 비중 <strong>{((1 - assumptions.debtWeight) * 100).toFixed(1)}%</strong></span></div>
          <div className="input-grid">
            {advancedFields.map((field) => <label key={field.key}>{field.label}<div className="number-with-suffix"><input type="number" step={field.step} value={Number((assumptions[field.key] * field.scale).toFixed(2))} onChange={(event) => updateAssumption(field.key, Number(event.target.value) / field.scale)} /><span>{field.suffix}</span></div><small>기본 가정</small></label>)}
          </div>
        </div>
      )}
    </section>
  );
}
