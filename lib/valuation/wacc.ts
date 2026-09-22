import type { Assumptions } from "@/types/valuation";

export function calculateCostOfEquity(a: Assumptions): number {
  return a.riskFreeRate + a.beta * a.equityRiskPremium;
}

export function calculateWacc(a: Assumptions): number {
  const equityWeight = 1 - a.debtWeight;
  return equityWeight * calculateCostOfEquity(a) + a.debtWeight * a.costOfDebt * (1 - a.taxRate);
}
