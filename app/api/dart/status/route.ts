import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    configured: Boolean(process.env.OPEN_DART_API_KEY),
  });
}
