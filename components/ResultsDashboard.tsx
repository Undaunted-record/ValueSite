"use client";

import { METHOD_META } from "@/lib/valuation/assumptions";
import { calculateDcf } from "@/lib/valuation/dcf";
import { calculateEvBridge } from "@/lib/valuation/evBridge";
import { buildValuationRanges } from "@/lib/valuation/footballField";
import { assessMethodReadiness } from "@/lib/valuation/readiness";
import { runSanityChecks } from "@/lib/valuation/sanityCheck";
import { summarizeRanges } from "@/lib/valuation/summary";
import { useValuationStore } from "@/store/useValuationStore";
import { FootballField } from "./FootballField";

const money = (value: number) => `₩${Math.round(value).toLocaleString()}`;
const bn = (value: number) => `${value < 0 ? "-" : ""}₩${Math.round(Math.abs(value)).toLocaleString()}십억원`;

function useResults() {
  const state = useValuationStore();
  const { company, assumptions, methods, peers, terminalMethod } = state;
  const readiness = assessMethodReadiness(company, assumptions, peers, terminalMethod);
  const selected = readiness.filter((item) => methods.includes(item.method));
  const readyMethods = new Set(selected.filter((item) => item.ready).map((item) => item.method));
  const dcf = calculateDcf(company, assumptions, terminalMethod);
  const bridge = calculateEvBridge(dcf.enterpriseValue, company);
  const ranges = company.sharesOutstanding > 0 ? buildValuationRanges(company, assumptions, methods, peers, terminalMethod).filter((range) => readyMethods.has(range.method)) : [];
  return { ...state, selected, dcf, bridge, summary: summarizeRanges(ranges) };
}

export function ResultsDashboard() {
  const { company, assumptions, methods, peers, terminalMethod, dataSource, selected, dcf, bridge, summary } = useResults();
  const actuals = company.financials.filter((period) => period.type === "actual");
  const estimates = company.financials.filter((period) => period.type === "estimate");
  const checks = [
    ["기업 정보", Boolean(company.name.trim())], ["최근 실적", actuals.filter((period) => period.revenue > 0).length >= 3],
    ["3개년 추정 매출", estimates.length >= 3 && estimates.every((period) => period.revenue > 0)], ["3개년 추정 EBIT", estimates.length >= 3 && estimates.every((period) => period.ebit !== 0)],
    ["추정 순이익", estimates.some((period) => period.netIncome !== 0)], ["희석주식수", company.sharesOutstanding > 0],
    ["평가 방법", methods.length > 0], ["계산 가능 방법", selected.some((item) => item.ready)],
    ["유사기업", !methods.includes("tradingComps") || peers.length > 0], ["현재 주가", company.currentSharePrice > 0],
  ] as const;
  const completed = checks.filter(([, done]) => done).length;
  const upside = company.currentSharePrice > 0 && summary.median > 0 ? summary.median / company.currentSharePrice - 1 : null;
  const issues = company.name.trim() || actuals.some((period) => period.revenue > 0) ? runSanityChecks(company, assumptions, methods, terminalMethod) : [];
  const rangeByMethod = new Map(summary.valid.map((range) => [range.method, range]));
  return <>
    <section className="analysis-check" aria-label="분석 점검"><div><strong>분석 준비도 {completed}/10</strong><span>{selected.filter((item) => item.ready).length}/{selected.length}개 선택 방법 계산 가능</span></div><div className="check-list">{checks.map(([label, done]) => <span className={done ? "done" : "pending"} key={label}>{done ? "완료" : "필요"} · {label}</span>)}</div></section>
    {issues.length > 0 && <div className="issues" role="status">{issues.map((issue) => <div className={issue.severity} key={`${issue.field}-${issue.message}`}><strong>{issue.severity === "error" ? "오류" : "확인"}</strong><span>{issue.message}</span></div>)}</div>}
    <section id="summary" className="panel section-panel results-panel">
      <div className="section-heading"><div><p className="section-kicker">04 · 결과 요약</p><h2>{company.name || "밸류에이션 결과"}</h2><p>{actuals.at(-1)?.year ?? "기준연도 미입력"} · 계산 가능한 방법만 결과에 포함합니다.</p></div>{dataSource === "demo" && <span className="source-badge demo">샘플 데이터</span>}</div>
      {dcf.enterpriseValue > 0 && <div className="value-strip"><span><small>DCF 기업가치</small><strong>{bn(bridge.enterpriseValue)}</strong></span><span><small>DCF 주주가치</small><strong>{bn(bridge.equityValue)}</strong></span><span><small>DCF 주당가치</small><strong>{company.sharesOutstanding > 0 ? money(bridge.impliedSharePrice) : "주식수 입력 필요"}</strong></span></div>}
      {summary.valid.length > 0 ? <div className="hero-result"><div><small>선택 방법 전체 가치 범위</small><strong>{money(summary.low)} <span>–</span> {money(summary.high)}</strong><p><span title="계산 가능한 선택 방법의 기준 주당가치를 크기순으로 정렬한 중앙값입니다.">선택 방법 중앙값 ⓘ</span> {money(summary.median)} {upside !== null && <em className={upside >= 0 ? "positive" : "negative"}>{upside >= 0 ? "+" : ""}{(upside * 100).toFixed(1)}% 현재 주가 대비</em>}</p></div><div className="result-metrics"><span><small>계산 가능</small><strong>{selected.filter((item) => item.ready).length}</strong></span><span><small>선택 방법</small><strong>{selected.length}</strong></span><span><small>현재 주가</small><strong>{company.currentSharePrice > 0 ? money(company.currentSharePrice) : "미입력"}</strong></span></div></div> : <div className="result-guidance"><strong>{selected.some((item) => item.ready) ? "기업가치는 계산됐지만 주당가치 산출에 희석주식수가 필요합니다." : "아래 준비 항목을 완료하면 방법별 결과가 표시됩니다."}</strong><p>현재 주가는 상승·하락률 계산에만 필요하며 내재가치 계산을 막지 않습니다.</p><a className="secondary-button" href="#assumptions">전망 및 가정 입력</a></div>}
      <div className="method-status-grid">{selected.map((item) => { const range = rangeByMethod.get(item.method); return <article className={item.ready ? "ready" : "not-ready"} key={item.method}><div><strong>{METHOD_META[item.method].label}</strong><span>{item.ready ? "계산 가능" : "계산 준비 필요"}</span></div>{range ? <><b>{money(range.base)}</b><small>저점 {money(range.low)} · 고점 {money(range.high)}{range.metric ? ` · ${range.metric}` : ""}</small></> : item.ready ? <p>희석주식수를 입력하면 주당가치가 표시됩니다.</p> : <p>{item.missing.join(" · ")} 필요</p>}</article>; })}</div>
    </section>
  </>;
}

export function AnalysisDetails() {
  const { company, assumptions, methods, terminalMethod, selected, dcf, bridge, summary } = useResults();
  const dcfReady = selected.find((item) => item.method === "dcf")?.ready;
  const growthRates = [Math.max(0, assumptions.terminalGrowth - 0.005), assumptions.terminalGrowth, assumptions.terminalGrowth + 0.005];
  const waccRates = [Math.max(0.01, assumptions.wacc - 0.01), assumptions.wacc, assumptions.wacc + 0.01];
  const sensitivity = (wacc: number, terminalGrowth: number) => company.sharesOutstanding > 0 ? money(calculateEvBridge(calculateDcf(company, { ...assumptions, wacc, terminalGrowth }, "gordon").enterpriseValue, company).impliedSharePrice) : "주식수 필요";
  return <>
    {dcfReady && methods.includes("dcf") && <details id="dcf-details" className="panel section-panel detail-panel dcf-disclosure"><summary><span><span className="section-kicker">06 · DCF 상세 분석</span><strong>UFCF와 민감도</strong></span><span>상세 보기</span></summary><div className="dcf-detail-content"><div className="dcf-summary-line"><div><strong>예측기간 {dcf.projections.length}개년</strong><p><abbr title="비차입 현금흐름">UFCF</abbr>, <abbr title="세후영업이익">NOPAT</abbr>, <abbr title="감가상각비">D&A</abbr>, <abbr title="설비투자">CAPEX</abbr>, <abbr title="순운전자본 증감">NWC</abbr>를 반영합니다.</p></div><div className="terminal-badge">최종가치 / EV <strong>{(dcf.terminalValuePercent * 100).toFixed(1)}%</strong></div></div>{dcf.terminalValuePercent > 0.75 && <div className="terminal-warning" role="status">기업가치의 {(dcf.terminalValuePercent * 100).toFixed(0)}%가 최종가치에서 발생합니다. WACC와 영구성장률 변화에 민감할 수 있습니다.</div>}<div className="table-wrap"><table className="financial-table dcf-table"><thead><tr><th>십억원</th>{dcf.projections.map((period) => <th key={period.year}>{period.year}</th>)}</tr></thead><tbody>{([ ["매출액", "revenue"], ["EBIT", "ebit"], ["NOPAT", "nopat"], ["+ D&A (시스템 추정)", "da"], ["− CAPEX (시스템 추정)", "capex"], ["− NWC 증감 (시스템 추정)", "changeNwc"], ["UFCF", "ufcf"], ["현재가치", "presentValue"] ] as const).map(([label, key]) => <tr key={key}><th>{label}</th>{dcf.projections.map((period) => <td key={period.year}>{period[key].toFixed(1)}</td>)}</tr>)}</tbody></table></div>{terminalMethod === "gordon" && <div className="sensitivity-block"><h3>WACC × 영구성장률 민감도</h3><div className="table-wrap"><table className="sensitivity-table"><thead><tr><th>WACC \ 성장률</th>{growthRates.map((g) => <th key={g}>{(g * 100).toFixed(1)}%</th>)}</tr></thead><tbody>{waccRates.map((w) => <tr key={w}><th>{(w * 100).toFixed(1)}%</th>{growthRates.map((g) => <td key={g}>{w > g ? sensitivity(w, g) : "계산 불가"}</td>)}</tr>)}</tbody></table></div></div>}</div></details>}
    {dcfReady && <section id="bridge" className="panel section-panel detail-panel"><div className="section-heading"><div><p className="section-kicker">07 · EV → 주주가치</p><h2>기업가치에서 주주가치까지</h2><p>기업가치 − 차입금 + 현금 − 우선주 − 비지배지분 ± 기타 조정 = 주주가치</p></div></div><div className="bridge-grid">{([ ["기업가치(EV)", bridge.enterpriseValue, "primary"], ["차감: 차입금", -bridge.debt, "negative"], ["가산: 현금", bridge.cash, "positive"], ...(bridge.preferredStock ? [["차감: 우선주", -bridge.preferredStock, "negative"]] : []), ...(bridge.minorityInterest ? [["차감: 비지배지분", -bridge.minorityInterest, "negative"]] : []), ...(bridge.otherAdjustments ? [[`${bridge.otherAdjustments >= 0 ? "가산" : "차감"}: 기타 조정`, bridge.otherAdjustments, bridge.otherAdjustments >= 0 ? "positive" : "negative"]] : []), ["주주가치", bridge.equityValue, "total"] ] as Array<[string, number, string]>).map(([label, value, style]) => <div className={`bridge-item ${style}`} key={label}><span>{label}</span><strong>{bn(value)}</strong><i style={{ width: `${Math.min(100, Math.abs(value) / Math.max(1, bridge.enterpriseValue) * 100)}%` }} /></div>)}<div className="share-price-card"><span>{company.sharesOutstanding > 0 ? `주주가치 ÷ 희석주식수 ${company.sharesOutstanding.toLocaleString()}백만주` : "희석주식수를 입력하면 주당가치를 계산합니다."}</span><strong>{company.sharesOutstanding > 0 ? money(bridge.impliedSharePrice) : "—"}</strong><small>DCF 기준 주당가치</small></div></div></section>}
    {summary.valid.length > 0 && <section id="football" className="panel section-panel detail-panel"><div className="section-heading"><div><p className="section-kicker">08 · 가치범위 비교</p><h2>방법별 가치범위</h2><p>저점·중앙값·고점과 현재 주가를 비교합니다. (Football Field)</p></div></div><FootballField ranges={summary.valid} currentPrice={company.currentSharePrice} medianValue={summary.median} /></section>}
  </>;
}
