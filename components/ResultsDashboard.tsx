"use client";

import { calculateDcf } from "@/lib/valuation/dcf";
import { calculateEvBridge } from "@/lib/valuation/evBridge";
import { buildValuationRanges } from "@/lib/valuation/footballField";
import { runSanityChecks } from "@/lib/valuation/sanityCheck";
import { useValuationStore } from "@/store/useValuationStore";
import { FootballField } from "./FootballField";

const money = (value: number) => `₩${Math.round(value).toLocaleString()}`;
const bn = (value: number) => `₩${Math.round(value).toLocaleString()}십억원`;

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
      {issues.length > 0 && <div className="issues">{issues.map((issue) => <div className={issue.severity} key={`${issue.field}-${issue.message}`}><strong>{issue.severity === "error" ? "계산 중단" : "확인 필요"}</strong><span>{issue.message}</span></div>)}</div>}
      <section id="summary" className="panel section-panel results-panel">
        <div className="section-heading"><div><p className="section-kicker">05 · 밸류에이션 요약</p><h2>{company.name || "기업명 미입력"}</h2><p>{company.industry} · 선택한 방법의 실시간 종합 결과</p></div></div>
        {blocking ? <div className="blocked-state">위 오류를 수정하면 밸류에이션을 다시 계산합니다.</div> : <>
          <div className="hero-result">
            <div><small>주당가치 범위</small><strong>{money(summaryLow)} <span>–</span> {money(summaryHigh)}</strong><p>기준값 {money(summaryBase)} <em className={upside >= 0 ? "positive" : "negative"}>{upside >= 0 ? "+" : ""}{(upside * 100).toFixed(1)}% 현재 주가 대비</em></p></div>
            <div className="result-metrics"><span><small>DCF 기업가치</small><strong>{bn(bridge.enterpriseValue)}</strong></span><span><small>DCF 주주가치</small><strong>{bn(bridge.equityValue)}</strong></span><span><small>선택 방법 수</small><strong>{methods.length}</strong></span></div>
          </div>
          <div className="method-results">{validRanges.map((range) => <details key={range.method}><summary><span>{range.label}<small>{range.metric ?? "기준 시나리오"}</small></span><strong>{money(range.base)}</strong></summary><p>하단 {money(range.low)} · 기준 {money(range.base)} · 상단 {money(range.high)}</p></details>)}</div>
        </>}
      </section>

      {!blocking && <section id="bridge" className="panel section-panel">
        <div className="section-heading"><div><p className="section-kicker">06 · EV → 주주가치 브리지</p><h2>기업가치에서 주당가치까지</h2><p>차입금과 현금 등 조정 과정을 투명하게 보여줍니다.</p></div></div>
        <div className="bridge-grid">
          {[["기업가치(EV)", bridge.enterpriseValue, "primary"], ["차감: 차입금", -bridge.debt, "negative"], ["가산: 현금", bridge.cash, "positive"], ["차감: 우선주", -bridge.preferredStock, "negative"], ["차감: 비지배지분", -bridge.minorityInterest, "negative"], ["기타 조정", bridge.otherAdjustments, bridge.otherAdjustments >= 0 ? "positive" : "negative"], ["주주가치", bridge.equityValue, "total"]].map(([label, value, style]) => <div className={`bridge-item ${style}`} key={label as string}><span>{label}</span><strong>{bn(value as number)}</strong><i style={{ width: `${Math.min(100, Math.abs(value as number) / Math.max(1, bridge.enterpriseValue) * 100)}%` }} /></div>)}
          <div className="share-price-card"><span>주주가치 ÷ 희석주식수 {company.sharesOutstanding.toLocaleString()}백만주</span><strong>{money(bridge.impliedSharePrice)}</strong><small>DCF 기준 주당가치</small></div>
        </div>
      </section>}

      {!blocking && validRanges.length > 0 && <section id="football" className="panel section-panel"><div className="section-heading"><div><p className="section-kicker">07 · FOOTBALL FIELD</p><h2>하나의 정답보다 가치 범위를 확인하세요</h2><p>가정을 조정하면 모든 범위가 실시간으로 변경됩니다.</p></div></div><FootballField ranges={validRanges} currentPrice={company.currentSharePrice} /></section>}

      {!blocking && methods.includes("dcf") && <section className="panel section-panel">
        <div className="section-heading"><div><p className="section-kicker">DCF 계산 내역</p><h2>비차입 현금흐름(UFCF)</h2><p>D&A, CAPEX, NWC 증감 중 기본 가정으로 추정한 값은 명확하게 표시합니다.</p></div><div className="terminal-badge">Terminal Value / EV <strong>{(dcf.terminalValuePercent * 100).toFixed(1)}%</strong></div></div>
        <div className="table-wrap"><table className="financial-table dcf-table"><thead><tr><th>십억원</th>{dcf.projections.map((period) => <th key={period.year}>{period.year}</th>)}</tr></thead><tbody>{([ ["매출액", "revenue"], ["EBIT", "ebit"], ["NOPAT", "nopat"], ["+ D&A (추정)", "da"], ["− CAPEX (추정)", "capex"], ["− NWC 증감 (추정)", "changeNwc"], ["UFCF", "ufcf"], ["현재가치", "presentValue"] ] as const).map(([label, key]) => <tr key={key}><th>{label}</th>{dcf.projections.map((period) => <td key={period.year}>{period[key].toFixed(1)}</td>)}</tr>)}</tbody></table></div>
      </section>}
    </>
  );
}
