"use client";

import { useEffect, useRef } from "react";

const FRAMES = 30;

function frameSrc(kind: "desktop" | "mobile", index: number) {
  const n = String(index + 1).padStart(3, "0");
  return `/scroll/${kind}/ezgif-frame-${n}.jpg`;
}

export function IntroScroll() {
  const trackRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cueRef = useRef<HTMLParagraphElement>(null);

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
    let target = 0;
    let shown = 0;
    let raf = 0;

    const cover = (img: HTMLImageElement) => {
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
      if (cueRef.current) {
        cueRef.current.style.opacity = String(Math.max(0, 1 - progress * 6));
      }
    };

    const step = () => {
      const delta = target - shown;
      if (Math.abs(delta) < 0.0015) {
        shown = target;
        paint(shown);
        raf = 0;
        return;
      }
      shown += delta * 0.28;
      paint(shown);
      raf = requestAnimationFrame(step);
    };

    const kick = () => {
      if (raf) return;
      raf = requestAnimationFrame(step);
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
      const rect = track.getBoundingClientRect();
      const scrollable = rect.height - window.innerHeight;
      const scrolled = Math.min(Math.max(-rect.top, 0), Math.max(scrollable, 0));
      return scrollable > 0 ? scrolled / scrollable : 0;
    };

    const onScroll = () => {
      target = readProgress();
      kick();
    };

    const onResize = () => {
      const nextKind = window.matchMedia("(min-width: 840px)").matches ? "desktop" : "mobile";
      if (nextKind !== kind) load(nextKind);
      resize();
      onScroll();
    };

    load(kind);
    shown = readProgress();
    target = shown;
    resize();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      if (raf) cancelAnimationFrame(raf);
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
        <p ref={cueRef} className="intro-cue">
          листай
        </p>
      </div>
    </section>
  );
}
