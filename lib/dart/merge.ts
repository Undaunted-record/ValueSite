import type { CompanyData, FinancialPeriod } from "@/types/valuation";
import type { DartCompanyOverview, NormalizedDartFinancials } from "./types";

function buildEstimatePeriods(actuals: FinancialPeriod[], existing: FinancialPeriod[]) {
  const latestYear = Math.max(...actuals.map((period) => Number.parseInt(period.year, 10)));
  const priorEstimates = existing.filter((period) => period.type === "estimate");
  return [1, 2, 3].map((offset, index): FinancialPeriod => {
    const year = `${latestYear + offset}E`;
    const preserved = priorEstimates[index] ?? priorEstimates.find((period) => period.year === year);
    return {
      year,
      type: "estimate",
      revenue: preserved?.revenue ?? 0,
      ebit: preserved?.ebit ?? 0,
      netIncome: preserved?.netIncome ?? 0,
    };
  });
}

export function mergeDartFinancials(company: CompanyData, imported: NormalizedDartFinancials) {
  const actuals = imported.financials.slice(-3);
  return {
    ...company,
    ...(imported.cash === undefined ? {} : { cash: imported.cash }),
    ...(imported.debt === undefined ? {} : { debt: imported.debt }),
    ...(imported.bookValue === undefined ? {} : { bookValue: imported.bookValue }),
    financials: [...actuals, ...buildEstimatePeriods(actuals, company.financials)],
  };
}

export function mergeDartCompany(company: CompanyData, overview: DartCompanyOverview, imported: NormalizedDartFinancials, includeIdentity: boolean) {
  const financialCompany = mergeDartFinancials(company, imported);
  if (!includeIdentity) return financialCompany;
  return {
    ...financialCompany,
    name: overview.corpName,
    ticker: overview.stockCode,
    corpCode: overview.corpCode,
  };
}
