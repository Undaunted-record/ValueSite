"use client";

import { AssumptionSlider } from "./AssumptionSlider";
import { DEFAULT_ASSUMPTIONS } from "@/data/demo";
import { calculatePeerMultiples, calculateStats } from "@/lib/valuation/tradingComps";
import { useValuationStore } from "@/store/useValuationStore";

export function TradingComps() {
  const { peers, setPeers, assumptions, updateAssumption, methods } = useValuationStore();
  if (!methods.includes("tradingComps")) return null;
  const multiples = calculatePeerMultiples(peers);
  const stats = calculateStats(multiples.map((peer) => peer.evEbitda));
  const discount = stats.median ? assumptions.targetEvEbitda / stats.median - 1 : 0;

  const updatePeer = (index: number, key: string, value: string | number) => setPeers(peers.map((peer, current) => current === index ? { ...peer, [key]: value } : peer));
  const addPeer = () => setPeers([...peers, { id: crypto.randomUUID(), company: "신규 Peer", enterpriseValue: 0, marketCap: 0, revenue: 0, ebitda: 0, ebit: 0, netIncome: 0 }]);

  return (
    <section id="comps" className="panel section-panel">
      <div className="section-heading"><div><p className="section-kicker">04 · TRADING COMPS</p><h2>시장 멀티플로 교차 검증하세요</h2><p>Peer 정보를 입력하면 멀티플과 분포 통계가 자동으로 계산됩니다.</p></div><button className="secondary-button" onClick={addPeer}>+ Peer 추가</button></div>
      <div className="table-wrap">
        <table className="comps-table">
          <thead><tr><th>기업명</th><th>EV</th><th>시가총액</th><th>매출액</th><th>EBITDA</th><th>EBIT</th><th>당기순이익</th><th>EV/Revenue</th><th>EV/EBITDA</th><th>P/E</th></tr></thead>
          <tbody>{peers.map((peer, index) => <tr key={peer.id}>
            <td><input value={peer.company} onChange={(event) => updatePeer(index, "company", event.target.value)} /></td>
            {(["enterpriseValue", "marketCap", "revenue", "ebitda", "ebit", "netIncome"] as const).map((key) => <td key={key}><input type="number" value={peer[key]} onChange={(event) => updatePeer(index, key, Number(event.target.value))} /></td>)}
            <td>{multiples[index]?.evRevenue?.toFixed(1) ?? "—"}x</td><td>{multiples[index]?.evEbitda?.toFixed(1) ?? "—"}x</td><td>{multiples[index]?.pe?.toFixed(1) ?? "—"}x</td>
          </tr>)}</tbody>
        </table>
      </div>
      <div className="stats-grid">{([ ["최솟값", stats.min], ["25% 분위", stats.q1], ["중앙값", stats.median], ["평균", stats.mean], ["75% 분위", stats.q3], ["최댓값", stats.max] ] as const).map(([label, value]) => <div key={label}><small>{label}</small><strong>{value.toFixed(1)}x</strong></div>)}</div>
      <div className="comps-bottom">
        <AssumptionSlider label="선택 EV / EBITDA" value={assumptions.targetEvEbitda} defaultValue={DEFAULT_ASSUMPTIONS.targetEvEbitda} min={3} max={15} step={0.1} suffix="x" onChange={(value) => updateAssumption("targetEvEbitda", value)} />
        <div className="why-card"><p className="section-kicker">이 멀티플을 적용한 이유</p><div><span>Peer 중앙값<strong>{stats.median.toFixed(1)}x</strong></span><span>선택값<strong>{assumptions.targetEvEbitda.toFixed(1)}x</strong></span><span>프리미엄 / 할인<strong className={discount >= 0 ? "positive" : "negative"}>{discount >= 0 ? "+" : ""}{(discount * 100).toFixed(1)}%</strong></span></div><p>선택한 멀티플은 Peer 중앙값 대비 <b>{Math.abs(discount * 100).toFixed(1)}% {discount >= 0 ? "프리미엄" : "할인"}</b>을 반영합니다.</p></div>
      </div>
    </section>
  );
}
