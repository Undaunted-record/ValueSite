"use client";

import { INDUSTRIES } from "@/data/demo";
import { useValuationStore } from "@/store/useValuationStore";
import type { CompanyData } from "@/types/valuation";
import { DartCompanySearch } from "./DartCompanySearch";
import { NumberInput } from "./NumberInput";

const coreFields: Array<{ key: keyof CompanyData; label: string; suffix: string }> = [
  { key: "cash", label: "현금", suffix: "십억원" }, { key: "debt", label: "차입금", suffix: "십억원" },
  { key: "sharesOutstanding", label: "희석주식수", suffix: "백만주" }, { key: "currentSharePrice", label: "현재 주가", suffix: "원" },
];
const rows = [
  ["revenue", "매출액"], ["ebit", "영업이익 / EBIT"], ["netIncome", "당기순이익"],
] as const;

export function FinancialInputs() {
  const { company, mode, dataSource, dartImport, updateCompany, updateFinancial, loadDemo, reset } = useValuationStore();
  const missingName = !company.name.trim();
  const invalidShares = company.sharesOutstanding <= 0;
  return (
    <section id="financials" className="panel section-panel input-panel">
      <div className="section-heading"><div><p className="section-kicker">01 · 기업·재무정보</p><h2>핵심 숫자부터 입력하세요</h2><p>재무제표 금액은 십억원, 주식수는 백만주 단위입니다.</p></div><div className="section-actions"><span className={`source-badge ${dataSource}`}>{dataSource === "demo" ? "샘플 데이터" : dataSource === "dart" ? "OpenDART 공시" : dataSource === "user" ? "사용자 입력" : "입력 전"}</span><button className="secondary-button" onClick={loadDemo}>샘플 불러오기</button><button className="text-button reset-all" onClick={reset}>전체 초기화</button></div></div>
      <DartCompanySearch />
      <div className="input-grid company-grid">
        <label>기업명<input aria-invalid={missingName} value={company.name} onChange={(event) => updateCompany({ name: event.target.value })} />{missingName && <small className="field-error">기업명을 입력해 주세요.</small>}</label>
        <label>종목코드<input aria-label="종목코드" value={company.ticker} onChange={(event) => updateCompany({ ticker: event.target.value })} /></label>
        <label>산업<select aria-label="산업" value={company.industry} onChange={(event) => updateCompany({ industry: event.target.value })}>{INDUSTRIES.map((item) => <option key={item}>{item}</option>)}</select></label>
        {coreFields.map((field) => <label key={field.key}>{field.label}<div className="number-with-suffix"><NumberInput ariaLabel={`${field.label} ${field.suffix}`} showBlankWhenZero={Boolean(dartImport?.missingFields.includes(field.key))} value={company[field.key] as number} onChange={(value) => updateCompany({ [field.key]: value })} /><span>{field.suffix}</span></div>{dartImport?.missingFields.includes(field.key) && <small className="field-note">공시에서 확인되지 않아 직접 입력이 필요합니다.</small>}{field.key === "sharesOutstanding" && invalidShares && <small className="field-error">0보다 커야 합니다.</small>}</label>)}
      </div>
      <div className="table-scroll-hint">좌우로 이동해 연도별 값을 확인할 수 있습니다.</div>
      <div className="table-wrap desktop-financial-table"><table className="financial-table"><thead><tr><th>항목</th>{company.financials.map((period) => <th className={period.type} key={period.year}>{period.year}<small>{period.type === "actual" ? (dartImport ? "OpenDART 실적" : "실적") : "사용자 추정"}</small></th>)}</tr></thead><tbody>{rows.map(([field, label]) => <tr key={field}><th>{label}<small>십억원</small></th>{company.financials.map((period, index) => { const sourceKey = `financials.${period.year.replace(/[AE]$/, "")}.${field}`; const missing = dartImport?.missingFields.includes(sourceKey); return <td className={period.type} key={period.year} title={dartImport?.sources[sourceKey] ? `OpenDART · ${dartImport.sources[sourceKey].reportName} · ${dartImport.sources[sourceKey].statementType === "CFS" ? "연결" : "별도"}` : undefined}><NumberInput ariaLabel={`${period.year} ${label} 십억원`} showBlankWhenZero={missing} value={period[field]} onChange={(value) => updateFinancial(index, field, value)} />{missing && <small className="missing-cell">확인 필요</small>}</td>; })}</tr>)}</tbody></table></div>
      <div className="mobile-financial-cards">{company.financials.map((period, index) => <details key={period.year} open={period.type === "estimate" && index === 3}><summary><span>{period.year}<small>{period.type === "actual" ? "실적" : "추정"}</small></span><strong>{period.revenue ? `매출 ${period.revenue.toLocaleString()}십억원` : "값 입력"}</strong></summary><div>{rows.map(([field, label]) => <label key={field}>{label}<div className="number-with-suffix"><NumberInput ariaLabel={`${period.year} ${label} 십억원`} value={period[field]} onChange={(value) => updateFinancial(index, field, value)} /><span>십억원</span></div></label>)}</div></details>)}</div>
      <div className="legend"><span><i className="actual-dot" /> A = 실적</span><span><i className="estimate-dot" /> E = 추정</span><span>추정치는 사용자의 판단과 가정을 반영해 입력하세요.</span></div>
      {mode === "advanced" && <details className="advanced-fields disclosure"><summary>고급 EV 브리지 입력</summary><div className="input-grid">{([ ["preferredStock", "우선주"], ["minorityInterest", "비지배지분"], ["otherAdjustments", "기타 조정"], ["bookValue", "자기자본 장부가치"] ] as Array<[keyof CompanyData, string]>).map(([key, label]) => <label key={key}>{label}<div className="number-with-suffix"><NumberInput ariaLabel={`${label} 십억원`} allowNegative={key === "otherAdjustments"} value={company[key] as number} onChange={(value) => updateCompany({ [key]: value })} /><span>십억원</span></div></label>)}</div></details>}
    </section>
  );
}
