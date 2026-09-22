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
  const addPeer = () => setPeers([...peers, { id: crypto.randomUUID(), company: "New Peer", enterpriseValue: 0, marketCap: 0, revenue: 0, ebitda: 0, ebit: 0, netIncome: 0 }]);

  return (
    <section id="comps" className="panel section-panel">
      <div className="section-heading"><div><p className="section-kicker">04 · TRADING COMPS</p><h2>Market-based cross-check</h2><p>Enter peers directly. Multiples and distribution statistics calculate automatically.</p></div><button className="secondary-button" onClick={addPeer}>+ Add Peer</button></div>
      <div className="table-wrap">
        <table className="comps-table">
          <thead><tr><th>Company</th><th>EV</th><th>Market Cap</th><th>Revenue</th><th>EBITDA</th><th>EBIT</th><th>Net Income</th><th>EV/Revenue</th><th>EV/EBITDA</th><th>P/E</th></tr></thead>
          <tbody>{peers.map((peer, index) => <tr key={peer.id}>
            <td><input value={peer.company} onChange={(event) => updatePeer(index, "company", event.target.value)} /></td>
            {(["enterpriseValue", "marketCap", "revenue", "ebitda", "ebit", "netIncome"] as const).map((key) => <td key={key}><input type="number" value={peer[key]} onChange={(event) => updatePeer(index, key, Number(event.target.value))} /></td>)}
            <td>{multiples[index]?.evRevenue?.toFixed(1) ?? "—"}x</td><td>{multiples[index]?.evEbitda?.toFixed(1) ?? "—"}x</td><td>{multiples[index]?.pe?.toFixed(1) ?? "—"}x</td>
          </tr>)}</tbody>
        </table>
      </div>
      <div className="stats-grid">{([ ["Minimum", stats.min], ["25th percentile", stats.q1], ["Median", stats.median], ["Mean", stats.mean], ["75th percentile", stats.q3], ["Maximum", stats.max] ] as const).map(([label, value]) => <div key={label}><small>{label}</small><strong>{value.toFixed(1)}x</strong></div>)}</div>
      <div className="comps-bottom">
        <AssumptionSlider label="Selected EV / EBITDA" value={assumptions.targetEvEbitda} defaultValue={DEFAULT_ASSUMPTIONS.targetEvEbitda} min={3} max={15} step={0.1} suffix="x" onChange={(value) => updateAssumption("targetEvEbitda", value)} />
        <div className="why-card"><p className="section-kicker">WHY THIS MULTIPLE?</p><div><span>Peer Median<strong>{stats.median.toFixed(1)}x</strong></span><span>Selected<strong>{assumptions.targetEvEbitda.toFixed(1)}x</strong></span><span>Premium / Discount<strong className={discount >= 0 ? "positive" : "negative"}>{discount >= 0 ? "+" : ""}{(discount * 100).toFixed(1)}%</strong></span></div><p>The selected multiple represents a <b>{Math.abs(discount * 100).toFixed(1)}% {discount >= 0 ? "premium" : "discount"}</b> to the peer median.</p></div>
      </div>
    </section>
  );
}
