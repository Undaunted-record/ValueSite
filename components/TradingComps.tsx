"use client";

import { useEffect, useState } from "react";
import { AssumptionSlider } from "./AssumptionSlider";
import { NumberInput } from "./NumberInput";
import { DEFAULT_ASSUMPTIONS } from "@/data/demo";
import { calculatePeerMultiples, calculateStats } from "@/lib/valuation/tradingComps";
import { useValuationStore } from "@/store/useValuationStore";
import type { PeerCompany } from "@/types/valuation";

const numericFields = [
  ["enterpriseValue", "EV"], ["marketCap", "시가총액"], ["revenue", "매출액"], ["ebitda", "EBITDA"], ["ebit", "EBIT"], ["netIncome", "당기순이익"],
] as const;

export function TradingComps() {
  const { peers, setPeers, resetPeers, assumptions, updateAssumption, methods, dataSource } = useValuationStore();
  const [deleted, setDeleted] = useState<{ peer: PeerCompany; index: number } | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  useEffect(() => { if (!focusId) return; document.querySelector<HTMLInputElement>(`[data-peer-id="${focusId}"]`)?.focus(); setFocusId(null); }, [focusId, peers.length]);
  if (!methods.includes("tradingComps")) return null;
  const multiples = calculatePeerMultiples(peers);
  const stats = calculateStats(multiples.map((peer) => peer.evEbitda));
  const validCount = multiples.filter((peer) => peer.evEbitda !== null).length;
  const discount = stats.median ? assumptions.targetEvEbitda / stats.median - 1 : 0;
  const updatePeer = (index: number, key: keyof PeerCompany, value: string | number) => setPeers(peers.map((peer, current) => current === index ? { ...peer, [key]: value } : peer));
  const addPeer = () => { const id = crypto.randomUUID(); setPeers([...peers, { id, company: "신규 비교기업", enterpriseValue: 0, marketCap: 0, revenue: 0, ebitda: 0, ebit: 0, netIncome: 0 }]); setFocusId(id); };
  const removePeer = (index: number) => { setDeleted({ peer: peers[index], index }); setPeers(peers.filter((_, current) => current !== index)); };
  const undo = () => { if (!deleted) return; const next = [...peers]; next.splice(deleted.index, 0, deleted.peer); setPeers(next); setDeleted(null); };

  return (
    <section id="comps" className="panel section-panel detail-panel">
      <div className="section-heading"><div><p className="section-kicker">08 · 유사기업 비교</p><h2>시장 멀티플로 교차 검증하세요</h2><p>유효한 비교기업의 EV/EBITDA 분포를 자동 계산합니다.</p></div><div className="section-actions">{dataSource === "demo" && <span className="source-badge demo">예시 비교기업</span>}<button className="secondary-button" onClick={addPeer}>비교기업 추가</button><button className="text-button reset-all" onClick={resetPeers}>비교기업 초기화</button></div></div>
      <div className={`peer-count ${validCount < 3 ? "warning" : ""}`}>{validCount >= 3 ? `유효 비교기업 ${validCount}개` : `유효 비교기업 ${validCount}개 · 신뢰도 있는 분포를 위해 3개 이상을 권장합니다.`}</div>
      {deleted && <div className="undo-toast" role="status"><span>{deleted.peer.company}을(를) 삭제했습니다.</span><button onClick={undo}>되돌리기</button></div>}
      <div className="table-scroll-hint">표를 좌우로 이동해 모든 항목을 확인할 수 있습니다.</div>
      <div className="table-wrap desktop-comps-table"><table className="comps-table"><thead><tr><th>기업명</th>{numericFields.map(([, label]) => <th key={label}>{label}</th>)}<th>EV/매출액</th><th>EV/EBITDA</th><th>P/E</th><th>관리</th></tr></thead><tbody>{peers.map((peer, index) => <tr key={peer.id}><td><input data-peer-id={peer.id} aria-label={`비교기업 ${index + 1} 기업명`} value={peer.company} onChange={(event) => updatePeer(index, "company", event.target.value)} /></td>{numericFields.map(([key, label]) => <td key={key}><NumberInput ariaLabel={`${peer.company} ${label} 십억원`} value={peer[key]} onChange={(value) => updatePeer(index, key, value)} /></td>)}<td title={multiples[index]?.evRevenue === null ? "매출액이 0 이하이므로 통계에서 제외됩니다." : undefined}>{multiples[index]?.evRevenue?.toFixed(1) ?? "제외"}{multiples[index]?.evRevenue !== null && "x"}</td><td title={multiples[index]?.evEbitda === null ? "EBITDA가 0 이하이므로 통계에서 제외됩니다." : undefined}>{multiples[index]?.evEbitda?.toFixed(1) ?? "제외"}{multiples[index]?.evEbitda !== null && "x"}</td><td title={multiples[index]?.pe === null ? "순이익이 0 이하이므로 통계에서 제외됩니다." : undefined}>{multiples[index]?.pe?.toFixed(1) ?? "제외"}{multiples[index]?.pe !== null && "x"}</td><td><button className="remove-peer" aria-label={`${peer.company} 삭제`} onClick={() => removePeer(index)}>삭제</button></td></tr>)}</tbody></table></div>
      <div className="mobile-peer-cards">{peers.map((peer, index) => <article key={peer.id}><div className="peer-card-head"><input data-peer-id={peer.id} aria-label={`비교기업 ${index + 1} 기업명`} value={peer.company} onChange={(event) => updatePeer(index, "company", event.target.value)} /><button className="remove-peer" aria-label={`${peer.company} 삭제`} onClick={() => removePeer(index)}>삭제</button></div><div className="peer-key-multiples"><span>EV/EBITDA <strong>{multiples[index]?.evEbitda?.toFixed(1) ?? "제외"}{multiples[index]?.evEbitda !== null && "x"}</strong></span><span>P/E <strong>{multiples[index]?.pe?.toFixed(1) ?? "제외"}{multiples[index]?.pe !== null && "x"}</strong></span></div><details><summary>상세 입력</summary><div className="peer-input-grid">{numericFields.map(([key, label]) => <label key={key}>{label}<div className="number-with-suffix"><NumberInput ariaLabel={`${peer.company} ${label} 십억원`} value={peer[key]} onChange={(value) => updatePeer(index, key, value)} /><span>십억원</span></div></label>)}</div></details></article>)}</div>
      <div className="stats-grid">{([ ["최솟값", stats.min], ["25% 분위", stats.q1], ["중앙값", stats.median], ["평균", stats.mean], ["75% 분위", stats.q3], ["최댓값", stats.max] ] as const).map(([label, value]) => <div key={label}><small>{label}</small><strong>{validCount ? `${value.toFixed(1)}x` : "—"}</strong></div>)}</div>
      <div className="comps-bottom"><AssumptionSlider label="선택 EV / EBITDA" description="유사기업 중앙값을 참고해 적용할 배수를 선택합니다." value={assumptions.targetEvEbitda} defaultValue={DEFAULT_ASSUMPTIONS.targetEvEbitda} min={3} max={15} step={0.1} suffix="x" onChange={(value) => updateAssumption("targetEvEbitda", value)} /><div className="why-card"><p className="section-kicker">이 멀티플을 적용한 이유</p><div><span>비교기업 중앙값<strong>{validCount ? `${stats.median.toFixed(1)}x` : "—"}</strong></span><span>선택값<strong>{assumptions.targetEvEbitda.toFixed(1)}x</strong></span><span>프리미엄·할인<strong className={discount >= 0 ? "positive" : "negative"}>{validCount ? `${discount >= 0 ? "+" : ""}${(discount * 100).toFixed(1)}%` : "—"}</strong></span></div><p>{validCount ? `선택값은 비교기업 중앙값 대비 ${Math.abs(discount * 100).toFixed(1)}% ${discount >= 0 ? "프리미엄" : "할인"}을 반영합니다.` : "유효한 비교기업을 입력하면 선택 배수의 근거가 표시됩니다."}</p></div></div>
    </section>
  );
}
