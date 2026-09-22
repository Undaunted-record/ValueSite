import type { BridgeResult, CompanyData } from "@/types/valuation";

export function calculateEvBridge(enterpriseValue: number, company: CompanyData): BridgeResult {
  const equityValue = enterpriseValue - company.debt + company.cash - company.preferredStock - company.minorityInterest + company.otherAdjustments;
  const impliedSharePrice = company.sharesOutstanding > 0 ? equityValue / company.sharesOutstanding * 1000 : 0;
  return {
    enterpriseValue,
    debt: company.debt,
    cash: company.cash,
    preferredStock: company.preferredStock,
    minorityInterest: company.minorityInterest,
    otherAdjustments: company.otherAdjustments,
    equityValue,
    impliedSharePrice,
  };
}
