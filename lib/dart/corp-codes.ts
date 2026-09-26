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
  return parseCorpCodeXml(extractCorpCodeXml(buffer));
}

export function extractCorpCodeXml(buffer: ArrayBuffer): string {
  const files = unzipSync(new Uint8Array(buffer));
  const xmlFile = Object.entries(files).find(([name]) => name.toLowerCase().endsWith(".xml"));
  if (!xmlFile) throw new Error("OpenDART 고유번호 XML 파일을 찾지 못했습니다.");
  return strFromU8(xmlFile[1]);
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

/** Vercel 함수에서 전체 목록을 객체로 만들지 않고 일치 후보만 할당한다. */
export function searchCorpCodeXml(xml: string, query: string, limit = 10) {
  const normalized = normalizeSearch(query);
  const candidates: Array<{ company: DartCompanyRecord; score: number }> = [];
  for (const match of xml.matchAll(/<list>([\s\S]*?)<\/list>/gi)) {
    const block = match[1];
    const corpName = readTag(block, "corp_name");
    const stockCode = readTag(block, "stock_code");
    const name = normalizeSearch(corpName);
    const score = stockCode === normalized ? 0 : name === normalized ? 1 : name.startsWith(normalized) ? 2 : name.includes(normalized) ? 3 : 99;
    if (score === 99 || (!stockCode && name !== normalized)) continue;
    candidates.push({
      score,
      company: {
        corpCode: readTag(block, "corp_code"),
        corpName,
        corpEngName: readTag(block, "corp_eng_name"),
        stockCode,
        modifyDate: readTag(block, "modify_date"),
      },
    });
  }
  return candidates
    .sort((a, b) => a.score - b.score || a.company.corpName.localeCompare(b.company.corpName, "ko"))
    .slice(0, Math.max(1, Math.min(limit, 10)))
    .map(({ company }) => company);
}

function parseCsvLine(line: string) {
  const values: string[] = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') { value += '"'; index += 1; }
      else quoted = !quoted;
    } else if (character === "," && !quoted) {
      values.push(value.trim()); value = "";
    } else value += character;
  }
  values.push(value.trim());
  return values;
}

export function parseListedCorpCsv(csv: string): DartCompanyRecord[] {
  const lines = csv.replace(/^\uFEFF/, "").split(/\r?\n/).filter(Boolean);
  const headers = parseCsvLine(lines.shift() ?? "");
  const positions = Object.fromEntries(headers.map((header, index) => [header, index]));
  return lines.map((line) => {
    const values = parseCsvLine(line);
    return {
      corpCode: values[positions.corp_code] ?? "",
      corpName: values[positions.corp_name] ?? "",
      corpEngName: values[positions.corp_eng_name] ?? "",
      stockCode: values[positions.stock_code] ?? "",
      modifyDate: values[positions.modify_date] ?? "",
    };
  }).filter((company) => /^\d{8}$/.test(company.corpCode) && /^\d{6}$/.test(company.stockCode) && company.corpName.length > 0);
}
