"use client";

import { calculateDcf } from "@/lib/valuation/dcf";
import { calculateEvBridge } from "@/lib/valuation/evBridge";
import { buildValuationRanges } from "@/lib/valuation/footballField";
import { runSanityChecks } from "@/lib/valuation/sanityCheck";
import { useValuationStore } from "@/store/useValuationStore";
import { FootballField } from "./FootballField";

const money = (value: number) => `₩${Math.round(value).toLocaleString()}`;
const bn = (value: number) => `₩${Math.round(value).toLocaleString()}bn`;

export function ResultsDashboard() {
  const { company, assumptions, methods, peers, terminalMethod } = useValuationStore();
  const dcf = calculateDcf(company, assumptions, terminalMethod);
  const bridge = calculateEvBridge(dcf.enterpriseValue, company);
  const ranges = buildValuationRanges(company, assumptions, methods, peers, terminalMethod);
  const validRanges = ranges.filter((range) => Number.isFinite(range.base) && range.base > 0);
  const summaryLow = validRanges.length ? Math.min(...validRanges.map((range) => range.low)) : 0;
  const summaryHigh = validRanges.length ? Math.max(...validRanges.map((range) => range.high)) : 0;
  const summaryBase = validRanges.length ? validRanges.reduce((sum, range) => sum + range.base, 0) / validRanges.length : 0;
  const upside = company.currentSharePrice > 0 ? summaryBase / company.currentSharePrice - 1 : 0;
  const issues = runSanityChecks(company, assumptions, methods);
  const blocking = issues.some((issue) => issue.severity === "error");

  return (
    <>
      {issues.length > 0 && <div className="issues">{issues.map((issue) => <div className={issue.severity} key={`${issue.field}-${issue.message}`}><strong>{issue.severity === "error" ? "Calculation blocked" : "Review"}</strong><span>{issue.message}</span></div>)}</div>}
      <section id="summary" className="panel section-panel results-panel">
        <div className="section-heading"><div><p className="section-kicker">05 · VALUATION SUMMARY</p><h2>{company.name || "Untitled Company"}</h2><p>{company.industry} · Live blended view of selected methods</p></div></div>
        {blocking ? <div className="blocked-state">Resolve the errors above to calculate valuation.</div> : <>
          <div className="hero-result">
            <div><small>IMPLIED SHARE PRICE RANGE</small><strong>{money(summaryLow)} <span>–</span> {money(summaryHigh)}</strong><p>Base {money(summaryBase)} <em className={upside >= 0 ? "positive" : "negative"}>{upside >= 0 ? "+" : ""}{(upside * 100).toFixed(1)}% vs. current</em></p></div>
            <div className="result-metrics"><span><small>DCF Enterprise Value</small><strong>{bn(bridge.enterpriseValue)}</strong></span><span><small>DCF Equity Value</small><strong>{bn(bridge.equityValue)}</strong></span><span><small>Selected Methods</small><strong>{methods.length}</strong></span></div>
          </div>
          <div className="method-results">{validRanges.map((range) => <details key={range.method}><summary><span>{range.label}<small>{range.metric ?? "Base case"}</small></span><strong>{money(range.base)}</strong></summary><p>Low {money(range.low)} · Base {money(range.base)} · High {money(range.high)}</p></details>)}</div>
        </>}
      </section>

      {!blocking && <section id="bridge" className="panel section-panel">
        <div className="section-heading"><div><p className="section-kicker">06 · EV → EQUITY BRIDGE</p><h2>From business value to share price</h2><p>Transparent reconciliation of non-equity claims and cash.</p></div></div>
        <div className="bridge-grid">
          {[["Enterprise Value", bridge.enterpriseValue, "primary"], ["Less: Debt", -bridge.debt, "negative"], ["Add: Cash", bridge.cash, "positive"], ["Less: Preferred Stock", -bridge.preferredStock, "negative"], ["Less: Minority Interest", -bridge.minorityInterest, "negative"], ["Other Adjustments", bridge.otherAdjustments, bridge.otherAdjustments >= 0 ? "positive" : "negative"], ["Equity Value", bridge.equityValue, "total"]].map(([label, value, style]) => <div className={`bridge-item ${style}`} key={label as string}><span>{label}</span><strong>{bn(value as number)}</strong><i style={{ width: `${Math.min(100, Math.abs(value as number) / Math.max(1, bridge.enterpriseValue) * 100)}%` }} /></div>)}
          <div className="share-price-card"><span>Equity Value ÷ {company.sharesOutstanding.toLocaleString()}mn diluted shares</span><strong>{money(bridge.impliedSharePrice)}</strong><small>DCF implied share price</small></div>
        </div>
      </section>}

      {!blocking && validRanges.length > 0 && <section id="football" className="panel section-panel"><div className="section-heading"><div><p className="section-kicker">07 · FOOTBALL FIELD</p><h2>See the valuation, not a false precision</h2><p>Ranges move in real time with your assumptions.</p></div></div><FootballField ranges={validRanges} currentPrice={company.currentSharePrice} /></section>}

      {!blocking && methods.includes("dcf") && <section className="panel section-panel">
        <div className="section-heading"><div><p className="section-kicker">DCF WORKINGS</p><h2>Unlevered free cash flow</h2><p>D&A, CAPEX and change in NWC are clearly labelled as default assumptions.</p></div><div className="terminal-badge">Terminal value / EV <strong>{(dcf.terminalValuePercent * 100).toFixed(1)}%</strong></div></div>
        <div className="table-wrap"><table className="financial-table dcf-table"><thead><tr><th>₩bn</th>{dcf.projections.map((period) => <th key={period.year}>{period.year}</th>)}</tr></thead><tbody>{([ ["Revenue", "revenue"], ["EBIT", "ebit"], ["NOPAT", "nopat"], ["+ D&A (Estimated)", "da"], ["− CAPEX (Estimated)", "capex"], ["− Change in NWC (Estimated)", "changeNwc"], ["UFCF", "ufcf"], ["Present Value", "presentValue"] ] as const).map(([label, key]) => <tr key={key}><th>{label}</th>{dcf.projections.map((period) => <td key={period.year}>{period[key].toFixed(1)}</td>)}</tr>)}</tbody></table></div>
      </section>}
    </>
  );
}
