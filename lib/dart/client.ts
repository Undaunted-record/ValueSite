export interface DartCompanyMatch {
  corpCode: string;
  corpName: string;
  stockCode: string;
}

export interface HistoricalFinancial {
  year: string;
  revenue: number;
  operatingProfit: number;
  netIncome: number;
  assets: number;
  liabilities: number;
  equity: number;
}

export interface DartDataSource {
  searchCompanies(query: string): Promise<DartCompanyMatch[]>;
  getHistoricalFinancials(corpCode: string): Promise<HistoricalFinancial[]>;
}

/**
 * Browser-safe data layer contract. The production implementation should call
 * a server route so OPEN_DART_API_KEY is never exposed to the client.
 */
export const dartClient: DartDataSource = {
  async searchCompanies(query) {
    const response = await fetch(`/api/dart/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) return [];
    return response.json();
  },
  async getHistoricalFinancials(corpCode) {
    const response = await fetch(`/api/dart/financials?corpCode=${encodeURIComponent(corpCode)}`);
    if (!response.ok) return [];
    return response.json();
  },
};
