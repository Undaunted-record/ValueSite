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
  const { company, mode, methods, dataSource, dartImport, updateCompany, updateFinancial, loadDemo, reset } = useValuationStore();
  const missingName = !company.name.trim();
  const invalidShares = Boolean(company.name.trim()) && company.sharesOutstanding <= 0;
  return (
    <section id="financials" className="panel section-panel input-panel">
      <div className="section-heading"><div><p className="section-kicker">01 · 기업·재무정보</p><h2>기업 및 재무정보</h2><p>금액은 십억원, 주식수는 백만주 단위입니다.</p></div><div className="section-actions"><span className={`source-badge ${dataSource}`}>{dataSource === "demo" ? "샘플 데이터" : dataSource === "dart" ? "OpenDART 공시" : dataSource === "user" ? "사용자 입력" : "입력 전"}</span><button className="secondary-button" onClick={loadDemo}>샘플 불러오기</button><button className="text-button reset-all" onClick={reset}>전체 초기화</button></div></div>
      <p className="required-guide"><span aria-hidden="true">*</span> 표시된 항목은 선택한 평가 방법의 계산에 필요합니다.</p>
      <DartCompanySearch />
      <details className="raw-financials" open={mode === "advanced"}><summary>{mode === "quick" ? "불러온 재무정보 확인·수정" : "기업 및 재무정보 직접 입력"}<span>{mode === "quick" ? "필요할 때만 수정" : "고급 입력"}</span></summary><div className="raw-financial-content">
      <div className="input-grid company-grid">
        <label>기업명<span className="required-mark" aria-hidden="true"> *</span><span className="sr-only"> 필수</span><input required aria-required="true" aria-invalid={missingName} value={company.name} onChange={(event) => updateCompany({ name: event.target.value })} />{missingName && <small className="field-error">기업명을 입력해 주세요.</small>}</label>
        <label>종목코드 <small className="optional-label">선택</small><input aria-label="종목코드 선택 입력" value={company.ticker} onChange={(event) => updateCompany({ ticker: event.target.value })} /></label>
        <label>산업<select aria-label="산업" value={company.industry} onChange={(event) => updateCompany({ industry: event.target.value })}>{INDUSTRIES.map((item) => <option key={item}>{item}</option>)}</select></label>
        {coreFields.map((field) => <label key={field.key}>{field.label} <small className="optional-label">{field.key === "sharesOutstanding" ? "주당가치 계산용" : field.key === "currentSharePrice" ? "상승·하락률 계산용 · 선택" : "공시 자동 입력"}</small><div className="number-with-suffix"><NumberInput ariaLabel={`${field.label} ${field.suffix}`} showBlankWhenZero={field.key === "sharesOutstanding" || field.key === "currentSharePrice" || Boolean(dartImport?.missingFields.includes(field.key))} value={company[field.key] as number} onChange={(value) => updateCompany({ [field.key]: value })} /><span>{field.suffix}</span></div>{dartImport?.missingFields.includes(field.key) && <small className="field-note">공시에서 확인되지 않았습니다. 필요하면 직접 입력해 주세요.</small>}{field.key === "sharesOutstanding" && invalidShares && <small className="field-note">입력하지 않아도 총 기업가치와 주주가치는 계산됩니다.</small>}{field.key === "currentSharePrice" && company.currentSharePrice <= 0 && <small className="field-note">입력하지 않아도 내재가치는 계산됩니다.</small>}</label>)}
      </div>
      <div className="table-scroll-hint">좌우로 이동해 연도별 값을 확인할 수 있습니다.</div>
      <div className="table-wrap desktop-financial-table"><table className="financial-table"><thead><tr><th>항목</th>{company.financials.map((period) => <th className={period.type} key={period.year}>{period.year}<small>{period.type === "actual" ? (dartImport ? "OpenDART 실적" : "실적") : "사용자 추정"}</small></th>)}</tr></thead><tbody>{rows.map(([field, label]) => <tr key={field}><th>{label}<small>십억원</small></th>{company.financials.map((period, index) => { const sourceKey = `financials.${period.year.replace(/[AE]$/, "")}.${field}`; const missing = dartImport?.missingFields.includes(sourceKey); return <td className={period.type} key={period.year} title={dartImport?.sources[sourceKey] ? `OpenDART · ${dartImport.sources[sourceKey].reportName} · ${dartImport.sources[sourceKey].statementType === "CFS" ? "연결" : "별도"}` : undefined}><NumberInput ariaLabel={`${period.year} ${label} 십억원`} showBlankWhenZero={missing} value={period[field]} onChange={(value) => updateFinancial(index, field, value)} />{missing && <small className="missing-cell">확인 필요</small>}</td>; })}</tr>)}</tbody></table></div>
      <div className="mobile-financial-cards">{company.financials.map((period, index) => <details key={period.year} open={period.type === "estimate" && index === 3}><summary><span>{period.year}<small>{period.type === "actual" ? "실적" : "추정"}</small></span><strong>{period.revenue ? `매출 ${period.revenue.toLocaleString()}십억원` : "값 입력"}</strong></summary><div>{rows.map(([field, label]) => <label key={field}>{label}<div className="number-with-suffix"><NumberInput ariaLabel={`${period.year} ${label} 십억원`} value={period[field]} onChange={(value) => updateFinancial(index, field, value)} /><span>십억원</span></div></label>)}</div></details>)}</div>
      <div className="legend"><span><i className="actual-dot" /> A = 실적</span><span><i className="estimate-dot" /> E = 추정</span><span>추정치는 사용자의 판단과 가정을 반영해 입력하세요.</span></div>
      {mode === "advanced" && <details className="advanced-fields disclosure"><summary>고급 EV 브리지 입력</summary><div className="input-grid">{([ ["preferredStock", "우선주"], ["minorityInterest", "비지배지분"], ["otherAdjustments", "기타 조정"], ["bookValue", "자기자본 장부가치"] ] as Array<[keyof CompanyData, string]>).map(([key, label]) => { const required = key === "bookValue" && methods.includes("pb"); return <label key={key}>{label}{required && <><span className="required-mark" aria-hidden="true"> *</span><span className="sr-only"> 필수</span></>}<div className="number-with-suffix"><NumberInput required={required} ariaLabel={`${label} 십억원${required ? " 필수" : ""}`} allowNegative={key === "otherAdjustments"} value={company[key] as number} onChange={(value) => updateCompany({ [key]: value })} /><span>십억원</span></div></label>; })}</div></details>}
      </div></details>
    </section>
  );
}
