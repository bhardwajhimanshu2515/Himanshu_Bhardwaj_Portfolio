"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./reactor-cutaway.module.css";

const phases = [
  ["Exterior", "The reactor, assembled", "Copper rings surround the core. Follow the cut through the shell to see how the engineering layers fit together."],
  ["Cross-section", "Inside the shell", "The two halves separate around the centerline, bringing the core and its three layers into view."],
  ["Engineering layers", "Interface, services, data", "The interface handles what people see. Services connect it to the backend. The data layer stores and retrieves what the product needs."],
];

const stops = [0, 0.58, 1];
const clamp = value => Math.max(0, Math.min(1, value));

export function ReactorCutaway() {
  const sequence = useRef(null);
  const panel = useRef(null);
  const override = useRef(null);
  const [phase, setPhase] = useState(0);

  function show(progress) {
    const opening = clamp((progress - 0.17) / 0.55);
    const detail = clamp((progress - 0.52) / 0.39);
    panel.current.style.setProperty("--cutaway-open", opening * opening * (3 - 2 * opening));
    panel.current.style.setProperty("--cutaway-scan", clamp(progress / 0.28));
    panel.current.style.setProperty("--cutaway-detail", detail);
    setPhase(progress >= 0.76 ? 2 : progress >= 0.29 ? 1 : 0);
  }

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sticky = window.matchMedia("(min-height: 650px)");
    let frame = 0;

    function update() {
      frame = 0;
      if (motion.matches || !sticky.matches || override.current !== null) return;
      const top = sequence.current.getBoundingClientRect().top;
      const pinOffset = parseFloat(getComputedStyle(panel.current).top) || 0;
      const distance = sequence.current.offsetHeight - panel.current.offsetHeight;
      show(clamp((pinOffset - top) / Math.max(distance, 1)));
    }

    function schedule() {
      if (!frame) frame = requestAnimationFrame(update);
    }

    function onScroll() {
      if (override.current !== null && Math.abs(window.scrollY - override.current) > 16) {
        override.current = null;
      }
      schedule();
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", schedule);
    motion.addEventListener("change", schedule);
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", schedule);
      motion.removeEventListener("change", schedule);
    };
  }, []);

  function select(index) {
    override.current = window.scrollY;
    show(stops[index]);
  }

  return <section ref={sequence} className={styles.sequence} id="reactor-cutaway" aria-labelledby="reactor-cutaway-title">
    <div ref={panel} className={styles.panel}>
      <div className={styles.stage} aria-hidden="true">
        <div className={styles.halo} />
        <div className={styles.core}><img src="/reactor-core.webp" alt="" width="820" height="820" loading="lazy" /></div>
        <div className={styles.leftShell}><div className={styles.shellSkin} /></div>
        <div className={styles.rightShell}><div className={styles.shellSkin} /></div>
        <div className={styles.cut} />
        <div className={styles.callouts}>
          <span>Interface</span>
          <span>Services</span>
          <span>Data</span>
        </div>
      </div>
      <div className={styles.description}>
        <h2 id="reactor-cutaway-title">Inside the reactor.</h2>
        <div className={styles.controls} aria-label="Reactor views">
          {phases.map(([label], index) => <button key={label} type="button" aria-pressed={phase === index} onClick={() => select(index)}>{label}</button>)}
        </div>
        <div className={styles.readout} aria-live="polite">
          <h3>{phases[phase][1]}</h3>
          <p>{phases[phase][2]}</p>
        </div>
      </div>
    </div>
  </section>;
}
