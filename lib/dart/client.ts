import type { DartCompanyOverview, DartCompanyRecord, NormalizedDartFinancials } from "./types";

export interface DartStatus { configured: boolean; }

export class DartClientError extends Error {
  constructor(message: string, public readonly retryable = false) {
    super(message);
    this.name = "DartClientError";
  }
}

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal });
  const body = await response.json().catch(() => null) as { error?: string; retryable?: boolean } | T | null;
  if (!response.ok) {
    const error = body as { error?: string; retryable?: boolean } | null;
    throw new DartClientError(error?.error ?? "기업 정보를 불러오지 못했습니다.", error?.retryable);
  }
  return body as T;
}

export const dartClient = {
  status: (signal?: AbortSignal) => getJson<DartStatus>("/api/dart/status", signal),
  searchCompanies: (query: string, signal?: AbortSignal) => getJson<DartCompanyRecord[]>(`/api/dart/search?q=${encodeURIComponent(query)}`, signal),
  getCompany: (corpCode: string, signal?: AbortSignal) => getJson<DartCompanyOverview>(`/api/dart/company?corpCode=${encodeURIComponent(corpCode)}`, signal),
  getFinancials: (corpCode: string, signal?: AbortSignal) => getJson<NormalizedDartFinancials>(`/api/dart/financials?corpCode=${encodeURIComponent(corpCode)}`, signal),
};
