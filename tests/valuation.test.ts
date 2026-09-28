import { describe, expect, it } from "vitest";
import { DEFAULT_ASSUMPTIONS, DEMO_COMPANY, DEMO_PEERS } from "@/data/demo";
import { calculateDcf } from "@/lib/valuation/dcf";
import { calculateEvBridge } from "@/lib/valuation/evBridge";
import { buildValuationRanges } from "@/lib/valuation/footballField";
import { runSanityChecks } from "@/lib/valuation/sanityCheck";
import { calculatePeerMultiples, calculateStats } from "@/lib/valuation/tradingComps";
import { calculateWacc } from "@/lib/valuation/wacc";
import { median, summarizeRanges } from "@/lib/valuation/summary";
import { buildSimpleForecast } from "@/lib/valuation/forecast";
import { assessMethodReadiness } from "@/lib/valuation/readiness";

describe("valuation engine", () => {
  it("calculates a positive DCF enterprise value", () => {
    const result = calculateDcf(DEMO_COMPANY, DEFAULT_ASSUMPTIONS, "gordon");
    expect(result.enterpriseValue).toBeGreaterThan(0);
    expect(result.projections).toHaveLength(3);
    expect(result.terminalValuePercent).toBeGreaterThan(0);
    expect(result.terminalValuePercent).toBeLessThan(1);
  });

  it("keeps the demo valuation regression values stable", () => {
    const dcf = calculateDcf(DEMO_COMPANY, DEFAULT_ASSUMPTIONS, "gordon");
    const bridge = calculateEvBridge(dcf.enterpriseValue, DEMO_COMPANY);
    expect(dcf.enterpriseValue).toBeCloseTo(7377.19, 1);
    expect(bridge.equityValue).toBeCloseTo(6492.19, 1);
    expect(bridge.impliedSharePrice).toBeCloseTo(54101.6, 0);
  });

  it("reconciles enterprise value to equity value and share price", () => {
    const bridge = calculateEvBridge(10_000, DEMO_COMPANY);
    expect(bridge.equityValue).toBe(10_000 - 1_280 + 420 - 45 + 20);
    expect(bridge.impliedSharePrice).toBeCloseTo(bridge.equityValue / 120 * 1000);
  });

  it("derives WACC from capital structure inputs", () => {
    const wacc = calculateWacc(DEFAULT_ASSUMPTIONS);
    expect(wacc).toBeGreaterThan(0.06);
    expect(wacc).toBeLessThan(0.12);
  });

  it("calculates peer statistics", () => {
    const multiples = calculatePeerMultiples(DEMO_PEERS);
    const stats = calculateStats(multiples.map((peer) => peer.evEbitda));
    expect(multiples).toHaveLength(4);
    expect(stats.min).toBeLessThanOrEqual(stats.median);
    expect(stats.median).toBeLessThanOrEqual(stats.max);
  });

  it("blocks terminal growth at or above WACC", () => {
    const issues = runSanityChecks(DEMO_COMPANY, { ...DEFAULT_ASSUMPTIONS, terminalGrowth: 0.09 }, ["dcf"]);
    expect(issues.some((issue) => issue.severity === "error" && issue.field === "terminalGrowth")).toBe(true);
  });

  it("does not block terminal growth when the exit multiple method is active", () => {
    const issues = runSanityChecks(DEMO_COMPANY, { ...DEFAULT_ASSUMPTIONS, terminalGrowth: 0.09 }, ["dcf"], "exitMultiple");
    expect(issues.some((issue) => issue.field === "terminalGrowth" && issue.severity === "error")).toBe(false);
  });

  it("changes DCF but not multiple valuation when WACC changes", () => {
    const before = buildValuationRanges(DEMO_COMPANY, DEFAULT_ASSUMPTIONS, ["dcf", "evEbitda"], DEMO_PEERS, "gordon");
    const after = buildValuationRanges(DEMO_COMPANY, { ...DEFAULT_ASSUMPTIONS, wacc: 0.095 }, ["dcf", "evEbitda"], DEMO_PEERS, "gordon");
    expect(after.find((item) => item.method === "dcf")?.base).not.toBeCloseTo(before.find((item) => item.method === "dcf")!.base);
    expect(after.find((item) => item.method === "evEbitda")?.base).toBeCloseTo(before.find((item) => item.method === "evEbitda")!.base);
  });

  it("excludes zero and negative denominators from peer statistics", () => {
    const multiples = calculatePeerMultiples([
      { ...DEMO_PEERS[0], id: "zero", ebitda: 0, netIncome: 0 },
      { ...DEMO_PEERS[1], id: "negative", ebitda: -10, netIncome: -10 },
    ]);
    expect(multiples.every((item) => item.evEbitda === null && item.pe === null)).toBe(true);
    expect(calculateStats(multiples.map((item) => item.evEbitda)).median).toBe(0);
  });

  it("uses the median rather than the arithmetic mean for the representative value", () => {
    expect(median([10, 20, 100, 200])).toBe(60);
    const summary = summarizeRanges([
      { method: "dcf", label: "DCF", low: 8, base: 10, high: 12 },
      { method: "pe", label: "P / E", low: 80, base: 100, high: 120 },
      { method: "pb", label: "P / B", low: 16, base: 20, high: 24 },
    ]);
    expect(summary.median).toBe(20);
    expect(summary.low).toBe(8);
    expect(summary.high).toBe(120);
  });

  it("builds only selected football field ranges", () => {
    const ranges = buildValuationRanges(DEMO_COMPANY, DEFAULT_ASSUMPTIONS, ["dcf", "pe"], DEMO_PEERS, "gordon");
    expect(ranges.map((range) => range.method)).toEqual(["dcf", "pe"]);
    expect(ranges.every((range) => range.low < range.high)).toBe(true);
  });

  it("builds transparent three-year forecasts from growth and margins", () => {
    const forecast = buildSimpleForecast(DEMO_COMPANY.financials.filter((item) => item.type === "actual"), ["2027E", "2028E", "2029E"], { revenueGrowth: 0.1, ebitMargin: 0.12, netMargin: 0.08 });
    expect(forecast).toHaveLength(3);
    expect(forecast[0].revenue).toBeCloseTo(6810 * 1.1);
    expect(forecast[0].ebit).toBeCloseTo(forecast[0].revenue * 0.12);
  });

  it("evaluates valuation methods independently", () => {
    const noForecast = { ...DEMO_COMPANY, financials: DEMO_COMPANY.financials.map((item) => item.type === "estimate" ? { ...item, revenue: 0, ebit: 0, netIncome: 0 } : item) };
    const readiness = assessMethodReadiness(noForecast, DEFAULT_ASSUMPTIONS, DEMO_PEERS, "gordon");
    expect(readiness.find((item) => item.method === "dcf")?.ready).toBe(false);
    expect(readiness.find((item) => item.method === "pb")?.ready).toBe(true);
  });

  it("does not create peer multiples without market value", () => {
    const peer = { ...DEMO_PEERS[0], enterpriseValue: 0, marketCap: 0 };
    expect(calculatePeerMultiples([peer])[0]).toMatchObject({ evRevenue: null, evEbitda: null, pe: null });
  });

  it("does not mark net cash as a valid valuation method without forecasts", () => {
    const noForecast = { ...DEMO_COMPANY, financials: DEMO_COMPANY.financials.map((item) => item.type === "estimate" ? { ...item, revenue: 0, ebit: 0, netIncome: 0 } : item) };
    const ready = new Set(assessMethodReadiness(noForecast, DEFAULT_ASSUMPTIONS, [], "gordon").filter((item) => item.ready).map((item) => item.method));
    const ranges = buildValuationRanges(noForecast, DEFAULT_ASSUMPTIONS, ["dcf", "evEbitda", "pe", "tradingComps"], [], "gordon").filter((range) => ready.has(range.method));
    expect(ranges).toEqual([]);
  });
});
