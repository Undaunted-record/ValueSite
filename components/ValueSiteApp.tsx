"use client";

import { useState } from "react";
import { AssumptionsPanel } from "./AssumptionsPanel";
import { FinancialInputs } from "./FinancialInputs";
import { MethodSelector } from "./MethodSelector";
import { ResultsDashboard } from "./ResultsDashboard";
import { TradingComps } from "./TradingComps";
import { hasValuationInput } from "@/lib/valuation/summary";
import { useValuationStore } from "@/store/useValuationStore";

export function ValueSiteApp() {
  const [mobileStage, setMobileStage] = useState<"input" | "assumptions" | "results">("input");
  const { mode, setMode, company, dataSource, methods, loadDemo, reset } = useValuationStore();
  const hasInput = hasValuationInput(company);
  const nav = [
    ["financials", "기업·재무정보"], ["methods", "평가 방법"], ["dcf", "주요 가정"], ["summary", "결과 요약"],
    ...(hasInput ? [["bridge", "EV 브리지"], ["football", "가치범위 비교"]] : []),
    ...(hasInput && methods.includes("dcf") ? [["dcf-details", "DCF 상세 계산"]] : []),
    ...(methods.includes("tradingComps") ? [["comps", "유사기업 비교"]] : []),
  ];
  const goTo = (id: string) => requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }));
  const startNew = () => { reset(); setMobileStage("input"); goTo("financials"); };
  const openDemo = () => { loadDemo(); setMobileStage("results"); goTo("summary"); };
  const goStage = (stage: typeof mobileStage, id: string) => { setMobileStage(stage); goTo(id); };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#top"><span>V</span><strong>ValueSite</strong></a>
        <nav aria-label="주요 단계">{nav.map(([id, label], index) => <a href={`#${id}`} key={id}><i>{String(index + 1).padStart(2, "0")}</i>{label}</a>)}</nav>
        <div className="sidebar-note"><span>교육·분석용 도구</span><p>결과는 입력값과 가정에 따른 분석 자료이며 투자 권유가 아닙니다.</p></div>
      </aside>
      <main className={`main-area mobile-stage-${mobileStage}`} id="top">
        <header className="topbar">
          <div><small>분석 대상기업</small><strong>{company.name || "새 밸류에이션"}</strong></div>
          <div className="topbar-actions"><span className={`source-badge ${dataSource}`}>{dataSource === "demo" ? "샘플 데이터" : dataSource === "dart" ? "OpenDART 공시" : dataSource === "user" ? "사용자 입력" : "입력 전"}</span><div className="mode-toggle" aria-label="밸류에이션 모드"><button aria-pressed={mode === "quick"} className={mode === "quick" ? "active" : ""} onClick={() => setMode("quick")}>간편</button><button aria-pressed={mode === "advanced"} className={mode === "advanced" ? "active" : ""} onClick={() => setMode("advanced")}>고급</button></div></div>
        </header>
        <section className="landing">
          <div className="landing-copy"><p className="eyebrow">무료 한국어 IB 밸류에이션 대시보드</p><h1>기업가치를 계산하고,<br /><span>가정을 검증하세요.</span></h1><p>핵심 재무정보를 입력하고 여러 평가 방법을 교차 검증하세요. 계산 근거와 가정 변화가 결과에 미치는 영향을 투명하게 보여드립니다.</p><div><button className="primary-button" onClick={startNew}>내 기업 평가 시작</button><button className="ghost-button" onClick={openDemo}>샘플 분석 보기</button></div></div>
          <div className="landing-card" aria-hidden="true"><span className="live-dot">실시간 밸류에이션</span><div className="mini-price"><small>주당가치 범위</small><strong>저점 · 중앙값 · 고점</strong></div><div className="mini-field"><i /><i /><i /><i /></div><div className="feature-tags"><span>DCF</span><span>유사기업 비교</span><span>EV 브리지</span><span>가치범위 비교</span></div></div>
        </section>
        <div className="mobile-toolbar"><div className="mobile-mode"><span>{mode === "quick" ? "간편 모드 · 핵심 가정" : "고급 모드 · 세부 가정"}</span><div className="mode-toggle"><button aria-pressed={mode === "quick"} className={mode === "quick" ? "active" : ""} onClick={() => setMode("quick")}>간편</button><button aria-pressed={mode === "advanced"} className={mode === "advanced" ? "active" : ""} onClick={() => setMode("advanced")}>고급</button></div></div><nav className="mobile-steps" aria-label="모바일 단계 이동"><button className={mobileStage === "input" ? "active" : ""} aria-pressed={mobileStage === "input"} onClick={() => goStage("input", "financials")}>입력</button><button className={mobileStage === "assumptions" ? "active" : ""} aria-pressed={mobileStage === "assumptions"} onClick={() => goStage("assumptions", "dcf")}>가정</button><button className={mobileStage === "results" ? "active" : ""} aria-pressed={mobileStage === "results"} onClick={() => goStage("results", "summary")}>결과</button></nav></div>
        <div className="workflow-label input-label">입력과 가정</div>
        <FinancialInputs /><MethodSelector /><AssumptionsPanel />
        <div className="workflow-label results-label">결과와 상세 분석</div>
        <ResultsDashboard /><TradingComps />
        <footer><strong>ValueSite</strong><span>기업가치를 계산하고, 가정을 검증하세요.</span><small>© 2026 · 교육 및 분석 목적으로만 제공됩니다.</small></footer>
      </main>
    </div>
  );
}
