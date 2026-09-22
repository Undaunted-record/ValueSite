import type { ValuationMethod } from "@/types/valuation";

export const METHOD_META: Record<ValuationMethod, { label: string; short: string; suitable: string; caution: string }> = {
  dcf: { label: "DCF", short: "Discount forecast cash flows to present value.", suitable: "Predictable cash-flow businesses with visible forecasts.", caution: "Highly sensitive to WACC, terminal growth and long-range forecasts." },
  evEbitda: { label: "EV / EBITDA", short: "Compare enterprise value before financing and non-cash D&A.", suitable: "Manufacturing, industrials, telecom and capital-intensive sectors.", caution: "Can obscure large recurring capex or working-capital needs." },
  pe: { label: "P / E", short: "Value equity as a multiple of net income.", suitable: "Listed companies with stable, positive earnings.", caution: "Not meaningful for loss-making or highly leveraged businesses." },
  pb: { label: "P / B", short: "Compare market value with accounting equity.", suitable: "Banks, insurers and balance-sheet-driven financial companies.", caution: "Less useful when intangible assets drive most economic value." },
  evRevenue: { label: "EV / Revenue", short: "Value the business as a multiple of revenue.", suitable: "High-growth companies that have not yet reached positive EBITDA.", caution: "Ignores differences in margins and future profitability." },
  tradingComps: { label: "Trading Comps", short: "Apply observed public-market peer multiples.", suitable: "Businesses with a credible, sufficiently similar peer set.", caution: "Peer selection and market cycles can materially affect the result." },
};

export const INDUSTRY_RECOMMENDATIONS: Record<string, ValuationMethod[]> = {
  "Banking & Financials": ["pb", "pe"],
  "Mature Manufacturing": ["evEbitda", "dcf"],
  "High-growth / Loss-making": ["evRevenue", "dcf"],
  "Technology & Software": ["evRevenue", "tradingComps", "dcf"],
  "Telecom & Infrastructure": ["evEbitda", "dcf"],
  "Consumer & Retail": ["evEbitda", "pe", "tradingComps"],
  "M&A Target": ["tradingComps", "dcf"],
};
