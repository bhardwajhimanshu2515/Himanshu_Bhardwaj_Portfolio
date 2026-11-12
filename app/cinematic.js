"use client";

import { useEffect, useRef } from "react";
import { journeyPose, measureJourney } from "./portfolio-journey";
import styles from "./cinematic.module.css";

const circuitRoutes = [
  "M552 688 L515 655 L448 655 L425 626 L337 626 L320 600 L221 600 L190 562 L107 562",
  "M552 688 L592 656 L658 656 L686 615 L743 615 L775 572 L858 572 L884 528 L1008 528",
  "M552 688 L517 725 L478 725 L447 768 L375 768 L335 810 L246 810 L224 852 L115 852",
  "M552 688 L597 731 L649 731 L681 774 L749 774 L773 813 L854 813 L890 849 L1006 849",
  "M552 688 L550 609 L528 568 L528 498 L499 475 L499 387 L471 352 L471 261",
  "M552 688 L577 762 L577 835 L609 859 L609 942 L641 983 L641 1107 L680 1139",
  "M96 438 L179 438 L206 411 L277 411 L305 374 L385 374 L417 339 L513 339 L552 303 L677 303",
  "M349 1101 L434 1101 L459 1062 L545 1062 L580 1032 L673 1032 L706 997 L800 997 L836 960 L919 960",
  "M198 991 L254 991 L287 945 L346 945 L369 904 L424 904 L455 858 L519 858 L552 809 L552 688",
  "M927 363 L859 363 L832 400 L768 400 L730 447 L666 447 L640 494 L595 494 L568 547 L552 688",
];

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
      <img src="/circuit-sphere-hd.webp" alt="" width="1120" height="1400" />
      <div className={styles.heartbeat} />
      <svg className={styles.electricity} viewBox="0 0 1120 1400" aria-hidden="true">
        {circuitRoutes.map((route, index) => <g key={route} style={{ "--route-index": index }}>
          <path d={route} pathLength="100" />
          <path d={route} pathLength="100" />
        </g>)}
      </svg>
    </div>
    <div className={styles.fallbackLayers}><i /><i /><i /></div>
  </div>;
}
