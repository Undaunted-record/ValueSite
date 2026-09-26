"use client";

import { calculateDcf } from "@/lib/valuation/dcf";
import { calculateEvBridge } from "@/lib/valuation/evBridge";
import { buildValuationRanges } from "@/lib/valuation/footballField";
import { runSanityChecks } from "@/lib/valuation/sanityCheck";
import { hasValuationInput, summarizeRanges } from "@/lib/valuation/summary";
import { useValuationStore } from "@/store/useValuationStore";
import { FootballField } from "./FootballField";

const money = (value: number) => `₩${Math.round(value).toLocaleString()}`;
const bn = (value: number) => `${value < 0 ? "-" : ""}₩${Math.round(Math.abs(value)).toLocaleString()}십억원`;

export function ResultsDashboard() {
  const { company, assumptions, methods, peers, terminalMethod, dataSource } = useValuationStore();
  const hasInput = hasValuationInput(company);
  const dcf = calculateDcf(company, assumptions, terminalMethod);
  const bridge = calculateEvBridge(dcf.enterpriseValue, company);
  const ranges = buildValuationRanges(company, assumptions, methods, peers, terminalMethod);
  const summary = summarizeRanges(ranges);
  const upside = company.currentSharePrice > 0 ? summary.median / company.currentSharePrice - 1 : null;
  const issues = hasInput ? runSanityChecks(company, assumptions, methods, terminalMethod) : [];
  const blocking = issues.some((issue) => issue.severity === "error");
  const growthRates = [Math.max(0, assumptions.terminalGrowth - 0.005), assumptions.terminalGrowth, assumptions.terminalGrowth + 0.005];
  const waccRates = [Math.max(0.01, assumptions.wacc - 0.01), assumptions.wacc, assumptions.wacc + 0.01];
  const sensitivity = (wacc: number, terminalGrowth: number) => money(calculateEvBridge(calculateDcf(company, { ...assumptions, wacc, terminalGrowth }, "gordon").enterpriseValue, company).impliedSharePrice);
  const rangeCaption = (method: string, metric?: string) => method === "dcf"
    ? `WACC ${(assumptions.wacc * 100).toFixed(1)}% · ${terminalMethod === "gordon" ? `영구성장률 ${(assumptions.terminalGrowth * 100).toFixed(1)}%` : `출구배수 ${assumptions.exitMultiple.toFixed(1)}x`}`
    : metric ?? "기준 시나리오";

  return (
    <>
      {issues.length > 0 && <div className="issues" role="status">{issues.map((issue) => <div className={issue.severity} key={`${issue.field}-${issue.message}`}><strong>{issue.severity === "error" ? "계산 중단" : "확인 필요"}</strong><span>{issue.message}</span></div>)}</div>}
      <section id="summary" className="panel section-panel results-panel">
        <div className="section-heading"><div><p className="section-kicker">04 · 결과 요약</p><h2>{company.name || "밸류에이션 결과"}</h2><p>{hasInput ? `${company.industry} · 선택한 평가 방법의 실시간 결과` : "입력을 완료하면 이곳에서 가치 범위를 확인할 수 있습니다."}</p></div>{dataSource === "demo" && <span className="source-badge demo">샘플 데이터</span>}</div>
        {!hasInput ? <div className="empty-state"><strong>기업 및 재무정보를 입력하면 가치 범위가 표시됩니다.</strong><p>기업명, 희석주식수와 추정 매출·이익을 입력해 주세요.</p><a className="primary-button" href="#financials">재무정보 입력하기</a></div> : blocking ? <div className="blocked-state">위 오류를 수정하면 밸류에이션을 다시 계산합니다.</div> : <>
          <div className="hero-result">
            <div><small>선택 방법 전체 가치 범위</small><strong>{money(summary.low)} <span>–</span> {money(summary.high)}</strong><p><span title="선택한 평가 방법의 기준 주당가치를 크기순으로 정렬한 중앙값입니다.">선택 방법 중앙값 ⓘ</span> {money(summary.median)} {upside !== null && <em className={upside >= 0 ? "positive" : "negative"}>{upside >= 0 ? "+" : ""}{(upside * 100).toFixed(1)}% 현재 주가 대비</em>}</p></div>
            <div className="result-metrics"><span><small>DCF 기업가치</small><strong>{bn(bridge.enterpriseValue)}</strong></span><span><small>DCF 주주가치</small><strong>{bn(bridge.equityValue)}</strong></span><span><small>선택 방법 수</small><strong>{methods.length}</strong></span></div>
          </div>
          <div className="method-results">{summary.valid.map((range) => <details key={range.method}><summary><span>{range.label}<small>{rangeCaption(range.method, range.metric)}</small></span><strong>{money(range.base)}</strong></summary><p>저점 {money(range.low)} · 기준 {money(range.base)} · 고점 {money(range.high)}</p></details>)}</div>
        </>}
      </section>

      {hasInput && !blocking && <section id="bridge" className="panel section-panel detail-panel">
        <div className="section-heading"><div><p className="section-kicker">05 · EV → 주주가치 브리지</p><h2>기업가치에서 주당가치까지</h2><p>기업가치 − 차입금 + 현금 − 우선주 − 비지배지분 ± 기타 조정 = 주주가치</p></div></div>
        <div className="bridge-grid">
          {([ ["기업가치(EV)", bridge.enterpriseValue, "primary"], ["차감: 차입금", -bridge.debt, "negative"], ["가산: 현금", bridge.cash, "positive"], ...(bridge.preferredStock ? [["차감: 우선주", -bridge.preferredStock, "negative"]] : []), ...(bridge.minorityInterest ? [["차감: 비지배지분", -bridge.minorityInterest, "negative"]] : []), ...(bridge.otherAdjustments ? [[`${bridge.otherAdjustments >= 0 ? "가산" : "차감"}: 기타 조정`, bridge.otherAdjustments, bridge.otherAdjustments >= 0 ? "positive" : "negative"]] : []), ["주주가치", bridge.equityValue, "total"] ] as Array<[string, number, string]>).map(([label, value, style]) => <div className={`bridge-item ${style}`} key={label}><span>{label}</span><strong>{bn(value)}</strong><i style={{ width: `${Math.min(100, Math.abs(value) / Math.max(1, bridge.enterpriseValue) * 100)}%` }} /></div>)}
          <div className="share-price-card"><span>주주가치 ÷ 희석주식수 {company.sharesOutstanding.toLocaleString()}백만주</span><strong>{money(bridge.impliedSharePrice)}</strong><small>DCF 기준 주당가치</small></div>
        </div>
      </section>}

      {hasInput && !blocking && summary.valid.length > 0 && <section id="football" className="panel section-panel detail-panel"><div className="section-heading"><div><p className="section-kicker">06 · 가치범위 비교</p><h2>방법별 저점·기준값·고점</h2><p>Football Field 방식으로 평가 결과와 현재 주가를 비교합니다.</p></div></div><FootballField ranges={summary.valid} currentPrice={company.currentSharePrice} medianValue={summary.median} /></section>}

      {hasInput && !blocking && methods.includes("dcf") && <details id="dcf-details" className="panel section-panel detail-panel dcf-disclosure">
        <summary><span><span className="section-kicker">07 · DCF 상세 계산</span><strong>비차입 현금흐름(UFCF)과 민감도</strong></span><span>상세 보기</span></summary>
        <div className="dcf-detail-content">
          <div className="section-heading"><div><h2>비차입 현금흐름(UFCF)</h2><p>예측기간은 3개년이며, <abbr title="세후영업이익">NOPAT</abbr>, <abbr title="감가상각비">D&A</abbr>, <abbr title="설비투자">CAPEX</abbr>, <abbr title="순운전자본 증감">NWC</abbr>를 반영합니다.</p></div><div className="terminal-badge">최종가치 / EV <strong>{(dcf.terminalValuePercent * 100).toFixed(1)}%</strong></div></div>
          {dcf.terminalValuePercent > 0.75 && <div className="terminal-warning" role="status">기업가치의 {(dcf.terminalValuePercent * 100).toFixed(0)}%가 최종가치에서 발생합니다. WACC와 영구성장률 변화에 결과가 민감할 수 있습니다.</div>}
          <div className="table-wrap"><table className="financial-table dcf-table"><thead><tr><th>십억원</th>{dcf.projections.map((period) => <th key={period.year}>{period.year}</th>)}</tr></thead><tbody>{([ ["매출액", "revenue"], ["EBIT", "ebit"], ["NOPAT", "nopat"], ["+ D&A (시스템 추정)", "da"], ["− CAPEX (시스템 추정)", "capex"], ["− NWC 증감 (시스템 추정)", "changeNwc"], ["UFCF", "ufcf"], ["현재가치", "presentValue"] ] as const).map(([label, key]) => <tr key={key}><th>{label}</th>{dcf.projections.map((period) => <td key={period.year}>{period[key].toFixed(1)}</td>)}</tr>)}</tbody></table></div>
          {terminalMethod === "gordon" && <div className="sensitivity-block"><h3>WACC × 영구성장률 민감도</h3><div className="table-wrap"><table className="sensitivity-table"><thead><tr><th>WACC \ 성장률</th>{growthRates.map((g) => <th key={g}>{(g * 100).toFixed(1)}%</th>)}</tr></thead><tbody>{waccRates.map((w) => <tr key={w}><th>{(w * 100).toFixed(1)}%</th>{growthRates.map((g) => <td key={g}>{w > g ? sensitivity(w, g) : "계산 불가"}</td>)}</tr>)}</tbody></table></div></div>}
        </div>
      </details>}
    </>
  );
}
