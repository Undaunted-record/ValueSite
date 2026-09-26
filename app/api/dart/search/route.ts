import { NextRequest, NextResponse } from "next/server";
import { publicDartError } from "@/lib/dart/errors";
import { allowDartRequest } from "@/lib/dart/rate-limit";
import { searchDartCompanies } from "@/lib/dart/server";

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  if (!allowDartRequest(request)) return NextResponse.json({ error: "검색 요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.", retryable: true }, { status: 429 });
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const compact = query.replace(/\s+/g, "");
  const minimum = /[가-힣]/.test(compact) ? 2 : 3;
  if (compact.length < minimum || compact.length > 50) {
    return NextResponse.json({ error: `검색어를 ${minimum}자 이상 입력해 주세요.` }, { status: 400 });
  }
  try {
    return NextResponse.json(await searchDartCompanies(query));
  } catch (error) {
    return NextResponse.json(publicDartError(error), { status: 502 });
  }
}
