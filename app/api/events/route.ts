import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { SHARE_EVENTS, type ShareEvent } from "@/lib/analytics";
import { isHeroId } from "@/lib/heroes";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isShareEvent(value: string): value is ShareEvent {
  return (SHARE_EVENTS as readonly string[]).includes(value);
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad-json" }, { status: 400 });
  }
  const event = (body as { event?: unknown }).event;
  const hero = (body as { hero?: unknown }).hero;
  if (typeof event !== "string" || !isShareEvent(event)) {
    return NextResponse.json({ error: "event" }, { status: 400 });
  }
  if (typeof hero !== "string" || !isHeroId(hero)) {
    return NextResponse.json({ error: "hero" }, { status: 400 });
  }
  const line = JSON.stringify({ event, hero, ts: new Date().toISOString() }) + "\n";
  const dir = path.join(process.cwd(), "data");
  await mkdir(dir, { recursive: true });
  await appendFile(path.join(dir, "events.jsonl"), line, "utf8");
  return NextResponse.json({ ok: true });
}
