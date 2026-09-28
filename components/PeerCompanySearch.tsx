"use client";

import { useEffect, useId, useRef, useState } from "react";
import { dartClient } from "@/lib/dart/client";
import type { DartCompanyRecord } from "@/lib/dart/types";
import type { PeerCompany } from "@/types/valuation";

interface Props { existingCorpCodes: string[]; onAdd: (peer: PeerCompany) => void; onClose: () => void; }

export function PeerCompanySearch({ existingCorpCodes, onAdd, onClose }: Props) {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DartCompanyRecord[]>([]);
  const [active, setActive] = useState(-1);
  const [status, setStatus] = useState<"idle" | "searching" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");
  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => {
    const compact = query.replace(/\s+/g, "");
    if (compact.length < (/[가-힣]/.test(compact) ? 2 : 3)) { setResults([]); return; }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setStatus("searching"); setMessage("");
      try {
        const matches = await dartClient.searchCompanies(query, controller.signal);
        setResults(matches); setActive(matches.length ? 0 : -1); setStatus("idle");
        if (!matches.length) setMessage("일치하는 상장기업이 없습니다.");
      } catch (error) { if ((error as Error).name !== "AbortError") { setStatus("error"); setMessage(error instanceof Error ? error.message : "기업을 검색하지 못했습니다."); } }
    }, 300);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [query]);
  const select = async (match: DartCompanyRecord) => {
    if (existingCorpCodes.includes(match.corpCode)) return setMessage("이미 추가한 비교기업입니다.");
    setStatus("loading"); setResults([]); setMessage(`${match.corpName} 공시를 불러오는 중입니다.`);
    try {
      const [overview, financials] = await Promise.all([dartClient.getCompany(match.corpCode), dartClient.getFinancials(match.corpCode)]);
      const latest = financials.financials.at(-1)!;
      const ebitda = financials.da === undefined ? 0 : latest.ebit + financials.da;
      onAdd({ id: crypto.randomUUID(), company: overview.corpName, ticker: overview.stockCode, corpCode: overview.corpCode, enterpriseValue: 0, marketCap: 0, revenue: latest.revenue, ebitda, ebit: latest.ebit, netIncome: latest.netIncome, bookValue: financials.bookValue ?? 0, cash: financials.cash ?? 0, debt: financials.debt ?? 0, financialYear: latest.year, statementType: financials.metadata.statementType, fetchedAt: financials.metadata.fetchedAt, source: "dart", missingFields: [...financials.metadata.missingFields, ...(financials.da === undefined ? ["ebitda"] : []), "marketCap"] });
    } catch (error) { setStatus("error"); setMessage(error instanceof Error ? error.message : "공시를 불러오지 못했습니다."); }
  };
  const keyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") return onClose();
    if (event.key === "ArrowDown" && results.length) { event.preventDefault(); setActive((value) => (value + 1) % results.length); }
    if (event.key === "ArrowUp" && results.length) { event.preventDefault(); setActive((value) => value <= 0 ? results.length - 1 : value - 1); }
    if (event.key === "Enter" && active >= 0) { event.preventDefault(); void select(results[active]); }
  };
  return <div className="peer-search-panel"><div><strong>비교기업 불러오기</strong><button className="text-button" onClick={onClose}>닫기</button></div><p>기업 공시 재무정보를 자동 입력합니다. 시가총액은 별도 입력이 필요합니다.</p><div className="company-search" role="combobox" aria-expanded={results.length > 0} aria-controls={listId}><span className="search-icon" aria-hidden="true">⌕</span><input ref={inputRef} aria-label="비교기업 검색" aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={keyDown} placeholder="기업명 또는 종목코드" />{status === "searching" && <span className="status-pill">검색 중</span>}</div>{results.length > 0 && <ul id={listId} role="listbox" className="dart-search-results peer-results">{results.map((result, index) => <li id={`${listId}-${index}`} role="option" aria-selected={index === active} className={index === active ? "active" : ""} key={result.corpCode}><button onClick={() => void select(result)}><span><strong>{result.corpName}</strong><small>{result.stockCode}</small></span><em>{existingCorpCodes.includes(result.corpCode) ? "추가됨" : "선택"}</em></button></li>)}</ul>}{message && <p className={`dart-search-message ${status}`} role={status === "error" ? "alert" : "status"}>{message}</p>}</div>;
}
