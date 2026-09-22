"use client";

import { AssumptionsPanel } from "./AssumptionsPanel";
import { FinancialInputs } from "./FinancialInputs";
import { MethodSelector } from "./MethodSelector";
import { ResultsDashboard } from "./ResultsDashboard";
import { TradingComps } from "./TradingComps";
import { useValuationStore } from "@/store/useValuationStore";

const nav = [["summary", "Dashboard"], ["financials", "Financials"], ["methods", "Valuation Methods"], ["dcf", "DCF & Assumptions"], ["comps", "Trading Comps"], ["bridge", "EV Bridge"], ["football", "Football Field"]];

export function ValueSiteApp() {
  const { mode, setMode, company, loadDemo } = useValuationStore();
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#top"><span>V</span><strong>ValueSite</strong></a>
        <nav>{nav.map(([id, label], index) => <a href={`#${id}`} key={id}><i>{String(index + 1).padStart(2, "0")}</i>{label}</a>)}</nav>
        <div className="sidebar-note"><span>EDUCATIONAL TOOL</span><p>Valuation outputs are for learning and analysis, not investment advice.</p></div>
      </aside>
      <main className="main-area" id="top">
        <header className="topbar">
          <div><small>ACTIVE COMPANY</small><strong>{company.name || "New Valuation"}</strong></div>
          <div className="mode-toggle"><button className={mode === "quick" ? "active" : ""} onClick={() => setMode("quick")}>Quick</button><button className={mode === "advanced" ? "active" : ""} onClick={() => setMode("advanced")}>Advanced</button></div>
        </header>
        <section className="landing">
          <div className="landing-copy"><p className="eyebrow">FREE INTERACTIVE IB VALUATION DASHBOARD</p><h1>Build the valuation.<br /><span>Defend the assumptions.</span></h1><p>Turn a few core financial inputs into a transparent valuation range. Stress-test the assumptions and see every output update live.</p><div><a className="primary-button" href="#financials">Start Valuation</a><button className="ghost-button" onClick={loadDemo}>Try Demo</button></div></div>
          <div className="landing-card"><span className="live-dot">LIVE VALUATION</span><div className="mini-price"><small>Implied Share Price</small><strong>₩54,200 <em>+27.5%</em></strong></div><div className="mini-field"><i /><i /><i /><i /></div><div className="feature-tags"><span>DCF</span><span>Trading Comps</span><span>EV Bridge</span><span>Football Field</span></div></div>
        </section>
        <div className="mobile-mode"><span>Valuation Mode</span><div className="mode-toggle"><button className={mode === "quick" ? "active" : ""} onClick={() => setMode("quick")}>Quick</button><button className={mode === "advanced" ? "active" : ""} onClick={() => setMode("advanced")}>Advanced</button></div></div>
        <ResultsDashboard />
        <FinancialInputs />
        <MethodSelector />
        <AssumptionsPanel />
        <TradingComps />
        <footer><strong>ValueSite</strong><span>Build the valuation. Defend the assumptions.</span><small>© 2026 · Educational and analytical use only.</small></footer>
      </main>
    </div>
  );
}
