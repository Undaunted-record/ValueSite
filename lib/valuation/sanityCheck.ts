import type { Assumptions, CompanyData, ValidationIssue, ValuationMethod } from "@/types/valuation";

export function runSanityChecks(company: CompanyData, assumptions: Assumptions, methods: ValuationMethod[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const latest = company.financials.at(-1);
  if (company.sharesOutstanding <= 0) issues.push({ severity: "error", field: "sharesOutstanding", message: "Shares outstanding must be greater than zero." });
  if (assumptions.terminalGrowth >= assumptions.wacc) issues.push({ severity: "error", field: "terminalGrowth", message: "Terminal growth must be lower than WACC." });
  if (company.debt < 0 || company.cash < 0) issues.push({ severity: "error", field: "netDebt", message: "Debt and cash cannot be negative." });
  if (assumptions.wacc < 0.04 || assumptions.wacc > 0.2) issues.push({ severity: "warning", field: "wacc", message: "WACC is outside the common 4%–20% review range." });
  if (assumptions.terminalGrowth < 0 || assumptions.terminalGrowth > 0.05) issues.push({ severity: "warning", field: "terminalGrowth", message: "Terminal growth is outside the common 0%–5% review range." });
  const ebitda = latest ? latest.ebit + latest.revenue * assumptions.daPercentRevenue : 0;
  if (methods.includes("evEbitda") && ebitda <= 0) issues.push({ severity: "warning", field: "evEbitda", message: "EV / EBITDA is not meaningful with negative EBITDA." });
  if (methods.includes("pe") && (latest?.netIncome ?? 0) <= 0) issues.push({ severity: "warning", field: "pe", message: "P / E is not meaningful with negative net income." });
  return issues;
}
