import "server-only";

import { get as httpsGet } from "node:https";
import { extractCorpCodeXml, searchCorpCodeXml } from "./corp-codes";
import { DartApiError } from "./errors";
import { normalizeFinancialStatements, STATEMENT_PREFERENCE } from "./normalize";
import type { DartAccountRow, DartAnnualStatement, DartCompanyOverview } from "./types";

const DART_BASE_URL = "https://opendart.fss.or.kr/api";
const REQUEST_TIMEOUT_MS = 12_000;
const CORP_CODE_TTL_MS = 24 * 60 * 60 * 1000;
let corpCodeCache: { expiresAt: number; xml: string } | null = null;
let corpCodePromise: Promise<string> | null = null;

function apiKey() {
  const key = process.env.OPEN_DART_API_KEY?.trim();
  if (!key) throw new DartApiError("010", "기업 자동 불러오기가 현재 비활성화되어 있습니다.");
  return key;
}

function dartUrl(endpoint: string, params: Record<string, string> = {}) {
  const url = new URL(`${DART_BASE_URL}/${endpoint}`);
  url.searchParams.set("crtfc_key", apiKey());
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  return url;
}

function requestDart(url: URL, maxBytes = 60 * 1024 * 1024): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const request = httpsGet(url, { family: 4, timeout: REQUEST_TIMEOUT_MS, headers: { "User-Agent": "ValueSite/1.0" } }, (response) => {
      if (!response.statusCode || response.statusCode < 200 || response.statusCode >= 300) {
        response.resume();
        reject(new Error(`OpenDART HTTP ${response.statusCode ?? 0}`));
        return;
      }
      const chunks: Buffer[] = [];
      let size = 0;
      response.on("data", (chunk: Buffer) => {
        size += chunk.length;
        if (size > maxBytes) {
          request.destroy(new Error("OpenDART 응답 크기가 제한을 초과했습니다."));
          return;
        }
        chunks.push(chunk);
      });
      response.on("end", () => resolve(Buffer.concat(chunks)));
      response.on("error", reject);
    });
    request.on("timeout", () => request.destroy(new DOMException("Request timed out", "AbortError")));
    request.on("error", reject);
  });
}

async function fetchDartJson<T>(endpoint: string, params: Record<string, string>, revalidate = 21_600): Promise<T> {
  void revalidate;
  const body = JSON.parse((await requestDart(dartUrl(endpoint, params), 20 * 1024 * 1024)).toString("utf8")) as { status?: string; message?: string } & T;
  if (body.status && body.status !== "000") throw new DartApiError(body.status);
  return body;
}

async function loadCorpCodeXml() {
  if (corpCodeCache && corpCodeCache.expiresAt > Date.now()) return corpCodeCache.xml;
  if (corpCodePromise) return corpCodePromise;
  corpCodePromise = (async () => {
    const archiveBuffer = await requestDart(dartUrl("corpCode.xml"));
    if (archiveBuffer[0] !== 0x50 || archiveBuffer[1] !== 0x4b) {
      const errorXml = archiveBuffer.toString("utf8");
      const status = errorXml.match(/<status>(\d+)<\/status>/)?.[1] ?? "900";
      throw new DartApiError(status);
    }
    const archive = archiveBuffer.buffer.slice(archiveBuffer.byteOffset, archiveBuffer.byteOffset + archiveBuffer.byteLength) as ArrayBuffer;
    const xml = extractCorpCodeXml(archive);
    corpCodeCache = { xml, expiresAt: Date.now() + CORP_CODE_TTL_MS };
    return xml;
  })();
  try {
    return await corpCodePromise;
  } finally {
    corpCodePromise = null;
  }
}

export async function searchDartCompanies(query: string) {
  return searchCorpCodeXml(await loadCorpCodeXml(), query, 10);
}

export async function getDartCompany(corpCode: string): Promise<DartCompanyOverview> {
  const body = await fetchDartJson<Record<string, string>>("company.json", { corp_code: corpCode }, 86_400);
  return {
    corpCode: body.corp_code ?? corpCode,
    corpName: body.corp_name ?? "",
    corpNameEng: body.corp_name_eng ?? "",
    stockName: body.stock_name ?? "",
    stockCode: body.stock_code ?? "",
    ceoName: body.ceo_nm ?? "",
    industryCode: body.induty_code ?? "",
    address: body.adres ?? "",
    homepage: body.hm_url ?? "",
  };
}

async function getAnnualStatement(corpCode: string, year: number): Promise<DartAnnualStatement | null> {
  for (const statementType of STATEMENT_PREFERENCE) {
    try {
      const body = await fetchDartJson<{ list?: DartAccountRow[] }>("fnlttSinglAcntAll.json", {
        corp_code: corpCode,
        bsns_year: String(year),
        reprt_code: "11011",
        fs_div: statementType,
      });
      if (body.list?.length) return { year: String(year), statementType, rows: body.list };
    } catch (error) {
      if (!(error instanceof DartApiError) || error.code !== "013") throw error;
    }
  }
  return null;
}

export async function getDartFinancials(corpCode: string) {
  const currentYear = new Date().getFullYear();
  const statements: DartAnnualStatement[] = [];
  for (let year = currentYear - 1; year >= currentYear - 6 && statements.length < 3; year -= 1) {
    const statement = await getAnnualStatement(corpCode, year);
    if (statement) statements.push(statement);
  }
  if (!statements.length) throw new DartApiError("013");
  return normalizeFinancialStatements(corpCode, statements);
}
