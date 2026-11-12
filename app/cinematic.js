"use client";

import { useEffect, useRef } from "react";
import styles from "./cinematic.module.css";

export function CinematicScene({ variant, className, burstSignal = 0 }) {
  const hostRef = useRef(null);
  const controls = useRef(null);

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

    function render(now) {
      frame = 0;
      const delta = previous ? Math.min((now - previous) / 1000, 0.05) : 0;
      previous = now;
      time += delta * (1 + burst * 3);
      burst = Math.max(0, burst - delta * 0.54);
      pointer.x += (target.x - pointer.x) * 0.065;
      pointer.y += (target.y - pointer.y) * 0.065;
      view.draw(time, pointer, burst);
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
      view.resize();
      view.draw(time, pointer, burst);
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
    };
    motion.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    host.addEventListener("pointermove", move);
    host.addEventListener("pointerleave", resetPointer);

    return () => {
      disposed = true;
      stop();
      intersection.disconnect();
      dimensions.disconnect();
      motion.removeEventListener("change", sync);
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
  }, [variant]);

  useEffect(() => {
    if (burstSignal) controls.current?.pulse();
  }, [burstSignal]);

  return <div ref={hostRef} data-hero-sphere={variant === "brain" ? "" : undefined} className={[styles.scene, styles[variant], className].filter(Boolean).join(" ")} aria-hidden="true" />;
}
