import type { Assumptions, CompanyData, ValidationIssue, ValuationMethod } from "@/types/valuation";

export function runSanityChecks(company: CompanyData, assumptions: Assumptions, methods: ValuationMethod[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const latest = company.financials.at(-1);
  if (company.sharesOutstanding <= 0) issues.push({ severity: "error", field: "sharesOutstanding", message: "희석주식수는 0보다 커야 합니다." });
  if (assumptions.terminalGrowth >= assumptions.wacc) issues.push({ severity: "error", field: "terminalGrowth", message: "영구성장률은 WACC보다 낮아야 합니다." });
  if (company.debt < 0 || company.cash < 0) issues.push({ severity: "error", field: "netDebt", message: "현금과 차입금에는 음수를 입력할 수 없습니다." });
  if (assumptions.wacc < 0.04 || assumptions.wacc > 0.2) issues.push({ severity: "warning", field: "wacc", message: "WACC가 일반적인 검토 범위인 4%~20%를 벗어났습니다." });
  if (assumptions.terminalGrowth < 0 || assumptions.terminalGrowth > 0.05) issues.push({ severity: "warning", field: "terminalGrowth", message: "영구성장률이 일반적인 검토 범위인 0%~5%를 벗어났습니다." });
  const ebitda = latest ? latest.ebit + latest.revenue * assumptions.daPercentRevenue : 0;
  if (methods.includes("evEbitda") && ebitda <= 0) issues.push({ severity: "warning", field: "evEbitda", message: "EBITDA가 음수이면 EV / EBITDA의 의미가 제한적입니다." });
  if (methods.includes("pe") && (latest?.netIncome ?? 0) <= 0) issues.push({ severity: "warning", field: "pe", message: "순이익이 음수이면 P / E를 적용하기 어렵습니다." });
  return issues;
}
