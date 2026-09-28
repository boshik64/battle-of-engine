"use client";

import { useEffect, useRef, useState } from "react";

const FRAMES = 20;

function frameSrc(kind: "desktop" | "mobile", index: number) {
  const n = String(index + 1).padStart(3, "0");
  return `/scroll/${kind}/ezgif-frame-${n}.jpg`;
}

function RaceFlag() {
  const cells = [];
  for (let y = 0; y < 4; y += 1) {
    for (let x = 0; x < 5; x += 1) {
      if ((x + y) % 2 === 0) {
        cells.push(<rect key={`${x}-${y}`} x={x * 4} y={y * 4} width="4" height="4" fill="currentColor" />);
      }
    }
  }
  return (
    <svg viewBox="0 0 28 26" width="30" height="28" aria-hidden="true">
      <path d="M3 1.5v23" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <g transform="translate(5,2)" clipPath="url(#race-flag-clip)">
        {cells}
      </g>
      <defs>
        <clipPath id="race-flag-clip">
          <path d="M0 0h18l-1.6 4 1.6 4-1.6 4 1.6 4H0V0z" />
        </clipPath>
      </defs>
    </svg>
  );
}

export function IntroScroll() {
  const trackRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const startRef = useRef<HTMLButtonElement>(null);
  const playing = useRef(false);
  const [started, setStarted] = useState(false);

  function playToChoice() {
    const choice = document.getElementById("vybor");
    if (!choice || playing.current) return;
    playing.current = true;
    setStarted(true);
    const targetY = choice.getBoundingClientRect().top + window.scrollY;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      window.scrollTo({ top: targetY, behavior: "auto" });
      return;
    }
    const startY = window.scrollY;
    const distance = targetY - startY;
    const duration = 2000;
    const t0 = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / duration);
      const eased = 1 - (1 - t) ** 3;
      window.scrollTo(0, startY + distance * eased);
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    const track = trackRef.current;
    if (!canvas || !track) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let kind: "desktop" | "mobile" = window.matchMedia("(min-width: 840px)").matches
      ? "desktop"
      : "mobile";
    let images: HTMLImageElement[] = [];
    let shown = 0;

    const cover = (img: HTMLImageElement) => {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      const w = canvas.width;
      const h = canvas.height;
      const ir = img.naturalWidth / img.naturalHeight;
      const cr = w / h;
      let dw: number;
      let dh: number;
      let dx: number;
      let dy: number;
      if (ir > cr) {
        dh = h;
        dw = h * ir;
        dx = (w - dw) / 2;
        dy = 0;
      } else {
        dw = w;
        dh = w / ir;
        dx = 0;
        dy = (h - dh) / 2;
      }
      ctx.drawImage(img, dx, dy, dw, dh);
    };

    const paint = (progress: number) => {
      const exact = progress * (FRAMES - 1);
      const base = Math.min(FRAMES - 1, Math.floor(exact));
      const frac = exact - base;
      const next = Math.min(FRAMES - 1, base + 1);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const first = images[base];
      const second = images[next];
      ctx.globalAlpha = 1;
      if (first?.complete && first.naturalWidth > 0) cover(first);
      if (next !== base && frac > 0 && second?.complete && second.naturalWidth > 0) {
        ctx.globalAlpha = frac;
        cover(second);
      }
      ctx.globalAlpha = 1;
      const fade = Math.max(0, 1 - progress * 6);
      if (startRef.current && !playing.current) {
        startRef.current.style.opacity = String(fade);
        startRef.current.style.pointerEvents = fade < 0.2 ? "none" : "auto";
      }
    };

    const load = (nextKind: typeof kind) => {
      kind = nextKind;
      images = Array.from({ length: FRAMES }, (_, i) => {
        const img = new Image();
        img.src = frameSrc(kind, i);
        img.onload = () => paint(shown);
        return img;
      });
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      paint(shown);
    };

    const readProgress = () => {
      const sticky = track.querySelector<HTMLElement>(".intro-sticky");
      const pin = sticky?.offsetHeight || window.innerHeight;
      const scrollable = track.offsetHeight - pin;
      const scrolled = Math.min(Math.max(-track.getBoundingClientRect().top, 0), Math.max(scrollable, 0));
      return scrollable > 0 ? scrolled / scrollable : 0;
    };

    const onScroll = () => {
      shown = readProgress();
      paint(shown);
    };

    const onResize = () => {
      const nextKind = window.matchMedia("(min-width: 840px)").matches ? "desktop" : "mobile";
      if (nextKind !== kind) load(nextKind);
      resize();
      onScroll();
    };

    load(kind);
    shown = readProgress();
    resize();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <section className="intro-track" ref={trackRef} aria-label="Постер «Битва моторов»">
      <div className="intro-sticky">
        <picture className="intro-fallback">
          <source media="(min-width: 840px)" srcSet="/scroll/desktop/ezgif-frame-001.jpg" />
          <img src="/scroll/mobile/ezgif-frame-001.jpg" alt="Битва моторов" />
        </picture>
        <canvas ref={canvasRef} className="intro-canvas" aria-hidden="true" />
        {started ? null : (
          <button ref={startRef} type="button" className="intro-start" onClick={playToChoice}>
            <RaceFlag />
            Старт
          </button>
        )}
      </div>
    </section>
  );
}
