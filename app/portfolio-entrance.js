"use client";

import { useEffect, useRef } from "react";
import styles from "./portfolio-entrance.module.css";

export function PortfolioEntrance({ children }) {
  const entranceRef = useRef(null);
  const contentRef = useRef(null);
  const sceneRef = useRef(null);
  const openRef = useRef(null);

  useEffect(() => {
    const root = document.documentElement;
    if (!root.hasAttribute("data-portfolio-entrance")) return;
    const overlay = entranceRef.current;
    const content = contentRef.current;
    const host = sceneRef.current;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motion.matches) {
      root.removeAttribute("data-portfolio-entrance");
      return;
    }
    let target = 0;
    let progress = 0;
    let previous = 0;
    let time = 0;
    let frame;
    let view;
    let drag;
    let closed = false;

    function finish() {
      if (closed) return;
      try {
        localStorage.setItem("portfolio-entrance-seen", "1");
      } catch {
        try { sessionStorage.setItem("portfolio-entrance-seen", "1"); } catch {}
      }
      const hadFocus = overlay.contains(document.activeElement);
      root.removeAttribute("data-portfolio-entrance");
      cleanup();
      if (hadFocus) content.focus({ preventScroll: true });
    }

    function update(now) {
      const delta = previous ? (now - previous) / 1000 : 0;
      previous = now;
      time += Math.min(delta, 0.05);
      progress += (target - progress) * (1 - Math.exp(-delta * 3.8));
      if (target === 1 && progress > 0.995) {
        finish();
        return;
      }
      overlay.style.setProperty("--entrance-peel", progress);
      content.style.setProperty("--entrance-zoom", 1 + 0.075 * (1 - progress));
      view?.draw(time, progress);
      frame = requestAnimationFrame(update);
    }

    function advance(amount) {
      target = Math.min(1, target + Math.max(0, amount));
      if (target >= 0.94) target = 1;
    }

    function wheel(event) {
      if (event.ctrlKey) return;
      event.preventDefault();
      const multiplier = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1;
      advance(Math.abs(event.deltaY || event.deltaX) * multiplier / 660);
    }

    function startDrag(event) {
      if (drag || event.button !== 0 || event.target.closest("button")) return;
      drag = { id: event.pointerId, x: event.clientX, y: event.clientY, start: target };
      overlay.setPointerCapture(event.pointerId);
      overlay.setAttribute("data-dragging", "");
    }

    function moveDrag(event) {
      if (drag?.id !== event.pointerId) return;
      const distance = Math.hypot(event.clientX - drag.x, event.clientY - drag.y);
      const required = Math.min(window.innerWidth, window.innerHeight) * 0.62;
      advance(drag.start + distance / required - target);
    }

    function endDrag(event) {
      if (drag?.id !== event.pointerId) return;
      drag = undefined;
      overlay.removeAttribute("data-dragging");
    }

    function play() {
      target = 1;
    }

    function keydown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        finish();
      } else if (["ArrowDown", "ArrowUp", "PageDown", "PageUp", " "].includes(event.key) && !event.target.closest?.("button")) {
        event.preventDefault();
        advance(0.25);
      }
    }

    function resize() {
      view?.resize();
    }

    function onContextLost(event) {
      event.preventDefault();
      delete host.dataset.rendered;
      view.canvas.removeEventListener("webglcontextlost", onContextLost);
      view.dispose();
      view = undefined;
    }

    function onMotionChange() {
      if (motion.matches) finish();
    }

    function cleanup() {
      if (closed) return;
      closed = true;
      cancelAnimationFrame(frame);
      root.removeAttribute("data-portfolio-entrance-active");
      content.inert = false;
      content.style.removeProperty("--entrance-zoom");
      overlay.style.removeProperty("--entrance-peel");
      overlay.removeAttribute("data-dragging");
      overlay.removeEventListener("wheel", wheel);
      overlay.removeEventListener("pointerdown", startDrag);
      overlay.removeEventListener("pointermove", moveDrag);
      overlay.removeEventListener("lostpointercapture", endDrag);
      document.removeEventListener("keydown", keydown);
      window.removeEventListener("resize", resize);
      motion.removeEventListener("change", onMotionChange);
      if (view) {
        view.canvas.removeEventListener("webglcontextlost", onContextLost);
        view.dispose();
      }
      delete host.dataset.rendered;
    }

    root.setAttribute("data-portfolio-entrance-active", "");
    content.inert = true;
    openRef.current = { play, finish };
    overlay.focus({ preventScroll: true });
    overlay.addEventListener("wheel", wheel, { passive: false });
    overlay.addEventListener("pointerdown", startDrag);
    overlay.addEventListener("pointermove", moveDrag);
    overlay.addEventListener("lostpointercapture", endDrag);
    document.addEventListener("keydown", keydown);
    window.addEventListener("resize", resize);
    motion.addEventListener("change", onMotionChange);
    frame = requestAnimationFrame(update);

    import("./cinematic-scenes").then(({ createEntranceScene }) => {
      if (closed) return;
      view = createEntranceScene(host);
      view.resize();
      view.draw(time, progress);
      view.canvas.addEventListener("webglcontextlost", onContextLost);
      host.dataset.rendered = "true";
    }).catch(() => {
      view?.dispose();
      view = undefined;
    });

    return () => {
      openRef.current = null;
      cleanup();
    };
  }, []);

  return <>
    <div ref={contentRef} className={styles.content} tabIndex={-1}>{children}</div>
    <div ref={entranceRef} className={styles.entrance} role="dialog" aria-modal="true" aria-label="Portfolio entrance" tabIndex={-1}>
      <div ref={sceneRef} className={styles.fabric} aria-hidden="true" />
      <div className={styles.controls}>
        <p>Scroll or drag to reveal</p>
        <button type="button" onClick={() => openRef.current?.play()}>Play reveal</button>
        <button type="button" onClick={() => openRef.current?.finish()}>Skip intro</button>
      </div>
    </div>
  </>;
}
