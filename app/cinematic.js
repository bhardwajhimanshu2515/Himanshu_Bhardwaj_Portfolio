"use client";

import { useEffect, useRef } from "react";
import { journeyPose, measureJourney } from "./portfolio-journey";
import styles from "./cinematic.module.css";

export function PortfolioScene({ mainRef, signal, activeLayer }) {
  const hostRef = useRef(null);
  const fallbackRef = useRef(null);
  const controls = useRef(null);

  useEffect(() => {
    const host = hostRef.current;
    const main = mainRef.current;
    const fallback = fallbackRef.current;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const narrow = window.matchMedia("(max-width: 760px)");
    let view;
    let loading = false;
    let failed = false;
    let disposed = false;
    let frame = 0;
    let previous = 0;
    let time = 0;
    let pulse = 0;
    let step = 0;
    let layer = 0;
    let pulseAnimation;
    let keyframes;
    let pose;
    let needsMeasurement = true;
    let needsPose = true;

    function schedule() {
      if (!frame && !document.hidden && !disposed) frame = requestAnimationFrame(render);
    }

    function render(now) {
      frame = 0;
      const delta = previous ? Math.min((now - previous) / 1000, 0.05) : 0;
      previous = now;
      time += delta;
      pulse = Math.max(0, pulse - delta * 0.52);

      if (needsMeasurement) {
        const height = window.innerHeight;
        const maxScroll = document.documentElement.scrollHeight - height;
        keyframes = measureJourney(main, height, maxScroll, window.scrollY);
        view?.resize();
        needsMeasurement = false;
      }
      if (needsPose) {
        pose = journeyPose(keyframes, motion.matches ? 0 : window.scrollY);
        host.style.setProperty("--world-offset", `${pose[3] * 36}vw`);
        host.style.setProperty("--world-scale", 7.2 / pose[1]);
        host.style.setProperty("--world-turn", `${pose[0] * 9}deg`);
        host.style.setProperty("--world-layer-blend", pose[4]);
        needsPose = false;
      }
      if (view && !motion.matches && !narrow.matches) {
        view.draw(time, pose, pulse, step, layer);
        schedule();
      } else {
        previous = 0;
      }
    }

    function onScroll() {
      needsPose = true;
      schedule();
    }

    function onResize() {
      needsMeasurement = true;
      onScroll();
    }

    function onVisibility() {
      previous = 0;
      schedule();
    }

    function releaseView() {
      if (!view) return;
      view.canvas.removeEventListener("webglcontextlost", onContextLost);
      view.dispose();
      view = undefined;
      delete host.dataset.rendered;
    }

    function onContextLost(event) {
      event.preventDefault();
      failed = true;
      releaseView();
    }

    async function initialize() {
      if (view || loading || failed || motion.matches || narrow.matches) return;
      loading = true;
      try {
        const { createPortfolioScene } = await import("./cinematic-scenes");
        if (disposed || motion.matches || narrow.matches) return;
        view = createPortfolioScene(host);
        view.canvas.addEventListener("webglcontextlost", onContextLost);
        host.dataset.rendered = "true";
        onResize();
      } catch {
        failed = true;
        releaseView();
      } finally {
        loading = false;
      }
    }

    function onMediaChange() {
      if (motion.matches || narrow.matches) releaseView();
      else void initialize();
      if (motion.matches) pulseAnimation?.cancel();
      onResize();
    }

    controls.current = {
      pulse(nextStep) {
        if (motion.matches) return;
        step = nextStep;
        pulse = 1;
        if (!view) {
          pulseAnimation?.cancel();
          pulseAnimation = fallback.animate([{ filter: "brightness(1)" }, { filter: "brightness(1.7)" }, { filter: "brightness(1)" }], 880);
        }
        schedule();
      },
      select(nextLayer) {
        layer = nextLayer;
        host.dataset.layer = String(nextLayer);
        schedule();
      },
    };

    const dimensions = new ResizeObserver(onResize);
    dimensions.observe(main);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);
    motion.addEventListener("change", onMediaChange);
    narrow.addEventListener("change", onMediaChange);
    onMediaChange();

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      dimensions.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      motion.removeEventListener("change", onMediaChange);
      narrow.removeEventListener("change", onMediaChange);
      pulseAnimation?.cancel();
      releaseView();
      controls.current = null;
    };
  }, [mainRef]);

  useEffect(() => {
    if (signal) controls.current?.pulse(signal.step);
  }, [signal]);

  useEffect(() => {
    controls.current?.select(activeLayer);
  }, [activeLayer]);

  return <div ref={hostRef} className={styles.world} data-portfolio-scene aria-hidden="true">
    <div ref={fallbackRef} className={styles.fallback}>
      <img src="/circuit-sphere-hero.webp" alt="" width="1100" height="1373" />
    </div>
    <div className={styles.fallbackLayers}><i /><i /><i /></div>
  </div>;
}
