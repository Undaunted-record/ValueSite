import type { DartFieldSource, DartStatementType, FinancialPeriod } from "@/types/valuation";
import type { DartAccountRow, DartAnnualStatement, MappedAccount, NormalizedDartFinancials } from "./types";

const WON_PER_BILLION = 1_000_000_000;
export const STATEMENT_PREFERENCE: DartStatementType[] = ["CFS", "OFS"];

export function parseDartAmount(value?: string) {
  if (!value?.trim() || value.trim() === "-") return undefined;
  const normalized = value.replaceAll(",", "").replaceAll(" ", "").trim();
  const parenthesized = /^\((.+)\)$/.exec(normalized);
  const parsed = Number(parenthesized ? `-${parenthesized[1]}` : normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function wonToBillions(value: number) {
  return value / WON_PER_BILLION;
}

function normalizeName(value?: string) {
  return (value ?? "").replace(/[\s·]/g, "").toLocaleLowerCase("ko-KR");
}

function sourceFor(row: DartAccountRow, year: string, statementType: DartStatementType, field: string, amount: number): DartFieldSource {
  return {
    field,
    year,
    reportName: `${year}년 사업보고서`,
    statementType,
    accountId: row.account_id ?? "",
    accountName: row.account_nm ?? "",
    rawAmount: amount,
  };
}

function findAccount(
  rows: DartAccountRow[],
  year: string,
  statementType: DartStatementType,
  field: string,
  accountIds: string[],
  aliases: string[],
  statementSections?: string[],
): MappedAccount | undefined {
  const candidates = statementSections ? rows.filter((row) => statementSections.includes(row.sj_div ?? "")) : rows;
  const byId = accountIds.map((id) => candidates.find((row) => row.account_id === id)).find(Boolean);
  const normalizedAliases = aliases.map(normalizeName);
  const byName = candidates.find((row) => normalizedAliases.includes(normalizeName(row.account_nm)));
  const row = byId ?? byName;
  const amount = parseDartAmount(row?.thstrm_amount);
  if (!row || amount === undefined) return undefined;
  return { value: wonToBillions(amount), source: sourceFor(row, year, statementType, field, amount) };
}

const REVENUE_IDS = ["ifrs-full_Revenue", "ifrs-full_RevenueFromContractsWithCustomers"];
const REVENUE_NAMES = ["매출액", "영업수익", "수익"];
const EBIT_IDS = ["dart_OperatingIncomeLoss"];
const EBIT_NAMES = ["영업이익", "영업이익(손실)", "영업손실"];
const NET_INCOME_IDS = ["ifrs-full_ProfitLossAttributableToOwnersOfParent", "ifrs-full_ProfitLoss"];
const NET_INCOME_NAMES = ["지배기업소유주지분순이익", "지배기업의소유주에게귀속되는당기순이익", "당기순이익", "당기순이익(손실)", "연결당기순이익"];
const CASH_IDS = ["ifrs-full_CashAndCashEquivalents"];
const CASH_NAMES = ["현금및현금성자산", "현금및현금성자산의합계"];
const EQUITY_IDS = ["ifrs-full_Equity", "ifrs-full_EquityAttributableToOwnersOfParent"];
const EQUITY_NAMES = ["자본총계", "지배기업소유주지분", "지배기업의소유주에게귀속되는자본"];

const DEBT_CATEGORIES = [
  { ids: ["ifrs-full_ShorttermBorrowings"], names: ["단기차입금"] },
  { ids: ["dart_CurrentPortionOfLongTermBorrowings", "ifrs-full_CurrentPortionOfLongtermBorrowings"], names: ["유동성장기차입금", "유동성장기부채"] },
  { ids: ["ifrs-full_LongtermBorrowings"], names: ["장기차입금"] },
  { ids: ["dart_CurrentPortionOfBondsIssued", "ifrs-full_CurrentPortionOfBonds"], names: ["유동성사채"] },
  { ids: ["ifrs-full_BondsIssued"], names: ["사채"] },
] as const;

export function normalizeFinancialStatements(corpCode: string, statements: DartAnnualStatement[]): NormalizedDartFinancials {
  const sorted = [...statements].sort((a, b) => Number(a.year) - Number(b.year)).slice(-3);
  if (!sorted.length) throw new Error("정규화할 재무제표가 없습니다.");
  const sources: Record<string, DartFieldSource> = {};
  const missingFields: string[] = [];
  const warnings: string[] = [];

  const financials: FinancialPeriod[] = sorted.map(({ year, statementType, rows }) => {
    const revenue = findAccount(rows, year, statementType, "revenue", REVENUE_IDS, REVENUE_NAMES, ["IS", "CIS"]);
    const ebit = findAccount(rows, year, statementType, "ebit", EBIT_IDS, EBIT_NAMES, ["IS", "CIS"]);
    const netIncome = findAccount(rows, year, statementType, "netIncome", NET_INCOME_IDS, NET_INCOME_NAMES, ["IS", "CIS"]);
    for (const [name, account] of Object.entries({ revenue, ebit, netIncome })) {
      const key = `financials.${year}.${name}`;
      if (account) sources[key] = account.source;
      else missingFields.push(key);
    }
    return {
      year: `${year}A`,
      type: "actual",
      revenue: revenue?.value ?? 0,
      ebit: ebit?.value ?? 0,
      netIncome: netIncome?.value ?? 0,
    };
  });

  const latest = sorted.at(-1)!;
  const cash = findAccount(latest.rows, latest.year, latest.statementType, "cash", CASH_IDS, CASH_NAMES, ["BS"]);
  const bookValue = findAccount(latest.rows, latest.year, latest.statementType, "bookValue", EQUITY_IDS, EQUITY_NAMES, ["BS"]);
  const debtParts = DEBT_CATEGORIES.map((category, index) => findAccount(
    latest.rows,
    latest.year,
    latest.statementType,
    `debt.${index}`,
    [...category.ids],
    [...category.names],
    ["BS"],
  )).filter((account): account is MappedAccount => Boolean(account));
  const debt = debtParts.length ? debtParts.reduce((sum, account) => sum + account.value, 0) : undefined;

  if (cash) sources.cash = cash.source; else missingFields.push("cash");
  if (bookValue) sources.bookValue = bookValue.source; else missingFields.push("bookValue");
  if (debtParts.length) {
    sources.debt = { ...debtParts[0].source, field: "debt", accountName: debtParts.map((part) => part.source.accountName).join(" + "), rawAmount: debtParts.reduce((sum, part) => sum + part.source.rawAmount, 0) };
  } else missingFields.push("debt");
  if (latest.statementType === "OFS") warnings.push("연결재무제표를 확인할 수 없어 별도재무제표를 사용했습니다.");
  if (missingFields.length) warnings.push("일부 항목은 공시에서 확인되지 않아 직접 입력이 필요합니다.");

  return {
    corpCode,
    financials,
    cash: cash?.value,
    debt,
    bookValue: bookValue?.value,
    metadata: {
      corpCode,
      corpName: "",
      stockCode: "",
      statementType: latest.statementType,
      latestYear: latest.year,
      fetchedAt: new Date().toISOString(),
      sources,
      missingFields,
      warnings,
      editedFields: [],
    },
  };
}
