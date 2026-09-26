import type { NextRequest } from "next/server";

const requests = new Map<string, number[]>();

export function allowDartRequest(request: NextRequest, limit = 60) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const key = forwarded || request.headers.get("x-real-ip") || "local";
  const now = Date.now();
  const recent = (requests.get(key) ?? []).filter((time) => now - time < 60_000);
  if (recent.length >= limit) return false;
  recent.push(now);
  requests.set(key, recent);
  return true;
}
