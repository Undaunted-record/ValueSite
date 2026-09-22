import type { PeerCompany } from "@/types/valuation";

export interface PeerMultiples {
  company: string;
  evRevenue: number | null;
  evEbitda: number | null;
  evEbit: number | null;
  pe: number | null;
}

export interface MultipleStats {
  min: number;
  q1: number;
  median: number;
  mean: number;
  q3: number;
  max: number;
}

export function calculatePeerMultiples(peers: PeerCompany[]): PeerMultiples[] {
  return peers.map((peer) => ({
    company: peer.company,
    evRevenue: peer.revenue > 0 ? peer.enterpriseValue / peer.revenue : null,
    evEbitda: peer.ebitda > 0 ? peer.enterpriseValue / peer.ebitda : null,
    evEbit: peer.ebit > 0 ? peer.enterpriseValue / peer.ebit : null,
    pe: peer.netIncome > 0 ? peer.marketCap / peer.netIncome : null,
  }));
}

function quantile(sorted: number[], percentile: number): number {
  if (!sorted.length) return 0;
  const position = (sorted.length - 1) * percentile;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
}

export function calculateStats(values: Array<number | null>): MultipleStats {
  const valid = values.filter((value): value is number => value !== null && Number.isFinite(value)).sort((a, b) => a - b);
  if (!valid.length) return { min: 0, q1: 0, median: 0, mean: 0, q3: 0, max: 0 };
  return {
    min: valid[0],
    q1: quantile(valid, 0.25),
    median: quantile(valid, 0.5),
    mean: valid.reduce((sum, value) => sum + value, 0) / valid.length,
    q3: quantile(valid, 0.75),
    max: valid.at(-1)!,
  };
}
