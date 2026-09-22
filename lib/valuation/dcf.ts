import type { Assumptions, CompanyData, DcfProjection, DcfResult, TerminalMethod } from "@/types/valuation";

export function calculateDcf(
  company: CompanyData,
  assumptions: Assumptions,
  terminalMethod: TerminalMethod = "gordon",
): DcfResult {
  const estimates = company.financials.filter((period) => period.type === "estimate");
  const projections: DcfProjection[] = estimates.map((period, index) => {
    const nopat = period.ebit * (1 - assumptions.taxRate);
    const da = period.revenue * assumptions.daPercentRevenue;
    const capex = period.revenue * assumptions.capexPercentRevenue;
    const changeNwc = period.revenue * assumptions.nwcPercentRevenue;
    const ufcf = nopat + da - capex - changeNwc;
    const discountFactor = 1 / Math.pow(1 + assumptions.wacc, index + 1);
    return { ...period, nopat, da, capex, changeNwc, ufcf, discountFactor, presentValue: ufcf * discountFactor };
  });

  if (!projections.length || assumptions.wacc <= assumptions.terminalGrowth) {
    return { enterpriseValue: 0, terminalValue: 0, terminalValuePercent: 0, projections };
  }

  const terminal = projections.at(-1)!;
  const terminalEbitda = terminal.ebit + terminal.da;
  const terminalValue = terminalMethod === "gordon"
    ? terminal.ufcf * (1 + assumptions.terminalGrowth) / (assumptions.wacc - assumptions.terminalGrowth)
    : terminalEbitda * assumptions.exitMultiple;
  const terminalPv = terminalValue * terminal.discountFactor;
  const forecastPv = projections.reduce((sum, period) => sum + period.presentValue, 0);
  const enterpriseValue = forecastPv + terminalPv;

  return {
    enterpriseValue,
    terminalValue,
    terminalValuePercent: enterpriseValue > 0 ? terminalPv / enterpriseValue : 0,
    projections,
  };
}
