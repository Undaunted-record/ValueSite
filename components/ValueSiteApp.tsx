"use client";

import { AssumptionsPanel } from "./AssumptionsPanel";
import { FinancialInputs } from "./FinancialInputs";
import { MethodSelector } from "./MethodSelector";
import { ResultsDashboard } from "./ResultsDashboard";
import { TradingComps } from "./TradingComps";
import { useValuationStore } from "@/store/useValuationStore";

const nav = [["summary", "대시보드"], ["financials", "기업·재무정보"], ["methods", "밸류에이션 방법"], ["dcf", "DCF·주요 가정"], ["comps", "비교기업 분석"], ["bridge", "EV 브리지"], ["football", "가치범위 비교"]];

export function ValueSiteApp() {
  const { mode, setMode, company, loadDemo } = useValuationStore();
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#top"><span>V</span><strong>ValueSite</strong></a>
        <nav>{nav.map(([id, label], index) => <a href={`#${id}`} key={id}><i>{String(index + 1).padStart(2, "0")}</i>{label}</a>)}</nav>
        <div className="sidebar-note"><span>교육·분석용 도구</span><p>밸류에이션 결과는 학습과 분석을 위한 자료이며 투자 권유가 아닙니다.</p></div>
      </aside>
      <main className="main-area" id="top">
        <header className="topbar">
          <div><small>분석 대상기업</small><strong>{company.name || "새 밸류에이션"}</strong></div>
          <div className="mode-toggle"><button className={mode === "quick" ? "active" : ""} onClick={() => setMode("quick")}>간편</button><button className={mode === "advanced" ? "active" : ""} onClick={() => setMode("advanced")}>고급</button></div>
        </header>
        <section className="landing">
          <div className="landing-copy"><p className="eyebrow">무료 인터랙티브 IB 밸류에이션 대시보드</p><h1>기업가치를 계산하고,<br /><span>가정을 검증하세요.</span></h1><p>몇 가지 핵심 재무정보만 입력하면 가치 범위를 계산할 수 있습니다. 주요 가정을 조정하고 모든 결과가 실시간으로 변하는 과정을 확인하세요.</p><div><a className="primary-button" href="#financials">밸류에이션 시작</a><button className="ghost-button" onClick={loadDemo}>데모 체험</button></div></div>
          <div className="landing-card"><span className="live-dot">실시간 밸류에이션</span><div className="mini-price"><small>주당가치</small><strong>₩54,200 <em>+27.5%</em></strong></div><div className="mini-field"><i /><i /><i /><i /></div><div className="feature-tags"><span>DCF</span><span>비교기업 분석</span><span>EV 브리지</span><span>가치범위 비교</span></div></div>
        </section>
        <div className="mobile-mode"><span>밸류에이션 모드</span><div className="mode-toggle"><button className={mode === "quick" ? "active" : ""} onClick={() => setMode("quick")}>간편</button><button className={mode === "advanced" ? "active" : ""} onClick={() => setMode("advanced")}>고급</button></div></div>
        <ResultsDashboard />
        <FinancialInputs />
        <MethodSelector />
        <AssumptionsPanel />
        <TradingComps />
        <footer><strong>ValueSite</strong><span>기업가치를 계산하고, 가정을 검증하세요.</span><small>© 2026 · 교육 및 분석 목적으로만 제공됩니다.</small></footer>
      </main>
    </div>
  );
}
