import { describe, expect, it } from "vitest";
import { DEFAULT_ASSUMPTIONS, DEMO_COMPANY, DEMO_PEERS } from "@/data/demo";
import { calculateDcf } from "@/lib/valuation/dcf";
import { calculateEvBridge } from "@/lib/valuation/evBridge";
import { buildValuationRanges } from "@/lib/valuation/footballField";
import { runSanityChecks } from "@/lib/valuation/sanityCheck";
import { calculatePeerMultiples, calculateStats } from "@/lib/valuation/tradingComps";
import { calculateWacc } from "@/lib/valuation/wacc";

describe("valuation engine", () => {
  it("calculates a positive DCF enterprise value", () => {
    const result = calculateDcf(DEMO_COMPANY, DEFAULT_ASSUMPTIONS, "gordon");
    expect(result.enterpriseValue).toBeGreaterThan(0);
    expect(result.projections).toHaveLength(3);
    expect(result.terminalValuePercent).toBeGreaterThan(0);
    expect(result.terminalValuePercent).toBeLessThan(1);
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

  it("builds only selected football field ranges", () => {
    const ranges = buildValuationRanges(DEMO_COMPANY, DEFAULT_ASSUMPTIONS, ["dcf", "pe"], DEMO_PEERS, "gordon");
    expect(ranges.map((range) => range.method)).toEqual(["dcf", "pe"]);
    expect(ranges.every((range) => range.low < range.high)).toBe(true);
  });
});
