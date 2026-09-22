"use client";

import { INDUSTRY_RECOMMENDATIONS, METHOD_META } from "@/lib/valuation/assumptions";
import { useValuationStore } from "@/store/useValuationStore";
import type { ValuationMethod } from "@/types/valuation";

export function MethodSelector() {
  const { company, methods, toggleMethod } = useValuationStore();
  const recommended = INDUSTRY_RECOMMENDATIONS[company.industry] ?? ["dcf", "tradingComps"];

  return (
    <section id="methods" className="panel section-panel">
      <div className="section-heading">
        <div>
          <p className="section-kicker">02 · VALUATION METHODS</p>
          <h2>Select more than one lens</h2>
          <p>Cross-checking methods is standard practice. Recommendations are common conventions, not absolute rules.</p>
        </div>
      </div>
      <div className="recommendation-bar">
        <div><small>COMMONLY USED FOR {company.industry.toUpperCase()}</small><strong>{recommended.map((item) => METHOD_META[item].label).join(" + ")}</strong></div>
        <span>You can freely select any method.</span>
      </div>
      <div className="method-grid">
        {(Object.keys(METHOD_META) as ValuationMethod[]).map((method) => {
          const meta = METHOD_META[method];
          const selected = methods.includes(method);
          return (
            <button key={method} className={`method-card ${selected ? "selected" : ""}`} onClick={() => toggleMethod(method)}>
              <span className="check-box">{selected ? "✓" : ""}</span>
              <span><strong>{meta.label}</strong><small>{meta.short}</small></span>
              {recommended.includes(method) && <em>Common</em>}
            </button>
          );
        })}
      </div>
      <div className="method-notes">
        {methods.map((method) => <article key={method}><h3>{METHOD_META[method].label}</h3><p><b>Common use:</b> {METHOD_META[method].suitable}</p><p><b>Watch out:</b> {METHOD_META[method].caution}</p></article>)}
      </div>
    </section>
  );
}
