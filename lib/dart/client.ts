import type { DartCompanyOverview, DartCompanyRecord, NormalizedDartFinancials } from "./types";

export interface DartStatus { configured: boolean; }

export class DartClientError extends Error {
  constructor(message: string, public readonly retryable = false) {
    super(message);
    this.name = "DartClientError";
  }
}

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener("abort", abort, { once: true });
  const timer = window.setTimeout(abort, 25_000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    const body = await response.json().catch(() => null) as { error?: string; retryable?: boolean } | T | null;
    if (!response.ok) {
      const error = body as { error?: string; retryable?: boolean } | null;
      throw new DartClientError(error?.error ?? "기업 정보를 불러오지 못했습니다.", error?.retryable);
    }
    return body as T;
  } catch (error) {
    if (!signal?.aborted && error instanceof DOMException && error.name === "AbortError") {
      throw new DartClientError("기업 정보 응답이 지연되고 있습니다. 잠시 후 다시 시도해 주세요.", true);
    }
    throw error;
  } finally {
    window.clearTimeout(timer);
    signal?.removeEventListener("abort", abort);
  }
}

export const dartClient = {
  status: (signal?: AbortSignal) => getJson<DartStatus>("/api/dart/status", signal),
  searchCompanies: (query: string, signal?: AbortSignal) => getJson<DartCompanyRecord[]>(`/api/dart/search?q=${encodeURIComponent(query)}`, signal),
  getCompany: (corpCode: string, signal?: AbortSignal) => getJson<DartCompanyOverview>(`/api/dart/company?corpCode=${encodeURIComponent(corpCode)}`, signal),
  getFinancials: (corpCode: string, signal?: AbortSignal) => getJson<NormalizedDartFinancials>(`/api/dart/financials?corpCode=${encodeURIComponent(corpCode)}`, signal),
};
