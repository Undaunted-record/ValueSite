import { calculatePeerMultiples } from "./tradingComps";
import type { Assumptions, CompanyData, PeerCompany, TerminalMethod, ValuationMethod } from "@/types/valuation";

export interface MethodReadiness {
  method: ValuationMethod;
  ready: boolean;
  missing: string[];
}

export function assessMethodReadiness(company: CompanyData, assumptions: Assumptions, peers: PeerCompany[], terminalMethod: TerminalMethod): MethodReadiness[] {
  const estimates = company.financials.filter((period) => period.type === "estimate");
  const terminal = estimates.at(-1);
  const missingForecast = estimates.length < 3 || estimates.some((period) => period.revenue <= 0);
  const dcfMissing = [
    ...(missingForecast ? ["3개년 추정 매출액"] : []),
    ...(estimates.some((period) => period.ebit === 0) ? ["3개년 추정 EBIT"] : []),
    ...(terminalMethod === "gordon" && assumptions.wacc <= assumptions.terminalGrowth ? ["WACC보다 낮은 영구성장률"] : []),
  ];
  const ebitda = terminal ? terminal.ebit + terminal.revenue * assumptions.daPercentRevenue : 0;
  const peerValid = calculatePeerMultiples(peers).filter((peer) => peer.evEbitda !== null).length;
  const map: Array<[ValuationMethod, string[]]> = [
    ["dcf", dcfMissing],
    ["evEbitda", [...(!terminal || terminal.revenue <= 0 ? ["최종 추정연도 매출액"] : []), ...(ebitda <= 0 ? ["양수 EBITDA"] : [])]],
    ["pe", !terminal || terminal.netIncome <= 0 ? ["최종 추정연도 양수 당기순이익"] : []],
    ["pb", company.bookValue <= 0 ? ["자기자본 장부가치"] : []],
    ["evRevenue", !terminal || terminal.revenue <= 0 ? ["최종 추정연도 매출액"] : []],
    ["tradingComps", [...(!terminal || terminal.revenue <= 0 ? ["최종 추정연도 매출액"] : []), ...(ebitda <= 0 ? ["양수 EBITDA"] : []), ...(peerValid < 1 ? ["유효 비교기업"] : [])]],
  ];
  return map.map(([method, missing]) => ({ method, missing, ready: missing.length === 0 }));
}
