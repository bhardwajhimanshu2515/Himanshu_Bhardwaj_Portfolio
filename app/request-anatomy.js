"use client";
import { useEffect, useRef, useState } from "react";
import { requestStages as stages, stageDuration } from "./request-model";
import styles from "./request-anatomy.module.css";

export function RequestAnatomy() {
  const host = useRef(null);
  const controller = useRef(null);
  const [step, setStep] = useState(0);
  const [expanded, setExpanded] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [available, setAvailable] = useState(false);
  const [replica, setReplica] = useState(0);
  const [view, setView] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const unavailable = () => setAvailable(false);
    const element = host.current;
    element.addEventListener("scene-unavailable", unavailable);
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      import("./request-scene").then(({ createRequestScene }) => {
        if (cancelled) return;
        controller.current = createRequestScene(host.current);
        setAvailable(true);
      }).catch(() => {});
    }, { rootMargin: "200px" });
    observer.observe(host.current);
    const reduce = matchMedia("(prefers-reduced-motion: reduce)");
    setPlaying(!reduce.matches);
    const preference = () => { if (reduce.matches) setPlaying(false); };
    reduce.addEventListener("change", preference);
    return () => { cancelled = true; element.removeEventListener("scene-unavailable", unavailable); observer.disconnect(); reduce.removeEventListener("change", preference); controller.current?.dispose(); controller.current = null; };
  }, []);
  useEffect(() => { controller.current?.setState({ step, expanded, playing, replica, view }); }, [step, expanded, playing, replica, view, available]);
  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => {
      const rect = host.current?.getBoundingClientRect();
      if (!matchMedia("(prefers-reduced-motion: reduce)").matches && !document.hidden && rect && rect.bottom > 0 && rect.top < innerHeight) setStep(value => (value + 1) % stages.length);
    }, stageDuration);
    return () => clearInterval(timer);
  }, [playing]);
  const select = index => { setPlaying(false); setStep(index); };
  return <section id="request-anatomy" data-motion-chapter="request-anatomy" className="section wrap" aria-labelledby="request-anatomy-title">
    <div className={styles.heading}><div><span className="eyebrow">SYSTEM ANATOMY / INTERACTIVE</span><h2 id="request-anatomy-title">One click. An entire system.</h2></div><p>Follow a request from React to the cloud, through Docker services, and back to your screen.</p></div>
    <div className={styles.card}>
      <div className={styles.toolbar}><span>FIG 01 / REQUEST JOURNEY</span><div>
        <button onClick={() => setExpanded(value => !value)} aria-pressed={expanded}>{expanded ? "Close rack" : "Open rack"}</button>
        <button onClick={() => setView(value => !value)} aria-pressed={view}>Rotate view</button>
        <button onClick={() => setPlaying(value => !value)} aria-pressed={playing}>{playing ? "Pause tour" : "Play tour"}</button>
      </div></div>
      <div ref={host} className={styles.scene} aria-label={`3D browser workstation and cloud server rack. Stage ${step + 1}: ${stages[step].title}. Backend replica ${replica ? "B" : "A"} selected.`} role="img">
        {!available && <div className={styles.fallback}><strong>Browser → Cloud → Load balancer</strong><p>Docker API replica {replica ? "B" : "A"} → Database → JSON response</p><p>The stages below work with or without 3D graphics.</p></div>}
      </div>
      <div className={styles.legend}><span>Workstation: frontend</span><span>Rack: cloud infrastructure</span><span>Amber pulse: active request</span></div>
      <div className={styles.routing}><span>Inspect a healthy backend replica</span><div>{["A", "B"].map((name, index) => <button key={name} aria-pressed={replica === index} onClick={() => { setReplica(index); select(2); }}>Replica {name}{replica === index ? " · Selected" : ""}</button>)}</div></div>
      <div className={styles.steps} aria-label="Request stages">{stages.map(({ title }, index) => <button key={title} aria-pressed={step === index} onFocus={() => setPlaying(false)} onClick={() => select(index)}><span>0{index + 1}</span>{title}</button>)}</div>
      <div className={styles.caption} aria-live={playing ? "off" : "polite"} aria-atomic="true"><span className="eyebrow">{stages[step].label}</span><h3>{stages[step].title}</h3><p>{stages[step].detail}</p><code className={styles.readout}>{stages[step].readout}{step === 2 || step === 3 ? ` · Replica ${replica ? "B" : "A"}` : ""}</code></div>
    </div>
    <p className={styles.note}>Illustrative cloud architecture, not this portfolio’s deployment. Containers are isolated processes, shown as removable server cartridges. Timing is slowed for explanation. <a href="https://docs.docker.com/engine/containers/run/" target="_blank" rel="noreferrer">Docker ↗</a> · <a href="https://docs.aws.amazon.com/elasticloadbalancing/latest/application/load-balancer-target-groups.html" target="_blank" rel="noreferrer">Load balancing ↗</a></p>
  </section>;
}
