import type { FinancialPeriod } from "@/types/valuation";

export interface ForecastAssumptions {
  revenueGrowth: number;
  ebitMargin: number;
  netMargin: number;
}

export function buildSimpleForecast(actuals: FinancialPeriod[], estimateYears: string[], assumptions: ForecastAssumptions) {
  let revenue = actuals.at(-1)?.revenue ?? 0;
  return estimateYears.map((year) => {
    revenue *= 1 + assumptions.revenueGrowth;
    return {
      year,
      revenue,
      ebit: revenue * assumptions.ebitMargin,
      netIncome: revenue * assumptions.netMargin,
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
