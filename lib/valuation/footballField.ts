import type { Assumptions, CompanyData, TerminalMethod, ValuationMethod, ValuationRange } from "@/types/valuation";
import { calculateDcf } from "./dcf";
import { calculateEvBridge } from "./evBridge";
import { calculateMultipleRanges } from "./multiples";
import { calculatePeerMultiples, calculateStats } from "./tradingComps";
import type { PeerCompany } from "@/types/valuation";

export function buildValuationRanges(
  company: CompanyData,
  assumptions: Assumptions,
  methods: ValuationMethod[],
  peers: PeerCompany[],
  terminalMethod: TerminalMethod,
): ValuationRange[] {
  const dcfBase = calculateEvBridge(calculateDcf(company, assumptions, terminalMethod).enterpriseValue, company).impliedSharePrice;
  const lowAssumptions = { ...assumptions, wacc: assumptions.wacc + 0.005, terminalGrowth: Math.max(0, assumptions.terminalGrowth - 0.005) };
  const highAssumptions = { ...assumptions, wacc: Math.max(0.01, assumptions.wacc - 0.005), terminalGrowth: assumptions.terminalGrowth + 0.005 };
  const dcfLow = calculateEvBridge(calculateDcf(company, lowAssumptions, terminalMethod).enterpriseValue, company).impliedSharePrice;
  const dcfHigh = calculateEvBridge(calculateDcf(company, highAssumptions, terminalMethod).enterpriseValue, company).impliedSharePrice;
  const dcfRange: ValuationRange = { method: "dcf", label: "DCF", low: dcfLow, base: dcfBase, high: dcfHigh };

  const multipleRanges = calculateMultipleRanges(company, assumptions);
  const peerStats = calculateStats(calculatePeerMultiples(peers).map((peer) => peer.evEbitda));
  const terminal = company.financials.filter((period) => period.type === "estimate").at(-1) ?? company.financials.at(-1)!;
  const ebitda = terminal.ebit + terminal.revenue * assumptions.daPercentRevenue;
  const tradingPrices = [peerStats.q1, peerStats.median, peerStats.q3].map((multiple) =>
    calculateEvBridge(ebitda * multiple, company).impliedSharePrice,
  );
  const tradingRange: ValuationRange = {
    method: "tradingComps",
    label: "Trading Comps",
    low: tradingPrices[0],
    base: tradingPrices[1],
    high: tradingPrices[2],
    metric: `중앙값 ${peerStats.median.toFixed(1)}x`,
  };
  return [dcfRange, ...multipleRanges, tradingRange].filter((item) => methods.includes(item.method) && item.base > 0);
}
