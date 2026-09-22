"use client";

import { INDUSTRIES } from "@/data/demo";
import { useValuationStore } from "@/store/useValuationStore";
import type { CompanyData } from "@/types/valuation";

const coreFields: Array<{ key: keyof CompanyData; label: string; suffix?: string }> = [
  { key: "cash", label: "Cash", suffix: "₩bn" },
  { key: "debt", label: "Debt", suffix: "₩bn" },
  { key: "sharesOutstanding", label: "Diluted Shares", suffix: "mn" },
  { key: "currentSharePrice", label: "Current Share Price", suffix: "₩" },
];

export function FinancialInputs() {
  const { company, mode, updateCompany, updateFinancial, loadDemo } = useValuationStore();

  return (
    <section id="financials" className="panel section-panel">
      <div className="section-heading">
        <div>
          <p className="section-kicker">01 · FINANCIAL INPUT</p>
          <h2>Start with only the essentials</h2>
          <p>All monetary financial statement values are in ₩ billion. Shares are in millions.</p>
        </div>
        <button className="secondary-button" onClick={loadDemo}>Try Demo</button>
      </div>

      <div className="company-search">
        <span className="search-icon">⌕</span>
        <input
          aria-label="Search company"
          placeholder="Search company or ticker — e.g. 삼성전자 / 005930"
          value={company.name}
          onChange={(event) => updateCompany({ name: event.target.value })}
        />
        <span className="status-pill">Manual input</span>
      </div>
      <p className="helper-row"><span>OpenDART Auto Fill</span> activates when <code>OPEN_DART_API_KEY</code> is configured. Manual input always remains available.</p>

      <div className="input-grid company-grid">
        <label>Company Name<input value={company.name} onChange={(event) => updateCompany({ name: event.target.value })} /></label>
        <label>Ticker / Code<input value={company.ticker} onChange={(event) => updateCompany({ ticker: event.target.value })} /></label>
        <label>Industry<select value={company.industry} onChange={(event) => updateCompany({ industry: event.target.value })}>{INDUSTRIES.map((item) => <option key={item}>{item}</option>)}</select></label>
        {coreFields.map((field) => (
          <label key={field.key}>{field.label}<div className="number-with-suffix"><input type="number" min="0" value={company[field.key] as number} onChange={(event) => updateCompany({ [field.key]: Number(event.target.value) })} /><span>{field.suffix}</span></div></label>
        ))}
      </div>

      <div className="table-wrap">
        <table className="financial-table">
          <thead><tr><th>Metric</th>{company.financials.map((period) => <th key={period.year}>{period.year}<small>{period.type === "actual" ? "Actual" : "Estimate"}</small></th>)}</tr></thead>
          <tbody>
            {(["revenue", "ebit", "netIncome"] as const).map((field) => (
              <tr key={field}>
                <th>{field === "revenue" ? "Revenue" : field === "ebit" ? "Operating Profit / EBIT" : "Net Income"}<small>₩bn</small></th>
                {company.financials.map((period, index) => <td key={period.year}><input type="number" value={period[field]} onChange={(event) => updateFinancial(index, field, Number(event.target.value))} /></td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="legend"><span><i className="actual-dot" /> A = Actual</span><span><i className="estimate-dot" /> E = Estimate</span><span>Forecast values should reflect the user&apos;s own assumptions.</span></div>

      {mode === "advanced" && (
        <div className="advanced-fields">
          <h3>Advanced EV Bridge Inputs</h3>
          <div className="input-grid">
            {([
              ["preferredStock", "Preferred Stock"], ["minorityInterest", "Minority Interest"], ["otherAdjustments", "Other Adjustments"], ["bookValue", "Book Value of Equity"],
            ] as Array<[keyof CompanyData, string]>).map(([key, label]) => <label key={key}>{label}<div className="number-with-suffix"><input type="number" value={company[key] as number} onChange={(event) => updateCompany({ [key]: Number(event.target.value) })} /><span>₩bn</span></div></label>)}
          </div>
        </div>
      )}
    </section>
  );
}
