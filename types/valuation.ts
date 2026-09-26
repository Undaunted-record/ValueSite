export type Mode = "quick" | "advanced";
export type DataSource = "empty" | "demo" | "user" | "dart";
export type TerminalMethod = "gordon" | "exitMultiple";
export type ValuationMethod =
  | "dcf"
  | "evEbitda"
  | "pe"
  | "pb"
  | "evRevenue"
  | "tradingComps";

export interface FinancialPeriod {
  year: string;
  type: "actual" | "estimate";
  revenue: number;
  ebit: number;
  netIncome: number;
}

export interface CompanyData {
  name: string;
  ticker: string;
  corpCode?: string;
  industry: string;
  cash: number;
  debt: number;
  preferredStock: number;
  minorityInterest: number;
  otherAdjustments: number;
  sharesOutstanding: number;
  currentSharePrice: number;
  bookValue: number;
  financials: FinancialPeriod[];
}

export interface Assumptions {
  wacc: number;
  riskFreeRate: number;
  beta: number;
  equityRiskPremium: number;
  costOfDebt: number;
  taxRate: number;
  debtWeight: number;
  terminalGrowth: number;
  exitMultiple: number;
  daPercentRevenue: number;
  capexPercentRevenue: number;
  nwcPercentRevenue: number;
  targetEvEbitda: number;
  targetPe: number;
  targetPb: number;
  targetEvRevenue: number;
}

export interface PeerCompany {
  id: string;
  company: string;
  enterpriseValue: number;
  marketCap: number;
  revenue: number;
  ebitda: number;
  ebit: number;
  netIncome: number;
}

export interface DcfProjection {
  year: string;
  revenue: number;
  ebit: number;
  nopat: number;
  da: number;
  capex: number;
  changeNwc: number;
  ufcf: number;
  discountFactor: number;
  presentValue: number;
}

export interface ValuationRange {
  method: ValuationMethod;
  label: string;
  low: number;
  base: number;
  high: number;
  metric?: string;
}

export interface DcfResult {
  enterpriseValue: number;
  terminalValue: number;
  terminalValuePercent: number;
  projections: DcfProjection[];
}

export type DartStatementType = "CFS" | "OFS";

export interface DartFieldSource {
  field: string;
  year: string;
  reportName: string;
  statementType: DartStatementType;
  accountId: string;
  accountName: string;
  rawAmount: number;
}

export interface DartImportMeta {
  corpCode: string;
  corpName: string;
  stockCode: string;
  statementType: DartStatementType;
  latestYear: string;
  fetchedAt: string;
  sources: Record<string, DartFieldSource>;
  missingFields: string[];
  warnings: string[];
  editedFields: string[];
}

export interface BridgeResult {
  enterpriseValue: number;
  debt: number;
  cash: number;
  preferredStock: number;
  minorityInterest: number;
  otherAdjustments: number;
  equityValue: number;
  impliedSharePrice: number;
}

export interface ValidationIssue {
  severity: "error" | "warning";
  field: string;
  message: string;
}
