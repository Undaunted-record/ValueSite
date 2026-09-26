import type { CompanyData, ValuationRange } from "@/types/valuation";

export function median(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

export function summarizeRanges(ranges: ValuationRange[]) {
  const valid = ranges.filter((range) => Number.isFinite(range.base) && range.base > 0);
  return {
    valid,
    low: valid.length ? Math.min(...valid.map((range) => range.low)) : 0,
    high: valid.length ? Math.max(...valid.map((range) => range.high)) : 0,
    median: median(valid.map((range) => range.base)),
  };
}

export function hasValuationInput(company: CompanyData): boolean {
  const estimates = company.financials.filter((period) => period.type === "estimate");
  return Boolean(company.name.trim()) && company.sharesOutstanding > 0 && estimates.some((period) => period.revenue > 0 && (period.ebit !== 0 || period.netIncome !== 0));
}
