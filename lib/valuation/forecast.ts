import type { FinancialPeriod, ValuationMethod } from "@/types/valuation";

export interface ForecastAssumptions {
  revenueGrowth: number | number[];
  ebitMargin: number | number[];
  netMargin: number | number[];
}

const yearValue = (value: number | number[], index: number) => Array.isArray(value) ? (value[index] ?? value.at(-1) ?? 0) : value;

export function getForecastRequirements(methods: ValuationMethod[]) {
  const ebit = methods.some((method) => ["dcf", "evEbitda", "tradingComps"].includes(method));
  const netIncome = methods.includes("pe");
  return { revenueGrowth: ebit || netIncome || methods.includes("evRevenue"), ebitMargin: ebit, netMargin: netIncome };
}

export function buildSimpleForecast(actuals: FinancialPeriod[], estimateYears: string[], assumptions: ForecastAssumptions) {
  let revenue = actuals.at(-1)?.revenue ?? 0;
  return estimateYears.map((year, index) => {
    revenue *= 1 + yearValue(assumptions.revenueGrowth, index);
    return {
      year,
      revenue,
      ebit: revenue * yearValue(assumptions.ebitMargin, index),
      netIncome: revenue * yearValue(assumptions.netMargin, index),
    };
  });
}

export function historicalReference(periods: FinancialPeriod[]) {
  const actuals = periods.filter((period) => period.type === "actual" && period.revenue > 0);
  const growth = actuals.length > 1
    ? actuals.slice(1).reduce((sum, period, index) => sum + period.revenue / actuals[index].revenue - 1, 0) / (actuals.length - 1)
    : 0;
  const latest = actuals.at(-1);
  return {
    revenueGrowth: growth,
    ebitMargin: latest ? latest.ebit / latest.revenue : 0,
    netMargin: latest ? latest.netIncome / latest.revenue : 0,
  };
}
