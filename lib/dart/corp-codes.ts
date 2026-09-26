import { unzipSync, strFromU8 } from "fflate";
import type { DartCompanyRecord } from "./types";

function decodeXml(value: string) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .trim();
}

function readTag(block: string, tag: string) {
  const match = block.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return decodeXml(match?.[1] ?? "");
}

export function parseCorpCodeXml(xml: string): DartCompanyRecord[] {
  return [...xml.matchAll(/<list>([\s\S]*?)<\/list>/gi)].map((match) => ({
    corpCode: readTag(match[1], "corp_code"),
    corpName: readTag(match[1], "corp_name"),
    corpEngName: readTag(match[1], "corp_eng_name"),
    stockCode: readTag(match[1], "stock_code"),
    modifyDate: readTag(match[1], "modify_date"),
  })).filter((company) => /^\d{8}$/.test(company.corpCode) && company.corpName.length > 0);
}

export function parseCorpCodeZip(buffer: ArrayBuffer): DartCompanyRecord[] {
  const files = unzipSync(new Uint8Array(buffer));
  const xmlFile = Object.entries(files).find(([name]) => name.toLowerCase().endsWith(".xml"));
  if (!xmlFile) throw new Error("OpenDART 고유번호 XML 파일을 찾지 못했습니다.");
  return parseCorpCodeXml(strFromU8(xmlFile[1]));
}

function normalizeSearch(value: string) {
  return value.replace(/\s+/g, "").toLocaleLowerCase("ko-KR");
}

export function searchCorpCodes(companies: DartCompanyRecord[], query: string, limit = 10) {
  const normalized = normalizeSearch(query);
  return companies
    .filter((company) => company.stockCode || normalizeSearch(company.corpName) === normalized)
    .map((company) => {
      const name = normalizeSearch(company.corpName);
      const score = company.stockCode === normalized ? 0 : name === normalized ? 1 : name.startsWith(normalized) ? 2 : name.includes(normalized) ? 3 : 99;
      return { company, score };
    })
    .filter(({ score }) => score < 99)
    .sort((a, b) => a.score - b.score || a.company.corpName.localeCompare(b.company.corpName, "ko"))
    .slice(0, Math.max(1, Math.min(limit, 10)))
    .map(({ company }) => company);
}
