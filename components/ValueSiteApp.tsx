"use client";

import { useState } from "react";
import { AssumptionsPanel } from "./AssumptionsPanel";
import { FinancialInputs } from "./FinancialInputs";
import { MethodSelector } from "./MethodSelector";
import { AnalysisDetails, ResultsDashboard } from "./ResultsDashboard";
import { TradingComps } from "./TradingComps";
import { useValuationStore } from "@/store/useValuationStore";
import { assessMethodReadiness } from "@/lib/valuation/readiness";

export function ValueSiteApp() {
  const [mobileStage, setMobileStage] = useState<"input" | "assumptions" | "results">("input");
  const { mode, setMode, company, dataSource, dartImport, methods, assumptions, peers, terminalMethod, loadDemo, reset } = useValuationStore();
  const readiness = assessMethodReadiness(company, assumptions, peers, terminalMethod);
  const dcfReady = methods.includes("dcf") && Boolean(readiness.find((item) => item.method === "dcf")?.ready);
  const hasRange = company.sharesOutstanding > 0 && readiness.some((item) => methods.includes(item.method) && item.ready);
  const nav = [
    ["01", "financials", "기업·재무정보"], ["02", "methods", "평가 방법"], ["03", "assumptions", "전망 및 가정"], ["04", "summary", "결과 요약"],
    ...(methods.includes("tradingComps") ? [["05", "comps", "유사기업 비교"]] : []),
    ...(dcfReady ? [["06", "dcf-details", "DCF 상세 분석"], ["07", "bridge", "EV → 주주가치"]] : []),
    ...(hasRange ? [["08", "football", "가치범위 비교"]] : []),
  ];
  const goTo = (id: string) => requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }));
  const startNew = () => { reset(); setMobileStage("input"); goTo("financials"); };
  const openDemo = () => { loadDemo(); setMobileStage("results"); goTo("summary"); };
  const goStage = (stage: typeof mobileStage, id: string) => { setMobileStage(stage); goTo(id); };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#top"><span>V</span><strong>ValueSite</strong></a>
        <nav aria-label="주요 단계">{nav.map(([number, id, label]) => <a href={`#${id}`} key={id}><i>{number}</i>{label}</a>)}</nav>
        <div className="sidebar-note"><span>교육·분석용 도구</span><p>결과는 입력값과 가정에 따른 분석 자료이며 투자 권유가 아닙니다.</p></div>
      </aside>
      <main className={`main-area mobile-stage-${mobileStage}`} id="top">
        <header className="topbar">
          <div><small>분석 대상기업</small><strong>{company.name || "새 밸류에이션"}</strong></div>
          <div className="topbar-actions"><span className={`source-badge ${dataSource}`}>{dataSource === "demo" ? "샘플 데이터" : dataSource === "dart" ? "OpenDART 공시" : dataSource === "user" ? "사용자 입력" : "입력 전"}</span><div className="mode-toggle" aria-label="밸류에이션 모드"><button aria-pressed={mode === "quick"} className={mode === "quick" ? "active" : ""} onClick={() => setMode("quick")}>간편</button><button aria-pressed={mode === "advanced"} className={mode === "advanced" ? "active" : ""} onClick={() => setMode("advanced")}>고급</button></div></div>
        </header>
        <section className="workspace-header">
          <div><p className="eyebrow">VALUATION WORKSPACE</p><h1>{company.name || "새 기업 분석"}</h1><p>{company.ticker || "종목코드 없음"} · {company.industry}</p></div>
          <div className="workspace-actions"><button className="primary-button" onClick={startNew}>새 분석</button><button className="secondary-button" onClick={openDemo}>샘플 보기</button></div>
          <dl><div><dt>데이터 기준</dt><dd>{dartImport ? `${dartImport.latestYear}년 사업보고서` : "직접 입력"}</dd></div><div><dt>재무제표</dt><dd>{dartImport ? (dartImport.statementType === "CFS" ? "연결" : "별도") : "—"}</dd></div><div><dt>마지막 갱신</dt><dd>{dartImport ? new Date(dartImport.fetchedAt).toLocaleDateString("ko-KR") : "—"}</dd></div><div><dt>저장 상태</dt><dd>이 브라우저에 자동 저장</dd></div></dl>
        </section>
        <div className="mobile-toolbar"><div className="mobile-mode"><span>{mode === "quick" ? "간편 모드 · 핵심 가정" : "고급 모드 · 세부 가정"}</span><div className="mode-toggle"><button aria-pressed={mode === "quick"} className={mode === "quick" ? "active" : ""} onClick={() => setMode("quick")}>간편</button><button aria-pressed={mode === "advanced"} className={mode === "advanced" ? "active" : ""} onClick={() => setMode("advanced")}>고급</button></div></div><nav className="mobile-steps" aria-label="모바일 단계 이동"><button className={mobileStage === "input" ? "active" : ""} aria-pressed={mobileStage === "input"} onClick={() => goStage("input", "financials")}>입력</button><button className={mobileStage === "assumptions" ? "active" : ""} aria-pressed={mobileStage === "assumptions"} onClick={() => goStage("assumptions", "assumptions")}>가정</button><button className={mobileStage === "results" ? "active" : ""} aria-pressed={mobileStage === "results"} onClick={() => goStage("results", "summary")}>결과</button></nav></div>
        <div className="workflow-label input-label">입력과 가정</div>
        <FinancialInputs /><MethodSelector /><AssumptionsPanel />
        <div className="workflow-label results-label">결과와 상세 분석</div>
        <ResultsDashboard /><TradingComps /><AnalysisDetails />
        <footer><strong>ValueSite</strong><span>입력값과 가정에 기반한 교육·분석용 도구입니다.</span><small>© 2026</small></footer>
      </main>
    </div>
  );
}
