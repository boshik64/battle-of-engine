"use client";

import { useEffect, useRef } from "react";

const FRAMES = 20;

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

    let kind: "desktop" | "mobile" = window.matchMedia("(min-width: 840px)")
      .matches
      ? "desktop"
      : "mobile";
    let images: HTMLImageElement[] = [];
    let index = 0;

    const draw = () => {
      const img = images[index];
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      if (!img || !img.complete || img.naturalWidth === 0) return;
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

    const load = (nextKind: typeof kind) => {
      kind = nextKind;
      images = Array.from({ length: FRAMES }, (_, i) => {
        const img = new Image();
        img.src = frameSrc(kind, i);
        img.onload = () => {
          if (i === index) draw();
        };
        return img;
      });
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      draw();
    };

    const onScroll = () => {
      const rect = track.getBoundingClientRect();
      const scrollable = rect.height - window.innerHeight;
      const scrolled = Math.min(Math.max(-rect.top, 0), Math.max(scrollable, 0));
      const progress = scrollable > 0 ? scrolled / scrollable : 0;
      const next = Math.min(FRAMES - 1, Math.round(progress * (FRAMES - 1)));
      if (cueRef.current) {
        cueRef.current.style.opacity = String(Math.max(0, 1 - progress * 6));
      }
      if (next !== index) {
        index = next;
        draw();
      }
    };

    const onResize = () => {
      const nextKind = window.matchMedia("(min-width: 840px)").matches
        ? "desktop"
        : "mobile";
      if (nextKind !== kind) load(nextKind);
      resize();
      onScroll();
    };

    load(kind);
    resize();
    onScroll();
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
        <p ref={cueRef} className="intro-cue">
          листай
        </p>
      </div>
    </section>
  );
}
