"use client";
import { useEffect, useRef, useState } from "react";
import styles from "./call-anatomy.module.css";

export const stages = [
  ["Set up the call", "The dialler asks the operator’s IMS service to establish a session using SIP. The receiving phone rings and the call connects when answered.", "Call control · SIP / IMS"],
  ["Capture your voice", "The microphone converts pressure changes into an electrical signal. The audio circuitry samples it, and a speech codec compresses the voice.", "Microphone · audio codec"],
  ["Transmit over radio", "The modem prepares the voice packets for the radio link. The RF circuitry and antenna transmit them to a serving base station.", "Modem · RF · antenna"],
  ["Cross the network", "The operator’s packet network carries the voice media toward the other phone’s network and serving cell. Voice media uses RTP; IMS manages the session.", "Radio access · packet core"],
  ["Recreate the sound", "The other phone receives and decodes the packets. Its audio output drives the earpiece, recreating the voice. The same process runs in reverse as the other person speaks.", "Decoder · amplifier · speaker"],
];

export function CallAnatomy() {
  const host = useRef(null);
  const controller = useRef(null);
  const [step, setStep] = useState(0);
  const [expanded, setExpanded] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    let cancelled = false;
    import("./call-scene").then(({ createCallScene }) => {
      if (cancelled) return;
      controller.current = createCallScene(host.current);
      setAvailable(true);
    }).catch(() => {});
    return () => { cancelled = true; controller.current?.dispose(); controller.current = null; };
  }, []);
  useEffect(() => { controller.current?.setState(step, expanded, playing); }, [step, expanded, playing, available]);
  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => {
      if (!document.hidden && host.current?.getBoundingClientRect().bottom > 0 && host.current?.getBoundingClientRect().top < innerHeight) setStep(value => (value + 1) % stages.length);
    }, 4800);
    return () => clearInterval(timer);
  }, [playing]);
  return <section id="call-anatomy" data-motion-chapter="call-anatomy" className="section wrap" aria-labelledby="call-anatomy-title">
    <div className={styles.heading}><div><span className="eyebrow">INTERACTIVE EXPLAINER</span><h2 id="call-anatomy-title">Inside a mobile call.</h2></div><p>Explore the hardware and network behind a voice call, one layer at a time.</p></div>
    <div className={styles.card}>
      <div className={styles.toolbar}><span>{stages[step][2]}</span><div><button onClick={() => setExpanded(value => !value)} aria-pressed={expanded}>{expanded ? "Assemble phone" : "Separate layers"}</button><button onClick={() => setPlaying(value => !value)} aria-pressed={playing}>{playing ? "Pause tour" : "Play tour"}</button></div></div>
      <div ref={host} className={styles.scene} aria-label="Exploded phone, radio mast and network equipment" role="img">
        {!available && <div className={styles.fallback}><strong>Follow the call</strong><p>Phone → serving cell → operator network → receiving phone</p><p>Select a stage below to explore the signal path.</p></div>}
      </div>
      <div className={styles.steps} aria-label="Call stages">{stages.map(([title], index) => <button key={title} aria-pressed={step === index} onClick={() => { setPlaying(false); setStep(index); }}><span>0{index + 1}</span>{title}</button>)}</div>
      <div className={styles.caption} aria-live="polite"><h3>{stages[step][0]}</h3><p>{stages[step][1]}</p></div>
    </div>
    <p className={styles.note}>Simplified VoLTE call. Hardware layout and animation timing are illustrative. <a href="https://www.gsma.com/solutions-and-impact/technologies/networks/documents-volte/" target="_blank" rel="noreferrer">Technical reference ↗</a></p>
  </section>;
}
