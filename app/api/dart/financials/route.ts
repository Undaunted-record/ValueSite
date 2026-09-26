import { NextRequest, NextResponse } from "next/server";
import { publicDartError } from "@/lib/dart/errors";
import { allowDartRequest } from "@/lib/dart/rate-limit";
import { getDartFinancials } from "@/lib/dart/server";

export async function GET(request: NextRequest) {
  if (!allowDartRequest(request, 30)) return NextResponse.json({ error: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.", retryable: true }, { status: 429 });
  const corpCode = request.nextUrl.searchParams.get("corpCode") ?? "";
  if (!/^\d{8}$/.test(corpCode)) return NextResponse.json({ error: "기업 고유번호가 올바르지 않습니다." }, { status: 400 });
  try {
    return NextResponse.json(await getDartFinancials(corpCode));
  } catch (error) {
    return NextResponse.json(publicDartError(error), { status: 502 });
  }
}
