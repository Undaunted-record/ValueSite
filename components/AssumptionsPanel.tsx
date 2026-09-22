"use client";

import { AssumptionSlider } from "./AssumptionSlider";
import { DEFAULT_ASSUMPTIONS } from "@/data/demo";
import { calculateCostOfEquity, calculateWacc } from "@/lib/valuation/wacc";
import { useValuationStore } from "@/store/useValuationStore";
import type { Assumptions } from "@/types/valuation";

const advancedFields: Array<{ key: keyof Assumptions; label: string; scale: number; suffix: string; step: number }> = [
  { key: "riskFreeRate", label: "Risk-free Rate", scale: 100, suffix: "%", step: 0.1 },
  { key: "beta", label: "Beta", scale: 1, suffix: "x", step: 0.05 },
  { key: "equityRiskPremium", label: "Equity Risk Premium", scale: 100, suffix: "%", step: 0.1 },
  { key: "costOfDebt", label: "Pre-tax Cost of Debt", scale: 100, suffix: "%", step: 0.1 },
  { key: "taxRate", label: "Tax Rate", scale: 100, suffix: "%", step: 0.5 },
  { key: "debtWeight", label: "Debt Weight", scale: 100, suffix: "%", step: 1 },
  { key: "daPercentRevenue", label: "D&A / Revenue", scale: 100, suffix: "%", step: 0.1 },
  { key: "capexPercentRevenue", label: "CAPEX / Revenue", scale: 100, suffix: "%", step: 0.1 },
  { key: "nwcPercentRevenue", label: "Change in NWC / Revenue", scale: 100, suffix: "%", step: 0.1 },
];

export function AssumptionsPanel() {
  const { mode, assumptions, terminalMethod, updateAssumption, setTerminalMethod } = useValuationStore();
  const calculatedWacc = calculateWacc(assumptions);
  const costOfEquity = calculateCostOfEquity(assumptions);

  return (
    <section id="dcf" className="panel section-panel">
      <div className="section-heading">
        <div><p className="section-kicker">03 · INTERACTIVE ASSUMPTIONS</p><h2>Defend the assumptions</h2><p>Move a slider or type a value. Every valuation view updates instantly.</p></div>
      </div>
      <div className="slider-grid">
        <AssumptionSlider label="WACC" value={assumptions.wacc} defaultValue={DEFAULT_ASSUMPTIONS.wacc} min={0.06} max={0.15} step={0.001} scale={100} suffix="%" onChange={(value) => updateAssumption("wacc", value)} />
        <AssumptionSlider label="Terminal Growth" value={assumptions.terminalGrowth} defaultValue={DEFAULT_ASSUMPTIONS.terminalGrowth} min={0} max={0.05} step={0.001} scale={100} suffix="%" onChange={(value) => updateAssumption("terminalGrowth", value)} />
        <AssumptionSlider label="Exit Multiple" value={assumptions.exitMultiple} defaultValue={DEFAULT_ASSUMPTIONS.exitMultiple} min={3} max={15} step={0.1} suffix="x" onChange={(value) => updateAssumption("exitMultiple", value)} />
      </div>
      <div className="terminal-toggle">
        <span>Terminal Value Method</span>
        <button className={terminalMethod === "gordon" ? "active" : ""} onClick={() => setTerminalMethod("gordon")}>Gordon Growth</button>
        <button className={terminalMethod === "exitMultiple" ? "active" : ""} onClick={() => setTerminalMethod("exitMultiple")}>Exit Multiple</button>
      </div>

      {mode === "advanced" && (
        <div className="advanced-assumptions">
          <div className="advanced-title"><div><h3>Advanced WACC & Cash Flow Drivers</h3><p>These values are default assumptions until you override them.</p></div><button className="secondary-button" onClick={() => updateAssumption("wacc", calculatedWacc)}>Use calculated WACC</button></div>
          <div className="formula-strip"><span>Cost of Equity <strong>{(costOfEquity * 100).toFixed(2)}%</strong></span><span>Calculated WACC <strong>{(calculatedWacc * 100).toFixed(2)}%</strong></span><span>Equity Weight <strong>{((1 - assumptions.debtWeight) * 100).toFixed(1)}%</strong></span></div>
          <div className="input-grid">
            {advancedFields.map((field) => <label key={field.key}>{field.label}<div className="number-with-suffix"><input type="number" step={field.step} value={Number((assumptions[field.key] * field.scale).toFixed(2))} onChange={(event) => updateAssumption(field.key, Number(event.target.value) / field.scale)} /><span>{field.suffix}</span></div><small>Default assumption</small></label>)}
          </div>
        </div>
      )}
    </section>
  );
}
