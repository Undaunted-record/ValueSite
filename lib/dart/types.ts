import type { DartFieldSource, DartImportMeta, DartStatementType, FinancialPeriod } from "@/types/valuation";

export interface DartCompanyRecord {
  corpCode: string;
  corpName: string;
  corpEngName: string;
  stockCode: string;
  modifyDate: string;
}

export interface DartCompanyOverview {
  corpCode: string;
  corpName: string;
  corpNameEng: string;
  stockName: string;
  stockCode: string;
  ceoName: string;
  industryCode: string;
  address: string;
  homepage: string;
}

export interface DartAccountRow {
  rcept_no?: string;
  reprt_code?: string;
  bsns_year?: string;
  corp_code?: string;
  sj_div?: string;
  sj_nm?: string;
  account_id?: string;
  account_nm?: string;
  account_detail?: string;
  thstrm_nm?: string;
  thstrm_amount?: string;
  frmtrm_nm?: string;
  frmtrm_amount?: string;
  bfefrmtrm_nm?: string;
  bfefrmtrm_amount?: string;
  ord?: string;
}

export interface DartAnnualStatement {
  year: string;
  statementType: DartStatementType;
  rows: DartAccountRow[];
}

export interface NormalizedDartFinancials {
  corpCode: string;
  financials: FinancialPeriod[];
  cash?: number;
  debt?: number;
  bookValue?: number;
  metadata: DartImportMeta;
}

export interface MappedAccount {
  value: number;
  source: DartFieldSource;
}

export interface DartApiErrorBody {
  error: string;
  code?: string;
  retryable?: boolean;
}
