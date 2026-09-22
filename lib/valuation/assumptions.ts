import type { ValuationMethod } from "@/types/valuation";

export const METHOD_META: Record<ValuationMethod, { label: string; short: string; suitable: string; caution: string }> = {
  dcf: { label: "DCF", short: "미래 현금흐름을 현재가치로 할인합니다.", suitable: "현금흐름을 비교적 안정적으로 예측할 수 있는 기업", caution: "WACC, 영구성장률, 장기 추정치 변화에 민감합니다." },
  evEbitda: { label: "EV / EBITDA", short: "자본구조와 비현금비용 차이를 줄여 비교합니다.", suitable: "제조업, 산업재, 통신 등 자본집약적 산업", caution: "반복적인 CAPEX와 운전자본 부담을 충분히 반영하지 못할 수 있습니다." },
  pe: { label: "P / E", short: "순이익 대비 주주가치 수준을 비교합니다.", suitable: "안정적인 흑자를 내는 상장기업", caution: "적자기업이나 레버리지가 높은 기업에는 적합하지 않을 수 있습니다." },
  pb: { label: "P / B", short: "회계상 자기자본 대비 시장가치를 비교합니다.", suitable: "은행, 보험 등 자기자본이 수익창출의 기반인 금융회사", caution: "무형자산이 핵심인 기업에는 유용성이 낮을 수 있습니다." },
  evRevenue: { label: "EV / Revenue", short: "매출액 대비 기업가치 수준을 비교합니다.", suitable: "아직 EBITDA가 적자이지만 빠르게 성장하는 기업", caution: "수익성과 마진 구조의 차이를 반영하지 못합니다." },
  tradingComps: { label: "Trading Comps", short: "유사 상장사의 시장 멀티플을 적용합니다.", suitable: "사업구조가 유사한 비교기업을 충분히 확보할 수 있는 기업", caution: "Peer 선정과 시장 사이클에 따라 결과가 크게 달라질 수 있습니다." },
};

export const INDUSTRY_RECOMMENDATIONS: Record<string, ValuationMethod[]> = {
  "은행·금융": ["pb", "pe"],
  "성숙 제조업": ["evEbitda", "dcf"],
  "고성장·적자기업": ["evRevenue", "dcf"],
  "기술·소프트웨어": ["evRevenue", "tradingComps", "dcf"],
  "통신·인프라": ["evEbitda", "dcf"],
  "소비재·유통": ["evEbitda", "pe", "tradingComps"],
  "M&A 대상기업": ["tradingComps", "dcf"],
};
