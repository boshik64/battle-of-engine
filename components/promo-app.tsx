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
import { Tachometer, VOTE_ANIM_MS } from "./tachometer";

type Screen = "start" | "result" | "friend";
type VotePhase = "anim" | "waiting" | "error";
type RideStep = "gate" | "search" | "drivers" | "meter" | "card";

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
  const [step, setStep] = useState<RideStep>("gate");
  const [dossier, setDossier] = useState<HeroId | null>(null);
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
    setStep("gate");
    setDossier(null);
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  useEffect(() => {
    if (screen !== "start") return;
    const toChoice = window.location.hash === "#vybor" || skipIntro.current;
    skipIntro.current = false;
    if (!toChoice) return;
    setStep("drivers");
  }, [screen]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [screen, step]);

  useEffect(() => {
    if (step !== "search") return;
    const timer = window.setTimeout(() => setStep("drivers"), reduced ? 250 : 1700);
    return () => window.clearTimeout(timer);
  }, [step, reduced]);

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
    setVote(null);
    setDossier(null);
    setStep("meter");

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

    await sleep(reduced ? 500 : VOTE_ANIM_MS);
    if (!settled) setVote({ hero, phase: "waiting" });

    const response = await request;
    if (!response || !response.ok) {
      setVote({ hero, phase: "error" });
      setStep("drivers");
      lock.current = false;
      return;
    }
    try {
      const data = (await response.json()) as { counts: Counts };
      setStats(data.counts);
      setSelected(hero);
      setDossier(null);
      setVote(null);
      setStep("card");
    } catch {
      setVote({ hero, phase: "error" });
      setStep("drivers");
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

  function goDrivers() {
    setStep("search");
  }

  return (
    <>
      <button type="button" className="skip" onClick={() => setStep("drivers")}>
        К выбору водителя
      </button>
      {screen === "start" && step === "gate" ? (
        <section className="gate" aria-labelledby="gate-title">
          <img className="gate-logo" src="/brand/logo.webp" alt="Битва моторов" />
          <picture>
            <source media="(max-width: 839px)" type="image/webp" srcSet="/banners/mobile.webp" />
            <source media="(max-width: 839px)" srcSet="/banners/mobile.jpg" />
            <source type="image/webp" srcSet="/banners/desktop.webp" />
            <img
              className="gate-poster"
              src="/banners/desktop.jpg"
              alt="Постер фильма «Битва моторов»"
            />
          </picture>
          <div className="gate-actions">
            <h1 id="gate-title" className="gate-lead">
              Выбери, с кем отправишься в поездку
            </h1>
            <button type="button" className="btn gate-go" onClick={goDrivers}>
              <svg className="taxi-sign" viewBox="0 0 46 24" aria-hidden="true">
                <rect x="0.6" y="0.6" width="44.8" height="22.8" rx="3.5" fill="#f5c518" stroke="#14110e" strokeWidth="1.2" />
                <rect x="4" y="4" width="7" height="7" fill="#14110e" />
                <rect x="18" y="4" width="7" height="7" fill="#14110e" />
                <rect x="32" y="4" width="7" height="7" fill="#14110e" />
                <rect x="11" y="11" width="7" height="7" fill="#14110e" />
                <rect x="25" y="11" width="7" height="7" fill="#14110e" />
              </svg>
              Газуем
            </button>
          </div>
        </section>
      ) : null}

      {screen === "start" && step === "search" ? <SearchStep /> : null}

      {screen === "start" && step === "drivers" ? (
        <section className="drivers" id="vybor" aria-labelledby="drivers-title">
          <p className="step-mark">Шаг 2 из 3</p>
          <h2 id="drivers-title" className="drivers-title">
            Кто повезёт
          </h2>
          <div className="driver-list">
            {HERO_IDS.map((id) => {
              const hero = HEROES[id];
              return (
                <article key={id} className="driver-card">
                  <img className="driver-face" src={hero.face} alt="" />
                  <div className="driver-main">
                    <p className="hero-name">{hero.name}</p>
                    <p className="hero-actor">{hero.actor}</p>
                    <p className="card-row">
                      <Stars />
                      <TripCount stats={stats} hero={id} />
                    </p>
                    <div className="card-actions">
                      <button
                        type="button"
                        className="card-cta"
                        disabled={vote !== null}
                        onClick={() => void chooseWithWait(id)}
                      >
                        Еду с ним
                      </button>
                      <button
                        type="button"
                        className="card-cta card-cta-line"
                        onClick={() => setDossier(id)}
                      >
                        Что за водитель?
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      {screen === "start" && step === "meter" ? <MeterStep reduced={reduced} /> : null}

      {screen === "start" && step === "card" && selected ? (
        <Result
          hero={selected}
          stats={stats}
          onShare={() => openShare(selected)}
          onHome={goHome}
          onOther={() => {
            skipIntro.current = false;
            setShareOpen(false);
            setStep("drivers");
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

      {dossier ? (
        <DriverSheet
          hero={dossier}
          pending={vote !== null}
          onClose={() => setDossier(null)}
          onRide={(id) => void chooseWithWait(id)}
        />
      ) : null}

      {vote?.phase === "error" ? (
        <div className="overlay" role="status" aria-live="polite">
          <div className="overlay-card">
            <p>Не удалось учесть голос. Попробуй ещё раз</p>
            <button
              type="button"
              className="btn"
              style={{ marginTop: 16 }}
              onClick={() => void chooseWithWait(vote.hero)}
            >
              Повторить
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

function SearchStep() {
  return (
    <section className="ride-step" role="status" aria-live="polite">
      <div className="road" aria-hidden="true">
        <div className="road-dashes" />
        <div className="road-car" />
      </div>
      <p className="ride-status">Ищем водителя на линии</p>
    </section>
  );
}

function MeterStep({ reduced }: { reduced: boolean }) {
  return (
    <section className="ride-step" role="status" aria-live="polite">
      <p className="step-mark">Водитель найден</p>
      {reduced ? null : <Tachometer />}
      <p className="ride-status">Ваш водитель уже выехал</p>
    </section>
  );
}

function DriverSheet({
  hero,
  pending,
  onClose,
  onRide,
}: {
  hero: HeroId;
  pending: boolean;
  onClose: () => void;
  onRide: (id: HeroId) => void;
}) {
  const data = HEROES[hero];
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = dialogRef.current;
    const previously = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    node?.querySelector<HTMLElement>(".hero-sheet-close")?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab" || !node) return;
      const items = [...node.querySelectorAll<HTMLElement>("button")];
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
        className="hero-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dossier-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className="hero-sheet-close" aria-label="Закрыть" onClick={onClose}>
          ×
        </button>
        <img className="hero-sheet-figure" src={data.figure} alt={`${data.name}, ${data.actor}`} />
        <div className="hero-sheet-copy">
          <p id="dossier-title">
            Имя: <strong>{data.name}</strong>
          </p>
          <p>
            Актёр: <strong>{data.actor}</strong>
          </p>
          <p>Роль: {data.dossierRole}</p>
          <p className="hero-sheet-note">{data.dossierNote}</p>
          <button
            type="button"
            className="btn"
            disabled={pending}
            onClick={() => onRide(hero)}
          >
            {data.rideWith}
          </button>
        </div>
      </div>
    </div>
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
    <article className="screen result-sheet" id="vybor">
      <img className={`scene scene-${hero}`} src={data.scene} alt={`${data.actor}, ${data.name}`} />
      <div className="screen-copy">
        <p className="step-mark">Шаг 3 из 3</p>
        <HomeLogo src="/brand/logo.webp" className="logo screen-logo" onHome={onHome} />
        <p className="actor-line">{data.actor}</p>
        <h1>ТЫ ОТПРАВЛЯЕШЬСЯ В ПОЕЗДКУ С {data.withName.toUpperCase()}</h1>
        <p className="kicker">ТЕБЯ ЖДЁТ…</p>
        <p className="awaits">{data.awaits}</p>
        <ul className="traits">
          {data.traits.map((trait) => (
            <li key={trait.label}>
              <span>{trait.label}</span>
              <span>{trait.value}</span>
            </li>
          ))}
        </ul>
        <div className="stats-block">
          <p className="stat-line">
            <span>{data.name}</span>
            <TripCount stats={stats} hero={hero} />
          </p>
        </div>
        {!stats ? (
          <button type="button" className="btn btn-quiet" onClick={onReload}>
            Обновить статистику
          </button>
        ) : null}
        <div className="stack result-actions">
          <BuyLink content={content} className="btn result-buy" />
          <div className="result-row">
            <button type="button" className="btn btn-line" onClick={onShare}>
              Поделиться
            </button>
            <button type="button" className="btn btn-quiet" onClick={onOther}>
              Выбрать другого
            </button>
          </div>
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
      <img className={`scene scene-${hero}`} src={data.scene} alt={`${data.actor}, ${data.name}`} />
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
            href={telegramShareUrl(message, pageUrl)}
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
