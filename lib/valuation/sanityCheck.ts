import type { Assumptions, CompanyData, TerminalMethod, ValidationIssue, ValuationMethod } from "@/types/valuation";

export function runSanityChecks(company: CompanyData, assumptions: Assumptions, methods: ValuationMethod[], terminalMethod: TerminalMethod = "gordon"): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const latest = company.financials.at(-1);
  if (company.sharesOutstanding <= 0) issues.push({ severity: "warning", field: "sharesOutstanding", message: "희석주식수를 입력하기 전까지 주당가치는 표시하지 않습니다." });
  if (methods.includes("dcf") && terminalMethod === "gordon" && assumptions.terminalGrowth >= assumptions.wacc) issues.push({ severity: "error", field: "terminalGrowth", message: "DCF 계산을 위해 영구성장률은 WACC보다 낮아야 합니다." });
  if (company.debt < 0 || company.cash < 0) issues.push({ severity: "error", field: "netDebt", message: "현금과 차입금에는 음수를 입력할 수 없습니다." });
  if (latest && latest.revenue <= 0) issues.push({ severity: "warning", field: "revenue", message: "최종 추정연도 매출액이 없어 일부 평가 방법을 계산할 수 없습니다." });
  if (assumptions.wacc < 0.06) issues.push({ severity: "warning", field: "wacc", message: `WACC ${(assumptions.wacc * 100).toFixed(1)}%는 일반적인 성숙기업 검토 범위보다 낮습니다. 무위험수익률, Beta, ERP와 자본구조를 확인해 주세요.` });
  if (assumptions.wacc > 0.15) issues.push({ severity: "warning", field: "wacc", message: `WACC ${(assumptions.wacc * 100).toFixed(1)}%는 높은 사업·재무 위험을 전제로 합니다.` });
  if (terminalMethod === "gordon" && (assumptions.terminalGrowth < 0 || assumptions.terminalGrowth > 0.05)) issues.push({ severity: "warning", field: "terminalGrowth", message: "영구성장률이 일반적인 검토 범위인 0%~5%를 벗어났습니다." });
  const ebitda = latest ? latest.ebit + latest.revenue * assumptions.daPercentRevenue : 0;
  if (methods.includes("evEbitda") && ebitda <= 0) issues.push({ severity: "warning", field: "evEbitda", message: "EBITDA가 음수이면 EV / EBITDA의 의미가 제한적입니다." });
  if (methods.includes("pe") && (latest?.netIncome ?? 0) <= 0) issues.push({ severity: "warning", field: "pe", message: "순이익이 음수이면 P / E를 적용하기 어렵습니다." });
  return issues;
}
