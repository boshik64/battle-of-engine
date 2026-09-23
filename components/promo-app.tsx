"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { trackShare } from "@/lib/analytics";
import {
  HEROES,
  HERO_IDS,
  sharePath,
  type HeroId,
} from "@/lib/heroes";
import { formatTrips } from "@/lib/plural";
import { ticketUrl, type TicketContent } from "@/lib/utm";
import type { Counts } from "@/lib/vote-rules";
import { IntroScroll } from "./intro-scroll";
import { Tachometer, VOTE_ANIM_MS } from "./tachometer";

type Screen = "start" | "result" | "friend";
type VotePhase = "anim" | "waiting" | "error";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function Stars() {
  return (
    <span className="stars">
      <span className="star-row" aria-hidden="true">
        {Array.from({ length: 5 }, (_, i) => (
          <svg key={i} viewBox="0 0 12 12" width="11" height="11" aria-hidden="true">
            <path
              fill="currentColor"
              d="M6 .7 7.45 4.15l3.8.32-2.9 2.5.9 3.73L6 8.95 2.75 10.7l.9-3.73-2.9-2.5 3.8-.32Z"
            />
          </svg>
        ))}
      </span>
      <span>5,0</span>
    </span>
  );
}

function TripCount({
  stats,
  hero,
}: {
  stats: Counts | null;
  hero: HeroId;
}) {
  if (!stats) {
    return <span className="stat-missing">Статистика временно недоступна</span>;
  }
  return <span className="trips">{formatTrips(stats[hero])}</span>;
}

function BuyLink({
  content,
  className = "btn",
}: {
  content: TicketContent;
  className?: string;
}) {
  return (
    <a className={className} href={ticketUrl(content)} target="_blank" rel="noopener noreferrer">
      КУПИТЬ БИЛЕТ
    </a>
  );
}

function HomeLogo({
  src,
  className,
  onHome,
}: {
  src: string;
  className: string;
  onHome: () => void;
}) {
  return (
    <Link
      href="/"
      className="logo-home"
      aria-label="На главную"
      onClick={(event) => {
        if (window.location.pathname !== "/") return;
        event.preventDefault();
        onHome();
      }}
    >
      <img className={className} src={src} alt="" />
    </Link>
  );
}

function BrandFooter({ buy, onHome }: { buy?: TicketContent; onHome: () => void }) {
  return (
    <footer className="footer">
      <HomeLogo src="/brand/wordmark.webp" className="wordmark" onHome={onHome} />
      <p className="karo">КАРО</p>
      <p className="premiere">В КИНО С 8 ОКТЯБРЯ</p>
      {buy ? <BuyLink content={buy} className="btn btn-line" /> : null}
    </footer>
  );
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return reduced;
}

export function PromoApp({
  initialStats,
  mode,
  friendHero,
}: {
  initialStats: Counts | null;
  mode: "start" | "friend";
  friendHero?: HeroId;
}) {
  const [screen, setScreen] = useState<Screen>(mode === "friend" ? "friend" : "start");
  const [selected, setSelected] = useState<HeroId | null>(null);
  const [stats, setStats] = useState<Counts | null>(initialStats);
  const [vote, setVote] = useState<{ hero: HeroId; phase: VotePhase } | null>(null);
  const [copied, setCopied] = useState<"ok" | "manual" | null>(null);
  const [manualUrl, setManualUrl] = useState("");
  const lock = useRef(false);
  const reduced = useReducedMotion();
  const skipIntro = useRef(false);

  function goHome() {
    skipIntro.current = false;
    setVote(null);
    lock.current = false;
    if (window.location.hash) {
      window.history.replaceState(null, "", window.location.pathname);
    }
    setScreen("start");
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  useEffect(() => {
    if (screen !== "start") return;
    const toChoice = window.location.hash === "#vybor" || skipIntro.current;
    skipIntro.current = false;
    if (!toChoice) return;
    const node = document.getElementById("vybor");
    requestAnimationFrame(() => node?.scrollIntoView({ behavior: "auto" }));
  }, [screen]);

  useEffect(() => {
    if (screen === "result" || screen === "friend") {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  }, [screen]);

  async function reloadStats() {
    try {
      const res = await fetch("/api/stats", { cache: "no-store" });
      if (!res.ok) throw new Error("stats");
      const data = (await res.json()) as { counts: Counts };
      setStats(data.counts);
    } catch {
      setStats(null);
    }
  }

  async function chooseWithWait(hero: HeroId) {
    if (lock.current) return;
    lock.current = true;
    setCopied(null);
    setVote({ hero, phase: reduced ? "waiting" : "anim" });

    let settled = false;
    const request = fetch("/api/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hero }),
    })
      .then((res) => {
        settled = true;
        return res;
      })
      .catch(() => {
        settled = true;
        return null;
      });

    if (!reduced) {
      await sleep(VOTE_ANIM_MS);
      if (!settled) setVote({ hero, phase: "waiting" });
    }

    const response = await request;
    if (!response || !response.ok) {
      setVote({ hero, phase: "error" });
      lock.current = false;
      return;
    }
    try {
      const data = (await response.json()) as { counts: Counts };
      setStats(data.counts);
      setSelected(hero);
      setVote(null);
      setScreen("result");
    } catch {
      setVote({ hero, phase: "error" });
    } finally {
      lock.current = false;
    }
  }

  function currentUrl(hero: HeroId) {
    return `${window.location.origin}${sharePath(hero)}`;
  }

  async function copyLink(hero: HeroId) {
    const url = currentUrl(hero);
    try {
      await navigator.clipboard.writeText(url);
      trackShare("bm_copy_success", hero);
      setCopied("ok");
    } catch {
      setManualUrl(url);
      setCopied("manual");
    }
  }

  async function share(hero: HeroId) {
    const heroData = HEROES[hero];
    const url = currentUrl(hero);
    trackShare("bm_share_click", hero);
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: "Битва моторов",
          text: heroData.shareText,
          url,
        });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    setManualUrl(url);
    setCopied("manual");
  }

  return (
    <>
      <a className="skip" href="#vybor">
        К выбору попутчика
      </a>
      {screen === "start" ? <IntroScroll /> : null}
      {screen === "start" ? (
        <div id="vybor">
          <section className="choice-fit" aria-labelledby="choice-title">
            <HomeLogo src="/brand/logo.webp" className="logo" onHome={goHome} />
            <h1 id="choice-title" className="choice-title">
              ВЫБЕРИ, С КЕМ ОТПРАВИШЬСЯ В ПОЕЗДКУ
            </h1>
            <div className="cards">
              {HERO_IDS.map((id) => {
                const hero = HEROES[id];
                return (
                  <button
                    key={id}
                    type="button"
                    className="card"
                    disabled={vote !== null}
                    onClick={() => void chooseWithWait(id)}
                  >
                    <span className="hero-photo">
                      <img src={hero.image} alt="" />
                    </span>
                    <span className="card-meta">
                      <span className="hero-name">{hero.name}</span>
                      <span className="hero-actor">{hero.actor}</span>
                      <span className="card-row">
                        <Stars />
                        <TripCount stats={stats} hero={id} />
                      </span>
                      <span className="tagline">{hero.tagline}</span>
                      <span className="card-cta">{hero.button}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
          <div className="below">
            <p className="explain">
              Выбирай попутчика и зови друзей — посмотрим, с кем поедет больше зрителей.
            </p>
            {!stats ? (
              <button type="button" className="btn btn-quiet" onClick={() => void reloadStats()}>
                Обновить статистику
              </button>
            ) : null}
            <BrandFooter buy="buy_ticket" onHome={goHome} />
          </div>
        </div>
      ) : null}

      {screen === "result" && selected ? (
        <Result
          hero={selected}
          stats={stats}
          copied={copied}
          shareUrl={manualUrl}
          onShare={() => void share(selected)}
          onCopy={() => void copyLink(selected)}
          onHome={goHome}
          onOther={() => {
            skipIntro.current = true;
            setScreen("start");
          }}
          onReload={() => void reloadStats()}
        />
      ) : null}

      {screen === "friend" && friendHero ? (
        <Friend hero={friendHero} stats={stats} onReload={() => void reloadStats()} onHome={goHome} />
      ) : null}

      {vote ? (
        <div className="overlay" role="status" aria-live="polite">
          <div className="overlay-card">
            {vote.phase === "error" ? (
              <>
                <p>Не удалось учесть голос. Попробуй ещё раз</p>
                <button
                  type="button"
                  className="btn"
                  style={{ marginTop: 16 }}
                  onClick={() => void chooseWithWait(vote.hero)}
                >
                  Повторить
                </button>
              </>
            ) : (
              <>
                {reduced ? null : <Tachometer />}
                {vote.phase === "waiting" || reduced ? <p>Учитываем твой выбор…</p> : null}
              </>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}

function Result({
  hero,
  stats,
  copied,
  shareUrl,
  onShare,
  onCopy,
  onOther,
  onReload,
  onHome,
}: {
  hero: HeroId;
  stats: Counts | null;
  copied: "ok" | "manual" | null;
  shareUrl: string;
  onShare: () => void;
  onCopy: () => void;
  onOther: () => void;
  onReload: () => void;
  onHome: () => void;
}) {
  const data = HEROES[hero];
  const content: TicketContent =
    hero === "andrey" ? "buy_ticket_andrey" : "buy_ticket_dmitry";
  return (
    <article className="screen" id="vybor">
      <img className="scene" src={data.scene} alt={`${data.actor}, ${data.name}`} />
      <div className="screen-copy">
        <HomeLogo src="/brand/logo.webp" className="logo screen-logo" onHome={onHome} />
        <p className="actor-line">{data.actor}</p>
        <h1>ТЫ ОТПРАВЛЯЕШЬСЯ В ПОЕЗДКУ С {data.withName.toUpperCase()}</h1>
        <p className="kicker">ТЕБЯ ЖДЁТ…</p>
        <p className="awaits">{data.awaits}</p>
        <div className="stats-block">
          {HERO_IDS.map((id) => (
            <p key={id} className="stat-line">
              <span>{HEROES[id].name}</span>
              <TripCount stats={stats} hero={id} />
            </p>
          ))}
        </div>
        {!stats ? (
          <button type="button" className="btn btn-quiet" onClick={onReload}>
            Обновить статистику
          </button>
        ) : null}
        <div className="stack" style={{ marginTop: 18 }}>
          <BuyLink content={content} />
          <button type="button" className="btn btn-line" onClick={onShare}>
            ПОДЕЛИТЬСЯ СВОИМ ВЫБОРОМ
          </button>
          <button type="button" className="btn btn-line" onClick={onCopy}>
            Скопировать ссылку
          </button>
          <p className="copy-note" aria-live="polite">
            {copied === "ok" ? "Ссылка скопирована" : ""}
          </p>
          {copied === "manual" ? (
            <input className="copy-link" readOnly value={shareUrl} aria-label="Ссылка для копирования" />
          ) : null}
          <button type="button" className="btn btn-quiet" onClick={onOther}>
            ВЫБРАТЬ ДРУГОГО ГЕРОЯ
          </button>
        </div>
        <BrandFooter onHome={onHome} />
      </div>
    </article>
  );
}

function Friend({
  hero,
  stats,
  onReload,
  onHome,
}: {
  hero: HeroId;
  stats: Counts | null;
  onReload: () => void;
  onHome: () => void;
}) {
  const data = HEROES[hero];
  return (
    <article className="screen">
      <img className="scene" src={data.scene} alt={`${data.actor}, ${data.name}`} />
      <div className="screen-copy">
        <HomeLogo src="/brand/logo.webp" className="logo screen-logo" onHome={onHome} />
        <p className="actor-line">{data.actor}</p>
        <h1>{data.friendTitle}</h1>
        <p className="kicker">ТЕБЯ ЖДЁТ…</p>
        <p className="awaits">{data.awaits}</p>
        <div className="stats-block">
          {HERO_IDS.map((id) => (
            <p key={id} className="stat-line">
              <span>{HEROES[id].name}</span>
              <TripCount stats={stats} hero={id} />
            </p>
          ))}
        </div>
        {!stats ? (
          <button type="button" className="btn btn-quiet" onClick={onReload}>
            Обновить статистику
          </button>
        ) : null}
        <div className="stack" style={{ marginTop: 18 }}>
          <Link className="btn" href="/#vybor">
            А С КЕМ ПОЕДЕШЬ ТЫ?
          </Link>
          <BuyLink content="buy_ticket" className="btn btn-line" />
        </div>
        <BrandFooter onHome={onHome} />
      </div>
    </article>
  );
}
