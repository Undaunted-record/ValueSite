"use client";

import { useEffect, useState } from "react";
import { DEFAULT_ASSUMPTIONS } from "@/data/demo";
import { dartClient } from "@/lib/dart/client";
import { calculatePeerMultiples, calculateStats } from "@/lib/valuation/tradingComps";
import { useValuationStore } from "@/store/useValuationStore";
import type { PeerCompany } from "@/types/valuation";
import { AssumptionSlider } from "./AssumptionSlider";
import { NumberInput } from "./NumberInput";
import { PeerCompanySearch } from "./PeerCompanySearch";

const numericFields = [
  ["marketCap", "시가총액"], ["enterpriseValue", "EV"], ["revenue", "매출액"], ["ebitda", "EBITDA"],
  ["ebit", "EBIT"], ["netIncome", "당기순이익"], ["bookValue", "자기자본"],
] as const;

export function TradingComps() {
  const { peers, setPeers, resetPeers, assumptions, updateAssumption, methods, dataSource } = useValuationStore();
  const [deleted, setDeleted] = useState<{ peer: PeerCompany; index: number } | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [loadingPeer, setLoadingPeer] = useState<string | null>(null);
  const [validOnly, setValidOnly] = useState(false);
  const [sortDescending, setSortDescending] = useState(false);
  useEffect(() => { if (!focusId) return; document.querySelector<HTMLInputElement>(`[data-peer-id="${focusId}"]`)?.focus(); setFocusId(null); }, [focusId, peers.length]);
  if (!methods.includes("tradingComps")) return null;

  const multiples = calculatePeerMultiples(peers);
  const stats = calculateStats(multiples.map((peer) => peer.evEbitda));
  const validCount = multiples.filter((peer) => peer.evEbitda !== null).length;
  const discount = stats.median ? assumptions.targetEvEbitda / stats.median - 1 : 0;
  const rows = peers.map((peer, index) => ({ peer, index, multiple: multiples[index] }))
    .filter(({ multiple }) => !validOnly || multiple.evEbitda !== null)
    .sort((a, b) => sortDescending ? (b.multiple.evEbitda ?? -Infinity) - (a.multiple.evEbitda ?? -Infinity) : a.index - b.index);

  const updatePeer = (index: number, key: keyof PeerCompany, value: string | number) => setPeers(peers.map((peer, current) => {
    if (current !== index) return peer;
    const next = { ...peer, [key]: value, source: "user" as const, missingFields: peer.missingFields?.filter((field) => field !== key) };
    if (key === "marketCap") next.enterpriseValue = Number(value) > 0 ? Number(value) + (peer.debt ?? 0) - (peer.cash ?? 0) : 0;
    return next;
  }));
  const addPeer = () => { const id = crypto.randomUUID(); setPeers([...peers, { id, company: "신규 비교기업", enterpriseValue: 0, marketCap: 0, revenue: 0, ebitda: 0, ebit: 0, netIncome: 0, source: "user" }]); setFocusId(id); };
  const removePeer = (index: number) => { setDeleted({ peer: peers[index], index }); setPeers(peers.filter((_, current) => current !== index)); };
  const undo = () => { if (!deleted) return; const next = [...peers]; next.splice(deleted.index, 0, deleted.peer); setPeers(next); setDeleted(null); };
  const reloadPeer = async (index: number) => {
    const peer = peers[index]; if (!peer.corpCode) return;
    setLoadingPeer(peer.id);
    try {
      const financials = await dartClient.getFinancials(peer.corpCode);
      const latest = financials.financials.at(-1)!;
      const next: PeerCompany = {
        ...peer, revenue: latest.revenue, ebit: latest.ebit, netIncome: latest.netIncome,
        ebitda: financials.da === undefined ? peer.ebitda : latest.ebit + financials.da,
        bookValue: financials.bookValue ?? peer.bookValue, cash: financials.cash ?? peer.cash, debt: financials.debt ?? peer.debt,
        financialYear: latest.year, statementType: financials.metadata.statementType, fetchedAt: financials.metadata.fetchedAt, source: "dart",
        missingFields: [...financials.metadata.missingFields, ...(financials.da === undefined ? ["ebitda"] : []), ...(peer.marketCap > 0 ? [] : ["marketCap"])],
      };
      next.enterpriseValue = peer.marketCap > 0 ? peer.marketCap + (next.debt ?? 0) - (next.cash ?? 0) : 0;
      setPeers(peers.map((item, current) => current === index ? next : item));
    } finally { setLoadingPeer(null); }
  };

  return <section id="comps" className="panel section-panel detail-panel">
    <div className="section-heading"><div><p className="section-kicker">05 · 유사기업 비교</p><h2>비교기업 멀티플</h2><p>OpenDART 재무정보와 사용자가 입력한 시가총액으로 멀티플을 계산합니다.</p></div><div className="section-actions">{dataSource === "demo" && <span className="source-badge demo">예시 비교기업</span>}<button className="primary-button" onClick={() => setShowSearch(true)}>기업 검색</button><button className="secondary-button" onClick={addPeer}>직접 추가</button><button className="text-button reset-all" onClick={resetPeers}>전체 초기화</button></div></div>
    {showSearch && <PeerCompanySearch existingCorpCodes={peers.map((peer) => peer.corpCode ?? "").filter(Boolean)} onClose={() => setShowSearch(false)} onAdd={(peer) => { setPeers([...peers, peer]); setShowSearch(false); }} />}
    <div className="market-data-note"><strong>시장가격 데이터</strong><span>OpenDART에는 현재 주가와 시가총액이 없습니다. 시가총액을 입력하면 EV = 시가총액 + 차입금 − 현금으로 자동 계산합니다.</span></div>
    <div className="peer-toolbar"><span className={validCount < 3 ? "warning" : ""}>{validCount >= 3 ? `유효 비교기업 ${validCount}개` : `유효 비교기업 ${validCount}개 · 3개 이상 권장`}</span><label><input type="checkbox" checked={validOnly} onChange={(event) => setValidOnly(event.target.checked)} /> 유효값만 보기</label><button className="text-button" onClick={() => setSortDescending((value) => !value)}>EV/EBITDA {sortDescending ? "내림차순" : "정렬"}</button></div>
    {deleted && <div className="undo-toast" role="status"><span>{deleted.peer.company}을(를) 삭제했습니다.</span><button onClick={undo}>되돌리기</button></div>}
    <div className="table-scroll-hint">표를 좌우로 이동해 모든 항목을 확인할 수 있습니다.</div>
    <div className="table-wrap desktop-comps-table"><table className="comps-table"><thead><tr><th>기업명 / 기준</th>{numericFields.map(([, label]) => <th key={label}>{label}</th>)}<th>EV/매출액</th><th>EV/EBITDA</th><th>P/E</th><th>P/B</th><th>관리</th></tr></thead><tbody>{rows.map(({ peer, index, multiple }) => <tr key={peer.id}><td><input data-peer-id={peer.id} aria-label={`비교기업 ${index + 1} 기업명`} value={peer.company} onChange={(event) => updatePeer(index, "company", event.target.value)} /><small>{peer.financialYear ?? "기준연도 미입력"} · {peer.statementType === "CFS" ? "연결" : peer.statementType === "OFS" ? "별도" : "사용자 입력"}</small></td>{numericFields.map(([key, label]) => <td key={key} title={key === "ebitda" && peer.missingFields?.includes("ebitda") ? "D&A를 확인하지 못해 직접 입력이 필요합니다." : undefined}><NumberInput ariaLabel={`${peer.company} ${label} 십억원`} showBlankWhenZero={Boolean(peer.missingFields?.includes(key))} value={Number(peer[key] ?? 0)} onChange={(value) => updatePeer(index, key, value)} /></td>)}<td>{multiple.evRevenue?.toFixed(1) ?? "제외"}{multiple.evRevenue !== null && "x"}</td><td title={multiple.evEbitda === null ? "EBITDA가 0 이하이거나 EV가 없어 제외됩니다." : undefined}>{multiple.evEbitda?.toFixed(1) ?? "제외"}{multiple.evEbitda !== null && "x"}</td><td>{multiple.pe?.toFixed(1) ?? "제외"}{multiple.pe !== null && "x"}</td><td>{multiple.pb?.toFixed(1) ?? "제외"}{multiple.pb !== null && "x"}</td><td><div className="peer-controls">{peer.corpCode && <button className="text-button" disabled={loadingPeer === peer.id} onClick={() => void reloadPeer(index)}>{loadingPeer === peer.id ? "불러오는 중" : "갱신"}</button>}<button className="remove-peer" aria-label={`${peer.company} 삭제`} onClick={() => removePeer(index)}>삭제</button></div></td></tr>)}</tbody></table></div>
    <div className="mobile-peer-cards">{rows.map(({ peer, index, multiple }) => <article key={peer.id}><div className="peer-card-head"><div><input data-peer-id={peer.id} aria-label={`비교기업 ${index + 1} 기업명`} value={peer.company} onChange={(event) => updatePeer(index, "company", event.target.value)} /><small>{peer.financialYear ?? "기준연도 미입력"} · {peer.source === "dart" ? "OpenDART" : "사용자 입력"}</small></div><button className="remove-peer" aria-label={`${peer.company} 삭제`} onClick={() => removePeer(index)}>삭제</button></div><div className="peer-key-multiples"><span>EV/EBITDA <strong>{multiple.evEbitda?.toFixed(1) ?? "제외"}{multiple.evEbitda !== null && "x"}</strong></span><span>P/E <strong>{multiple.pe?.toFixed(1) ?? "제외"}{multiple.pe !== null && "x"}</strong></span></div>{peer.missingFields?.length ? <p className="peer-missing">확인 필요: {peer.missingFields.includes("marketCap") ? "시가총액" : ""}{peer.missingFields.includes("ebitda") ? " · EBITDA" : ""}</p> : null}{peer.corpCode && <button className="secondary-button peer-refresh" disabled={loadingPeer === peer.id} onClick={() => void reloadPeer(index)}>공시 다시 불러오기</button>}<details><summary>상세 입력</summary><div className="peer-input-grid">{numericFields.map(([key, label]) => <label key={key}>{label}<div className="number-with-suffix"><NumberInput ariaLabel={`${peer.company} ${label} 십억원`} showBlankWhenZero={Boolean(peer.missingFields?.includes(key))} value={Number(peer[key] ?? 0)} onChange={(value) => updatePeer(index, key, value)} /><span>십억원</span></div></label>)}</div></details></article>)}</div>
    <div className="stats-grid">{([ ["최솟값", stats.min], ["25% 분위", stats.q1], ["중앙값", stats.median], ["평균", stats.mean], ["75% 분위", stats.q3], ["최댓값", stats.max] ] as const).map(([label, value]) => <div key={label}><small>{label}</small><strong>{validCount ? `${value.toFixed(1)}x` : "—"}</strong></div>)}</div>
    <div className="comps-bottom"><AssumptionSlider label="선택 EV / EBITDA" description="유사기업 중앙값을 참고해 적용할 배수를 선택합니다." value={assumptions.targetEvEbitda} defaultValue={DEFAULT_ASSUMPTIONS.targetEvEbitda} min={3} max={15} step={0.1} suffix="x" onChange={(value) => updateAssumption("targetEvEbitda", value)} /><div className="why-card"><p className="section-kicker">적용 배수 검토</p><div><span>비교기업 중앙값<strong>{validCount ? `${stats.median.toFixed(1)}x` : "—"}</strong></span><span>선택값<strong>{assumptions.targetEvEbitda.toFixed(1)}x</strong></span><span>프리미엄·할인<strong className={discount >= 0 ? "positive" : "negative"}>{validCount ? `${discount >= 0 ? "+" : ""}${(discount * 100).toFixed(1)}%` : "—"}</strong></span></div></div></div>
  </section>;
}
