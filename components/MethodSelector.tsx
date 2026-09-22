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
          <p className="section-kicker">02 · 밸류에이션 방법</p>
          <h2>여러 방법으로 교차 검증하세요</h2>
          <p>실무에서는 복수 방법을 함께 검토합니다. 추천 방법은 일반적인 관행이며 절대적인 기준은 아닙니다.</p>
        </div>
      </div>
      <div className="recommendation-bar">
        <div><small>{company.industry}에서 자주 사용하는 방법</small><strong>{recommended.map((item) => METHOD_META[item].label).join(" + ")}</strong></div>
        <span>추천과 관계없이 원하는 방법을 자유롭게 선택할 수 있습니다.</span>
      </div>
      <div className="method-grid">
        {(Object.keys(METHOD_META) as ValuationMethod[]).map((method) => {
          const meta = METHOD_META[method];
          const selected = methods.includes(method);
          return (
            <button key={method} className={`method-card ${selected ? "selected" : ""}`} onClick={() => toggleMethod(method)}>
              <span className="check-box">{selected ? "✓" : ""}</span>
              <span><strong>{meta.label}</strong><small>{meta.short}</small></span>
              {recommended.includes(method) && <em>추천</em>}
            </button>
          );
        })}
      </div>
      <div className="method-notes">
        {methods.map((method) => <article key={method}><h3>{METHOD_META[method].label}</h3><p><b>주요 활용:</b> {METHOD_META[method].suitable}</p><p><b>유의사항:</b> {METHOD_META[method].caution}</p></article>)}
      </div>
    </section>
  );
}
