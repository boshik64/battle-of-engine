"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { trackShare } from "@/lib/analytics";
import {
  HEROES,
  HERO_IDS,
  sharePath,
  type HeroId,
} from "@/lib/heroes";
import { formatTrips } from "@/lib/plural";
import { sharePost, telegramShareUrl, vkShareUrl } from "@/lib/share";
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
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState<"ok" | "manual" | null>(null);
  const [manualUrl, setManualUrl] = useState("");
  const lock = useRef(false);
  const closeShare = useCallback(() => setShareOpen(false), []);
  const reduced = useReducedMotion();
  const skipIntro = useRef(false);

  function goHome() {
    skipIntro.current = false;
    setVote(null);
    setShareOpen(false);
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

  function openShare(hero: HeroId) {
    setCopied(null);
    setManualUrl("");
    setShareOpen(true);
    trackShare("bm_share_click", hero);
  }

  async function copyShare(hero: HeroId) {
    const post = sharePost(HEROES[hero].shareText, currentUrl(hero));
    try {
      await navigator.clipboard.writeText(post);
      trackShare("bm_copy_success", hero);
      setManualUrl("");
      setCopied("ok");
    } catch {
      setManualUrl(post);
      setCopied("manual");
    }
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
          onShare={() => openShare(selected)}
          onHome={goHome}
          onOther={() => {
            skipIntro.current = true;
            setShareOpen(false);
            setScreen("start");
          }}
          onReload={() => void reloadStats()}
        />
      ) : null}

      {screen === "friend" && friendHero ? (
        <Friend hero={friendHero} stats={stats} onReload={() => void reloadStats()} onHome={goHome} />
      ) : null}

      {shareOpen && selected ? (
        <ShareSheet
          message={HEROES[selected].shareText}
          pageUrl={currentUrl(selected)}
          imageUrl={`${window.location.origin}${HEROES[selected].og}`}
          copied={copied}
          manualText={manualUrl}
          onCopy={() => void copyShare(selected)}
          onClose={closeShare}
        />
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
  onShare,
  onOther,
  onReload,
  onHome,
}: {
  hero: HeroId;
  stats: Counts | null;
  onShare: () => void;
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

function telegramEmbedsLink() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  if (/Android|iPhone|iPad|iPod/i.test(ua)) return true;
  return navigator.maxTouchPoints > 1 && /Macintosh/i.test(ua);
}

function ShareSheet({
  message,
  pageUrl,
  imageUrl,
  copied,
  manualText,
  onCopy,
  onClose,
}: {
  message: string;
  pageUrl: string;
  imageUrl: string;
  copied: "ok" | "manual" | null;
  manualText: string;
  onCopy: () => void;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = dialogRef.current;
    const previously = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    node?.querySelector<HTMLElement>("a,button")?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab" || !node) return;
      const items = [...node.querySelectorAll<HTMLElement>("a,button,textarea,input")];
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
      previously?.focus();
    };
  }, [onClose]);

  return (
    <div className="overlay" onClick={onClose}>
      <div
        ref={dialogRef}
        className="overlay-card share-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="share-title">ПОДЕЛИТЬСЯ</h2>
        <div className="stack">
          <a
            className="btn"
            href={telegramShareUrl(message, pageUrl, telegramEmbedsLink())}
            target="_blank"
            rel="noopener noreferrer"
          >
            Телеграм
          </a>
          <a
            className="btn btn-line"
            href={vkShareUrl(message, pageUrl, imageUrl)}
            target="_blank"
            rel="noopener noreferrer"
          >
            ВКонтакте
          </a>
          <button type="button" className="btn btn-line" onClick={onCopy}>
            Скопировать
          </button>
          <p className="copy-note" aria-live="polite">
            {copied === "ok" ? "Сообщение скопировано" : ""}
            {copied === "manual" ? "Скопируй сообщение и отправь его" : ""}
          </p>
          {copied === "manual" ? (
            <textarea
              className="copy-link"
              readOnly
              rows={3}
              value={manualText}
              aria-label="Сообщение для отправки"
            />
          ) : null}
          <button type="button" className="btn btn-quiet" onClick={onClose}>
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}
