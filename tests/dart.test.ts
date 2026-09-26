import { describe, expect, it } from "vitest";
import { strToU8, zipSync } from "fflate";
import { DEMO_COMPANY } from "@/data/demo";
import { parseCorpCodeXml, parseCorpCodeZip, parseListedCorpCsv, searchCorpCodes, searchCorpCodeXml } from "@/lib/dart/corp-codes";
import { getDartErrorMessage } from "@/lib/dart/errors";
import { mergeDartCompany } from "@/lib/dart/merge";
import { normalizeFinancialStatements, parseDartAmount, STATEMENT_PREFERENCE } from "@/lib/dart/normalize";
import type { DartAccountRow, DartAnnualStatement, DartCompanyOverview } from "@/lib/dart/types";

const xml = `<?xml version="1.0" encoding="UTF-8"?><result>
  <list><corp_code>00126380</corp_code><corp_name>삼성전자</corp_name><corp_eng_name>Samsung Electronics</corp_eng_name><stock_code>005930</stock_code><modify_date>20260101</modify_date></list>
  <list><corp_code>00999999</corp_code><corp_name>삼성전자서비스</corp_name><corp_eng_name>Samsung Service</corp_eng_name><stock_code></stock_code><modify_date>20260101</modify_date></list>
  <list><corp_code>00401731</corp_code><corp_name>카카오</corp_name><corp_eng_name>Kakao</corp_eng_name><stock_code>035720</stock_code><modify_date>20260101</modify_date></list>
</result>`;

function row(accountId: string, accountName: string, amount: string, sjDiv: "BS" | "IS" = "IS"): DartAccountRow {
  return { account_id: accountId, account_nm: accountName, thstrm_amount: amount, sj_div: sjDiv };
}

function statement(year: string, statementType: "CFS" | "OFS" = "CFS"): DartAnnualStatement {
  return {
    year,
    statementType,
    rows: [
      row("ifrs-full_Revenue", "매출액", "10,000,000,000"),
      row("dart_OperatingIncomeLoss", "영업이익", "1,200,000,000"),
      row("ifrs-full_ProfitLoss", "당기순이익", "(800,000,000)"),
      row("ifrs-full_CashAndCashEquivalents", "현금및현금성자산", "2,000,000,000", "BS"),
      row("ifrs-full_ShorttermBorrowings", "단기차입금", "500,000,000", "BS"),
      row("ifrs-full_LongtermBorrowings", "장기차입금", "1,500,000,000", "BS"),
      row("ifrs-full_Equity", "자본총계", "6,000,000,000", "BS"),
    ],
  };
}

describe("OpenDART normalization", () => {
  it("parses the corp-code XML and ZIP payload", () => {
    expect(parseCorpCodeXml(xml)).toHaveLength(3);
    const zipped = zipSync({ "CORPCODE.xml": strToU8(xml) });
    expect(parseCorpCodeZip(zipped.buffer as ArrayBuffer)[0].stockCode).toBe("005930");
  });

  it("parses a quoted listed-company CSV index", () => {
    const csv = `corp_code,corp_name,corp_eng_name,stock_code,modify_date\n00126380,삼성전자,"SAMSUNG ELECTRONICS CO., LTD.",005930,20250101`;
    expect(parseListedCorpCsv(csv)[0]).toMatchObject({ corpCode: "00126380", corpName: "삼성전자", stockCode: "005930", corpEngName: "SAMSUNG ELECTRONICS CO., LTD." });
  });

  it("ranks stock-code exact matches and excludes non-listed partial matches", () => {
    const companies = parseCorpCodeXml(xml);
    expect(searchCorpCodes(companies, "005930")[0].corpName).toBe("삼성전자");
    expect(searchCorpCodes(companies, "삼성").map((item) => item.corpName)).toEqual(["삼성전자"]);
    expect(searchCorpCodes(companies, "삼성전자서비스")[0].corpCode).toBe("00999999");
    expect(searchCorpCodeXml(xml, "005930")[0].corpName).toBe("삼성전자");
    expect(searchCorpCodeXml(xml, "삼성").map((item) => item.corpName)).toEqual(["삼성전자"]);
  });

  it("prefers CFS before OFS", () => {
    expect(STATEMENT_PREFERENCE).toEqual(["CFS", "OFS"]);
  });

  it("converts won to billions, parses negative amounts and avoids duplicate debt totals", () => {
    const normalized = normalizeFinancialStatements("00126380", [statement("2023"), statement("2024"), statement("2025")]);
    expect(normalized.financials[2]).toMatchObject({ year: "2025A", revenue: 10, ebit: 1.2, netIncome: -0.8 });
    expect(normalized.cash).toBe(2);
    expect(normalized.debt).toBe(2);
    expect(normalized.bookValue).toBe(6);
    expect(parseDartAmount("(1,000)")).toBe(-1000);
  });

  it("uses Korean aliases when an account id is unavailable", () => {
    const aliased = statement("2025");
    aliased.rows[0].account_id = "custom_Revenue";
    expect(normalizeFinancialStatements("00126380", [aliased]).financials[0].revenue).toBe(10);
  });

  it("marks missing fields instead of inventing values and warns on OFS fallback", () => {
    const incomplete = statement("2025", "OFS");
    incomplete.rows = incomplete.rows.filter((item) => item.account_id !== "ifrs-full_CashAndCashEquivalents");
    const normalized = normalizeFinancialStatements("00126380", [incomplete]);
    expect(normalized.cash).toBeUndefined();
    expect(normalized.metadata.missingFields).toContain("cash");
    expect(normalized.metadata.warnings.some((warning) => warning.includes("별도재무제표"))).toBe(true);
  });

  it("preserves forecasts and valuation-only inputs when applying an import", () => {
    const normalized = normalizeFinancialStatements("00126380", [statement("2023"), statement("2024"), statement("2025")]);
    const overview: DartCompanyOverview = { corpCode: "00126380", corpName: "삼성전자", corpNameEng: "Samsung Electronics", stockName: "삼성전자", stockCode: "005930", ceoName: "", industryCode: "", address: "", homepage: "" };
    const merged = mergeDartCompany(DEMO_COMPANY, overview, normalized, true);
    expect(merged.name).toBe("삼성전자");
    expect(merged.financials.slice(3).map((item) => item.revenue)).toEqual(DEMO_COMPANY.financials.slice(3).map((item) => item.revenue));
    expect(merged.currentSharePrice).toBe(DEMO_COMPANY.currentSharePrice);
    expect(merged.sharesOutstanding).toBe(DEMO_COMPANY.sharesOutstanding);
  });

  it("maps OpenDART status codes to safe Korean messages", () => {
    expect(getDartErrorMessage("020")).toContain("요청 한도");
    expect(getDartErrorMessage("010")).not.toContain("OPEN_DART_API_KEY");
  });
});
