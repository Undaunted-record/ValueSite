"use client";

import { useState } from "react";
import { INDUSTRY_RECOMMENDATIONS, METHOD_META } from "@/lib/valuation/assumptions";
import { useValuationStore } from "@/store/useValuationStore";
import type { ValuationMethod } from "@/types/valuation";

export function MethodSelector() {
  const { company, methods, toggleMethod } = useValuationStore();
  const [notice, setNotice] = useState("");
  const recommended = INDUSTRY_RECOMMENDATIONS[company.industry] ?? ["dcf", "tradingComps"];

  return (
    <section id="methods" className="panel section-panel">
      <div className="section-heading">
        <div>
          <p className="section-kicker">02 · 평가 방법</p>
          <h2>평가 방법</h2>
          <p>계산 가능한 방법만 결과 범위에 포함됩니다.</p>
        </div>
      </div>
      <div className="recommendation-bar">
        <div><small>{company.industry}에서 자주 사용하는 방법</small><strong>{recommended.map((item) => METHOD_META[item].label).join(" + ")}</strong></div>
        <span>최소 한 가지 방법을 선택해야 합니다.</span>
      </div>
      {notice && <div className="inline-notice" role="status">{notice}</div>}
      <div className="method-grid">
        {(Object.keys(METHOD_META) as ValuationMethod[]).map((method) => {
          const meta = METHOD_META[method];
          const selected = methods.includes(method);
          return (
            <button key={method} aria-pressed={selected} className={`method-card ${selected ? "selected" : ""}`} onClick={() => {
              if (selected && methods.length === 1) return setNotice("최소 한 가지 평가 방법을 선택해 주세요.");
              setNotice(""); toggleMethod(method);
            }}>
              <span className="check-box">{selected ? "✓" : ""}</span>
              <span><strong>{meta.label}</strong><small>{meta.short}</small><small className="method-caution">유의: {meta.caution}</small></span>
              {recommended.includes(method) && <em>추천</em>}
            </button>
          );
        })}
      </div>
    </section>
  );
}
