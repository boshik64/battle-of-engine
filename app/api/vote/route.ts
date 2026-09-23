import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isHeroId } from "@/lib/heroes";
import { castVote } from "@/lib/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad-json" }, { status: 400 });
  }
  const hero = (body as { hero?: unknown }).hero;
  if (typeof hero !== "string" || !isHeroId(hero)) {
    return NextResponse.json({ error: "hero" }, { status: 400 });
  }

  const jar = await cookies();
  let sid = jar.get("bm_sid")?.value;
  if (!sid) {
    sid = crypto.randomUUID();
    jar.set("bm_sid", sid, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 400,
    });
  }

  try {
    const result = await castVote(sid, hero);
    return NextResponse.json({ ok: true, ...result });
  } catch {
    return NextResponse.json({ error: "store" }, { status: 500 });
  }
}
