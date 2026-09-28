import type { Assumptions, CompanyData, PeerCompany, TerminalMethod, ValuationMethod } from "@/types/valuation";
import { calculateDcf } from "./dcf";
import { calculateEvBridge } from "./evBridge";
import { calculatePeerMultiples, calculateStats } from "./tradingComps";

export interface ValuationValueRange {
  method: ValuationMethod;
  label: string;
  equityLow: number;
  equityBase: number;
  equityHigh: number;
  enterpriseLow?: number;
  enterpriseBase?: number;
  enterpriseHigh?: number;
  metric?: string;
}

const toEquity = (enterpriseValue: number, company: CompanyData) => calculateEvBridge(enterpriseValue, company).equityValue;
const equityRange = (method: ValuationMethod, label: string, base: number, spread: number, metric?: string): ValuationValueRange => ({
  method, label, equityLow: base * (1 - spread), equityBase: base, equityHigh: base * (1 + spread), metric,
});
const enterpriseRange = (method: ValuationMethod, label: string, base: number, spread: number, company: CompanyData, metric?: string): ValuationValueRange => {
  const low = base * (1 - spread);
  const high = base * (1 + spread);
  return { method, label, enterpriseLow: low, enterpriseBase: base, enterpriseHigh: high, equityLow: toEquity(low, company), equityBase: toEquity(base, company), equityHigh: toEquity(high, company), metric };
};

export function buildValuationValueRanges(company: CompanyData, assumptions: Assumptions, methods: ValuationMethod[], peers: PeerCompany[], terminalMethod: TerminalMethod): ValuationValueRange[] {
  const estimates = company.financials.filter((period) => period.type === "estimate");
  const terminal = estimates.at(-1);
  if (!terminal) return [];
  const result: ValuationValueRange[] = [];

  if (methods.includes("dcf")) {
    const lowAssumptions = { ...assumptions, wacc: assumptions.wacc + 0.005, terminalGrowth: Math.max(0, assumptions.terminalGrowth - 0.005) };
    const highAssumptions = { ...assumptions, wacc: Math.max(0.01, assumptions.wacc - 0.005), terminalGrowth: assumptions.terminalGrowth + 0.005 };
    const enterpriseLow = calculateDcf(company, lowAssumptions, terminalMethod).enterpriseValue;
    const enterpriseBase = calculateDcf(company, assumptions, terminalMethod).enterpriseValue;
    const enterpriseHigh = calculateDcf(company, highAssumptions, terminalMethod).enterpriseValue;
    result.push({ method: "dcf", label: "DCF", enterpriseLow, enterpriseBase, enterpriseHigh, equityLow: toEquity(enterpriseLow, company), equityBase: toEquity(enterpriseBase, company), equityHigh: toEquity(enterpriseHigh, company) });
  }

  const ebitda = terminal.ebit + terminal.revenue * assumptions.daPercentRevenue;
  if (methods.includes("evEbitda")) result.push(enterpriseRange("evEbitda", "EV / EBITDA", ebitda * assumptions.targetEvEbitda, 0.12, company, `${assumptions.targetEvEbitda.toFixed(1)}x`));
  if (methods.includes("pe")) result.push(equityRange("pe", "P / E", terminal.netIncome * assumptions.targetPe, 0.12, `${assumptions.targetPe.toFixed(1)}x`));
  if (methods.includes("pb")) result.push(equityRange("pb", "P / B", company.bookValue * assumptions.targetPb, 0.12, `${assumptions.targetPb.toFixed(1)}x`));
  if (methods.includes("evRevenue")) result.push(enterpriseRange("evRevenue", "EV / Revenue", terminal.revenue * assumptions.targetEvRevenue, 0.15, company, `${assumptions.targetEvRevenue.toFixed(1)}x`));
  if (methods.includes("tradingComps")) {
    const stats = calculateStats(calculatePeerMultiples(peers).map((peer) => peer.evEbitda));
    const values = [stats.q1, stats.median, stats.q3].map((multiple) => ebitda * multiple);
    result.push({ method: "tradingComps", label: "유사기업 비교", enterpriseLow: values[0], enterpriseBase: values[1], enterpriseHigh: values[2], equityLow: toEquity(values[0], company), equityBase: toEquity(values[1], company), equityHigh: toEquity(values[2], company), metric: `중앙값 ${stats.median.toFixed(1)}x` });
  }
  return result.filter((item) => Number.isFinite(item.equityBase) && item.equityBase > 0);
}

export function toPerShareRange(range: ValuationValueRange, sharesOutstanding: number) {
  if (sharesOutstanding <= 0) return null;
  const factor = 1000 / sharesOutstanding;
  return { method: range.method, label: range.label, low: range.equityLow * factor, base: range.equityBase * factor, high: range.equityHigh * factor, metric: range.metric };
}
