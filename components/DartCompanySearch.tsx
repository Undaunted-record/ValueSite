"use client";

import { useEffect, useId, useRef, useState } from "react";
import { dartClient } from "@/lib/dart/client";
import type { DartCompanyOverview, DartCompanyRecord, NormalizedDartFinancials } from "@/lib/dart/types";
import { useValuationStore } from "@/store/useValuationStore";

type PendingImport = { overview: DartCompanyOverview; financials: NormalizedDartFinancials };

export function DartCompanySearch() {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const { company, dataSource, dartImport, applyDartImport } = useValuationStore();
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DartCompanyRecord[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [status, setStatus] = useState<"idle" | "searching" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState<PendingImport | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    dartClient.status(controller.signal).then((value) => setConfigured(value.configured)).catch(() => setConfigured(false));
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const compact = query.replace(/\s+/g, "");
    const minimum = /[가-힣]/.test(compact) ? 2 : 3;
    if (!configured || compact.length < minimum) {
      setResults([]);
      setActiveIndex(-1);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setStatus("searching");
      setMessage("");
      try {
        const matches = await dartClient.searchCompanies(query, controller.signal);
        setResults(matches);
        setActiveIndex(matches.length ? 0 : -1);
        setMessage(matches.length ? "" : "일치하는 상장기업을 찾지 못했습니다.");
        setStatus("idle");
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        setResults([]);
        setStatus("error");
        setMessage(error instanceof Error ? error.message : "기업을 검색하지 못했습니다.");
      }
    }, 300);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [configured, query]);

  async function loadCompany(match: DartCompanyRecord) {
    setResults([]);
    setStatus("loading");
    setMessage(`${match.corpName} 공시를 불러오는 중입니다.`);
    try {
      const [overview, financials] = await Promise.all([
        dartClient.getCompany(match.corpCode),
        dartClient.getFinancials(match.corpCode),
      ]);
      const loaded = { overview, financials };
      const hasUserData = dataSource !== "empty" && (company.name.length > 0 || company.financials.some((period) => period.revenue || period.ebit || period.netIncome));
      if (hasUserData) setPending(loaded);
      else applyImport(loaded, true);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "기업 정보를 불러오지 못했습니다.");
    }
  }

  function applyImport(loaded: PendingImport, includeIdentity: boolean) {
    applyDartImport(loaded.overview, loaded.financials, includeIdentity);
    setPending(null);
    setQuery(loaded.overview.corpName);
    setStatus("idle");
    setMessage("OpenDART 공시 실적을 반영했습니다. 전망치와 밸류에이션 가정은 유지했습니다.");
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" && results.length) {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % results.length);
    } else if (event.key === "ArrowUp" && results.length) {
      event.preventDefault();
      setActiveIndex((current) => (current <= 0 ? results.length - 1 : current - 1));
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      void loadCompany(results[activeIndex]);
    } else if (event.key === "Escape") {
      setResults([]);
      setActiveIndex(-1);
    }
  }

  if (configured === null) return <div className="dart-status" role="status">기업 자동 불러오기 상태를 확인하고 있습니다.</div>;
  if (!configured) return <div className="integration-notice"><span aria-hidden="true">ⓘ</span><div><strong>직접 입력 모드</strong><p>기업 자동 불러오기는 현재 비활성화되어 있습니다. 직접 입력은 계속 사용할 수 있습니다.</p></div></div>;

  return (
    <div className="dart-search-block">
      <div className="dart-search-heading"><div><strong>OpenDART 기업 불러오기</strong><p>기업명 또는 종목코드로 최근 3개년 사업보고서를 불러옵니다.</p></div>{company.corpCode && <button className="secondary-button" disabled={status === "loading"} onClick={() => void loadCompany({ corpCode: company.corpCode!, corpName: company.name, stockCode: company.ticker, corpEngName: "", modifyDate: "" })}>다시 불러오기</button>}</div>
      <div className="company-search" role="combobox" aria-expanded={results.length > 0} aria-controls={listId} aria-haspopup="listbox">
        <span className="search-icon" aria-hidden="true">⌕</span>
        <input ref={inputRef} aria-label="OpenDART 기업 검색" aria-autocomplete="list" aria-controls={listId} aria-activedescendant={activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined} autoComplete="off" placeholder="예: 삼성전자 또는 005930" value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={onKeyDown} />
        {status === "searching" && <span className="status-pill" role="status">검색 중</span>}
      </div>
      {results.length > 0 && <ul className="dart-search-results" id={listId} role="listbox">{results.map((result, index) => <li id={`${listId}-${index}`} role="option" aria-selected={index === activeIndex} className={index === activeIndex ? "active" : ""} key={result.corpCode}><button onMouseEnter={() => setActiveIndex(index)} onClick={() => void loadCompany(result)}><span><strong>{result.corpName}</strong><small>{result.stockCode || "비상장"}</small></span><em>{result.stockCode ? "상장" : "비상장"}</em></button></li>)}</ul>}
      {message && <p className={`dart-search-message ${status}`} role={status === "error" ? "alert" : "status"}>{message}</p>}
      {dartImport && <div className="dart-provenance"><div><span className="source-badge dart">OpenDART 공시</span><strong>{dartImport.latestYear}년 사업보고서 · {dartImport.statementType === "CFS" ? "연결재무제표" : "별도재무제표"}</strong><small>마지막 불러오기 {new Date(dartImport.fetchedAt).toLocaleString("ko-KR")}{dartImport.editedFields.length ? ` · 사용자 수정 ${dartImport.editedFields.length}개` : ""}</small></div>{dartImport.warnings.map((warning) => <p key={warning}>⚠ {warning}</p>)}</div>}
      {pending && <div className="dart-dialog-backdrop" role="presentation"><div className="dart-dialog" role="dialog" aria-modal="true" aria-labelledby="dart-overwrite-title"><h3 id="dart-overwrite-title">기존 입력값을 어떻게 처리할까요?</h3><p>공시 실적을 업데이트해도 현재 주가, 주식수, 전망치와 밸류에이션 가정은 유지됩니다.</p><div><button className="primary-button" onClick={() => applyImport(pending, false)}>공시 실적만 업데이트</button><button className="secondary-button" onClick={() => applyImport(pending, true)}>기업 정보와 공시 실적 업데이트</button><button className="text-button" onClick={() => { setPending(null); setStatus("idle"); setMessage("불러오기를 취소했습니다."); inputRef.current?.focus(); }}>취소</button></div></div></div>}
    </div>
  );
}
