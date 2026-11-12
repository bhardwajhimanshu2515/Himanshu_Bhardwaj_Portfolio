"use client";

import { useEffect, useRef } from "react";
import styles from "./cinematic.module.css";

export function CinematicScene({ variant, className, burstSignal = 0 }) {
  const hostRef = useRef(null);
  const controls = useRef(null);
  const brain = variant === "brain";

  useEffect(() => {
    const host = hostRef.current;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pointer = { x: 0, y: 0 };
    const target = { x: 0, y: 0 };
    let view;
    let loading = false;
    let disposed = false;
    let visible = false;
    let contextLost = false;
    let frame = 0;
    let previous = 0;
    let time = 0;
    let burst = 0;
    let reveal = motion.matches ? 1 : 0;
    let revealStart = 0;
    let revealDistance = 1;
    let manualReveal = false;

    function scrollProgress() {
      return Math.max(0, Math.min(1, (window.scrollY - revealStart) / revealDistance));
    }

    function render(now) {
      frame = 0;
      const delta = previous ? Math.min((now - previous) / 1000, 0.05) : 0;
      previous = now;
      time += delta * (1 + burst * 3);
      burst = Math.max(0, burst - delta * 0.54);
      pointer.x += (target.x - pointer.x) * 0.065;
      pointer.y += (target.y - pointer.y) * 0.065;
      if (brain) {
        const goal = manualReveal ? 1 : scrollProgress();
        reveal += (goal - reveal) * (1 - Math.exp(-delta * 9));
      }
      view.draw(time, pointer, burst, reveal);
      start();
    }

    function start() {
      if (view && visible && !contextLost && !motion.matches && !document.hidden && !frame) {
        frame = requestAnimationFrame(render);
      }
    }

    function stop() {
      cancelAnimationFrame(frame);
      frame = 0;
      previous = 0;
    }

    function sync() {
      stop();
      start();
    }

    function resize() {
      if (!view || contextLost) return;
      if (brain) {
        revealStart = Math.max(0, host.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.48);
        revealDistance = Math.min(210, host.clientHeight * 0.52);
      }
      view.resize();
      view.draw(time, pointer, burst, motion.matches ? 1 : reveal);
    }

    function onContextLost(event) {
      event.preventDefault();
      contextLost = true;
      stop();
      delete host.dataset.rendered;
    }

    function onContextRestored() {
      contextLost = false;
      resize();
      host.dataset.rendered = "true";
      start();
    }

    async function initialize() {
      if (loading) return;
      loading = true;
      try {
        const { createScene } = await import("./cinematic-scenes");
        if (disposed) return;
        view = createScene(host, variant);
        view.canvas.addEventListener("webglcontextlost", onContextLost);
        view.canvas.addEventListener("webglcontextrestored", onContextRestored);
        resize();
        host.dataset.rendered = "true";
        start();
      } catch {
        // Keep the CSS fallback when WebGL is unavailable.
      }
    }

    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) void initialize();
      sync();
    });
    intersection.observe(host);
    const dimensions = new ResizeObserver(resize);
    dimensions.observe(host);

    function onMotionChange() {
      reveal = motion.matches || manualReveal ? 1 : scrollProgress();
      resize();
      sync();
    }

    function move(event) {
      if (event.pointerType === "touch") return;
      const rect = host.getBoundingClientRect();
      target.x = (event.clientX - rect.left) / rect.width * 2 - 1;
      target.y = (event.clientY - rect.top) / rect.height * 2 - 1;
    }

    function resetPointer() {
      target.x = 0;
      target.y = 0;
    }

    controls.current = {
      pulse() {
        if (!motion.matches) burst = 1;
      },
      reveal() {
        if (!motion.matches) {
          if (manualReveal || reveal > 0.96) reveal = 0;
          manualReveal = true;
          burst = 1;
          start();
        }
      },
    };
    motion.addEventListener("change", onMotionChange);
    if (brain) window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", sync);
    host.addEventListener("pointermove", move);
    host.addEventListener("pointerleave", resetPointer);

    return () => {
      disposed = true;
      stop();
      intersection.disconnect();
      dimensions.disconnect();
      motion.removeEventListener("change", onMotionChange);
      if (brain) window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", sync);
      host.removeEventListener("pointermove", move);
      host.removeEventListener("pointerleave", resetPointer);
      if (view) {
        view.canvas.removeEventListener("webglcontextlost", onContextLost);
        view.canvas.removeEventListener("webglcontextrestored", onContextRestored);
        view.dispose();
      }
      delete host.dataset.rendered;
      controls.current = null;
    };
  }, [brain, variant]);

  useEffect(() => {
    if (burstSignal) controls.current?.pulse();
  }, [burstSignal]);

  const scene = <div ref={hostRef} className={[styles.scene, styles[variant], className].filter(Boolean).join(" ")} aria-hidden="true" />;
  if (!brain) return scene;

  return <div className={styles.revealStage}>
    {scene}
    <div className={styles.revealControls}>
      <span aria-hidden="true">↓ Scroll to reveal</span>
      <button type="button" onClick={() => controls.current?.reveal()}>Play reveal <span aria-hidden="true">↗</span></button>
    </div>
  </div>;
}
