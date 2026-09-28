export interface MarketSnapshot {
  ticker: string;
  price: number;
  marketCap: number;
  asOf: string;
  provider: string;
}

export interface MarketDataProvider {
  getSnapshot(ticker: string): Promise<MarketSnapshot | null>;
}

// 시장가격은 별도 공급자의 이용약관과 인증키가 확인된 뒤 이 인터페이스로 연결한다.
export const marketDataProvider: MarketDataProvider | null = null;
