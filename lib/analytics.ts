import type { HeroId } from "./heroes";

export const SHARE_EVENTS = ["bm_share_click", "bm_copy_success"] as const;

export type ShareEvent = (typeof SHARE_EVENTS)[number];

export function trackShare(event: ShareEvent, hero: HeroId) {
  if (typeof window === "undefined") return;
  const payload = JSON.stringify({ event, hero });
  const layer = (window as Window & { dataLayer?: object[] }).dataLayer ?? [];
  layer.push({ event, hero });
  (window as Window & { dataLayer?: object[] }).dataLayer = layer;
  const id = process.env.NEXT_PUBLIC_METRIKA_ID;
  const ym = (
    window as Window & {
      ym?: (counter: number, method: string, goal: string, params?: object) => void;
    }
  ).ym;
  if (id && typeof ym === "function") {
    ym(Number(id), "reachGoal", event, { hero });
  }
  void fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true,
  });
}
