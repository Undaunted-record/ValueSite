import type { Assumptions, CompanyData, ValuationMethod, ValuationRange } from "@/types/valuation";
import { calculateEvBridge } from "./evBridge";

function range(method: ValuationMethod, label: string, base: number, spread = 0.1, metric?: string): ValuationRange {
  return { method, label, low: base * (1 - spread), base, high: base * (1 + spread), metric };
}

export function calculateMultipleRanges(company: CompanyData, assumptions: Assumptions): ValuationRange[] {
  const terminal = company.financials.filter((period) => period.type === "estimate").at(-1) ?? company.financials.at(-1)!;
  const da = terminal.revenue * assumptions.daPercentRevenue;
  const ebitda = terminal.ebit + da;
  const evEbitdaPrice = calculateEvBridge(ebitda * assumptions.targetEvEbitda, company).impliedSharePrice;
  const evRevenuePrice = calculateEvBridge(terminal.revenue * assumptions.targetEvRevenue, company).impliedSharePrice;
  const pePrice = company.sharesOutstanding > 0 ? terminal.netIncome * assumptions.targetPe / company.sharesOutstanding * 1000 : 0;
  const pbPrice = company.sharesOutstanding > 0 ? company.bookValue * assumptions.targetPb / company.sharesOutstanding * 1000 : 0;
  return [
    range("evEbitda", "EV / EBITDA", evEbitdaPrice, 0.12, `${assumptions.targetEvEbitda.toFixed(1)}x`),
    range("pe", "P / E", pePrice, 0.12, `${assumptions.targetPe.toFixed(1)}x`),
    range("pb", "P / B", pbPrice, 0.12, `${assumptions.targetPb.toFixed(1)}x`),
    range("evRevenue", "EV / Revenue", evRevenuePrice, 0.15, `${assumptions.targetEvRevenue.toFixed(1)}x`),
  ];
}
