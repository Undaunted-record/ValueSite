import type { Assumptions, CompanyData, PeerCompany, ValuationMethod } from "@/types/valuation";

export const EMPTY_COMPANY: CompanyData = {
  name: "",
  ticker: "",
  industry: "Mature Manufacturing",
  cash: 0,
  debt: 0,
  preferredStock: 0,
  minorityInterest: 0,
  otherAdjustments: 0,
  sharesOutstanding: 100,
  currentSharePrice: 0,
  bookValue: 0,
  financials: [
    { year: "2024A", type: "actual", revenue: 0, ebit: 0, netIncome: 0 },
    { year: "2025A", type: "actual", revenue: 0, ebit: 0, netIncome: 0 },
    { year: "2026A", type: "actual", revenue: 0, ebit: 0, netIncome: 0 },
    { year: "2027E", type: "estimate", revenue: 0, ebit: 0, netIncome: 0 },
    { year: "2028E", type: "estimate", revenue: 0, ebit: 0, netIncome: 0 },
    { year: "2029E", type: "estimate", revenue: 0, ebit: 0, netIncome: 0 },
  ],
};

export const DEMO_COMPANY: CompanyData = {
  name: "Demo Manufacturing Co.",
  ticker: "DEMO",
  industry: "Mature Manufacturing",
  cash: 420,
  debt: 1280,
  preferredStock: 0,
  minorityInterest: 45,
  otherAdjustments: 20,
  sharesOutstanding: 120,
  currentSharePrice: 42500,
  bookValue: 4380,
  financials: [
    { year: "2024A", type: "actual", revenue: 5950, ebit: 545, netIncome: 340 },
    { year: "2025A", type: "actual", revenue: 6320, ebit: 607, netIncome: 382 },
    { year: "2026A", type: "actual", revenue: 6810, ebit: 681, netIncome: 435 },
    { year: "2027E", type: "estimate", revenue: 7280, ebit: 764, netIncome: 493 },
    { year: "2028E", type: "estimate", revenue: 7750, ebit: 837, netIncome: 548 },
    { year: "2029E", type: "estimate", revenue: 8190, ebit: 901, netIncome: 601 },
  ],
};

export const DEFAULT_ASSUMPTIONS: Assumptions = {
  wacc: 0.085,
  riskFreeRate: 0.032,
  beta: 1.05,
  equityRiskPremium: 0.055,
  costOfDebt: 0.047,
  taxRate: 0.24,
  debtWeight: 0.22,
  terminalGrowth: 0.02,
  exitMultiple: 7.5,
  daPercentRevenue: 0.035,
  capexPercentRevenue: 0.045,
  nwcPercentRevenue: 0.012,
  targetEvEbitda: 7.5,
  targetPe: 12,
  targetPb: 1.4,
  targetEvRevenue: 1.1,
};

export const DEFAULT_METHODS: ValuationMethod[] = ["dcf", "evEbitda", "pe", "tradingComps"];

export const DEMO_PEERS: PeerCompany[] = [
  { id: "1", company: "Alpha Industrial", enterpriseValue: 7200, marketCap: 6100, revenue: 7600, ebitda: 930, ebit: 690, netIncome: 500 },
  { id: "2", company: "Beta Components", enterpriseValue: 8350, marketCap: 7060, revenue: 8100, ebitda: 1015, ebit: 770, netIncome: 570 },
  { id: "3", company: "Gamma Systems", enterpriseValue: 6650, marketCap: 5900, revenue: 6920, ebitda: 815, ebit: 625, netIncome: 455 },
  { id: "4", company: "Delta Manufacturing", enterpriseValue: 9420, marketCap: 8110, revenue: 8750, ebitda: 1120, ebit: 860, netIncome: 625 },
];

export const INDUSTRIES = [
  "Mature Manufacturing",
  "Banking & Financials",
  "High-growth / Loss-making",
  "Technology & Software",
  "Telecom & Infrastructure",
  "Consumer & Retail",
  "M&A Target",
];
