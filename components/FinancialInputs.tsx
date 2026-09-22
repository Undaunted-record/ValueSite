"use client";

import { INDUSTRIES } from "@/data/demo";
import { useValuationStore } from "@/store/useValuationStore";
import type { CompanyData } from "@/types/valuation";

const coreFields: Array<{ key: keyof CompanyData; label: string; suffix?: string }> = [
  { key: "cash", label: "현금", suffix: "십억원" },
  { key: "debt", label: "차입금", suffix: "십억원" },
  { key: "sharesOutstanding", label: "희석주식수", suffix: "백만주" },
  { key: "currentSharePrice", label: "현재 주가", suffix: "원" },
];

export function FinancialInputs() {
  const { company, mode, updateCompany, updateFinancial, loadDemo } = useValuationStore();

  return (
    <section id="financials" className="panel section-panel">
      <div className="section-heading">
        <div>
          <p className="section-kicker">01 · 재무정보 입력</p>
          <h2>핵심 숫자만 입력해 시작하세요</h2>
          <p>재무제표 금액은 십억원, 주식수는 백만주 단위입니다.</p>
        </div>
        <button className="secondary-button" onClick={loadDemo}>데모 불러오기</button>
      </div>

      <div className="company-search">
        <span className="search-icon">⌕</span>
        <input
          aria-label="기업 검색"
          placeholder="기업명 또는 종목코드 검색 — 예: 삼성전자 / 005930"
          value={company.name}
          onChange={(event) => updateCompany({ name: event.target.value })}
        />
        <span className="status-pill">직접 입력</span>
      </div>
      <p className="helper-row"><span>OpenDART 자동 입력</span>은 <code>OPEN_DART_API_KEY</code> 설정 시 활성화됩니다. API Key가 없어도 직접 입력할 수 있습니다.</p>

      <div className="input-grid company-grid">
        <label>기업명<input value={company.name} onChange={(event) => updateCompany({ name: event.target.value })} /></label>
        <label>종목코드<input value={company.ticker} onChange={(event) => updateCompany({ ticker: event.target.value })} /></label>
        <label>산업<select value={company.industry} onChange={(event) => updateCompany({ industry: event.target.value })}>{INDUSTRIES.map((item) => <option key={item}>{item}</option>)}</select></label>
        {coreFields.map((field) => (
          <label key={field.key}>{field.label}<div className="number-with-suffix"><input type="number" min="0" value={company[field.key] as number} onChange={(event) => updateCompany({ [field.key]: Number(event.target.value) })} /><span>{field.suffix}</span></div></label>
        ))}
      </div>

      <div className="table-wrap">
        <table className="financial-table">
          <thead><tr><th>항목</th>{company.financials.map((period) => <th key={period.year}>{period.year}<small>{period.type === "actual" ? "실적" : "추정"}</small></th>)}</tr></thead>
          <tbody>
            {(["revenue", "ebit", "netIncome"] as const).map((field) => (
              <tr key={field}>
                <th>{field === "revenue" ? "매출액" : field === "ebit" ? "영업이익 / EBIT" : "당기순이익"}<small>십억원</small></th>
                {company.financials.map((period, index) => <td key={period.year}><input type="number" value={period[field]} onChange={(event) => updateFinancial(index, field, Number(event.target.value))} /></td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="legend"><span><i className="actual-dot" /> A = 실적</span><span><i className="estimate-dot" /> E = 추정</span><span>추정치는 사용자의 판단과 가정을 반영해 입력하세요.</span></div>

      {mode === "advanced" && (
        <div className="advanced-fields">
          <h3>고급 EV 브리지 입력</h3>
          <div className="input-grid">
            {([
              ["preferredStock", "우선주"], ["minorityInterest", "비지배지분"], ["otherAdjustments", "기타 조정"], ["bookValue", "자기자본 장부가치"],
            ] as Array<[keyof CompanyData, string]>).map(([key, label]) => <label key={key}>{label}<div className="number-with-suffix"><input type="number" value={company[key] as number} onChange={(event) => updateCompany({ [key]: Number(event.target.value) })} /><span>십억원</span></div></label>)}
          </div>
        </div>
      )}
    </section>
  );
}
