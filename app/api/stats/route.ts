import { NextResponse } from "next/server";
import { readCounts } from "@/lib/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const counts = await readCounts();
    return NextResponse.json({ counts });
  } catch {
    return NextResponse.json({ error: "store" }, { status: 500 });
  }
}
