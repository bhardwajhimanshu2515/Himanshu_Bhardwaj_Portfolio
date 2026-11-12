"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./robot-guide.module.css";

const highlights = [
  ["overview", "Work guide", "Explore my featured project, production experience, and technical expertise.", "See Postline", "#projects"],
  ["projects", "Postline", "See how my Claude connector drafts, schedules, and publishes LinkedIn posts.", "Explore the project", "#projects-title"],
  ["experience", "Production work", "See the outcomes behind my work on American Water, Claimocity, and Emplify.", "View experience", "#experience"],
  ["expertise", "Technical expertise", "Explore the frontend, integration, and data tools I use across products.", "View expertise", "#expertise"],
  ["contact", "Get in touch", "Tell me about your team, your product, and the engineering challenge ahead.", "View contact", "#contact"],
];

export function RobotGuide() {
  const hostRef = useRef(null);
  const [active, setActive] = useState(0);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sections = highlights.map(([id]) => document.getElementById(id));
    let view;
    let disposed = false;
    let frame = 0;
    let lastScroll = window.scrollY;
    let yaw = 0;
    let pitch = 0;
    let targetYaw = 0;
    let targetPitch = 0;
    let blinkStart = -Infinity;

    function schedule() {
      if (!frame && !document.hidden && !disposed) frame = requestAnimationFrame(render);
    }

    function render(now) {
      frame = 0;
      const moving = !motion.matches;
      yaw = moving ? yaw + (targetYaw - yaw) * .22 : 0;
      pitch = moving ? pitch + (targetPitch - pitch) * .22 : 0;
      const blinkTime = now - blinkStart;
      const blinking = moving && blinkTime >= 0 && blinkTime < 160;
      const blink = blinking ? 1 - .94 * Math.sin(Math.PI * blinkTime / 160) : 1;
      host.style.setProperty("--guide-yaw", `${yaw * 7}deg`);
      host.style.setProperty("--guide-pitch", `${pitch * 4}deg`);
      view?.draw(yaw,pitch,blink);
      if (moving && (blinking || Math.abs(yaw-targetYaw) + Math.abs(pitch-targetPitch) > .01)) schedule();
    }

    function update() {
      const scroll = window.scrollY;
      const guideLine = window.innerHeight * .40;
      const rects = sections.map(section => section.getBoundingClientRect());
      const lastVisible = rects.findLastIndex(rect => rect.top <= guideLine);
      const atBottom = scroll + window.innerHeight >= document.documentElement.scrollHeight - 4;
      const index = atBottom ? highlights.length - 1 : Math.max(0,lastVisible);
      const direction = Math.sign(scroll - lastScroll);
      const local = Math.max(-1,Math.min(1,(guideLine-rects[index].top)/window.innerHeight - .42));
      setActive(index);
      targetYaw = -.50 + Math.sin(index * 1.28 + local * 2.5) * .39 + direction * .09;
      targetPitch = local * .48 + direction * .50;
      lastScroll = scroll;
      schedule();
    }

    function resize() {
      view?.resize();
      update();
    }

    function release() {
      if (!view) return;
      view.canvas.removeEventListener("webglcontextlost",loseContext);
      view.dispose();
      view = undefined;
      delete host.dataset.robotRendered;
    }

    function loseContext(event) {
      event.preventDefault();
      release();
    }

    const dimensions = new ResizeObserver(resize);
    dimensions.observe(host);
    window.addEventListener("scroll",update,{passive:true});
    window.addEventListener("resize",resize);
    document.addEventListener("visibilitychange",schedule);
    motion.addEventListener("change",update);
    const blinkTimer = window.setInterval(() => {
      if (motion.matches || document.hidden || !view) return;
      blinkStart = performance.now();
      schedule();
    },3900);

    update();
    import("./robot-model").then(({ createRobotScene }) => {
      if (disposed) return;
      view = createRobotScene(host);
      view.resize();
      view.draw(0,0,1);
      view.canvas.addEventListener("webglcontextlost",loseContext);
      host.dataset.robotRendered = "true";
      schedule();
    }).catch(() => release());

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      window.clearInterval(blinkTimer);
      dimensions.disconnect();
      window.removeEventListener("scroll",update);
      window.removeEventListener("resize",resize);
      document.removeEventListener("visibilitychange",schedule);
      motion.removeEventListener("change",update);
      release();
    };
  }, []);

  const [, title, text, action, href] = highlights[active];

  return <aside className={styles.guide} aria-label="Portfolio robot guide">
    {expanded && <div className={styles.highlight} id="robot-highlight" aria-live="polite">
      <strong>{title}</strong>
      <p>{text}</p>
      <a href={href} onClick={() => setExpanded(false)}>{action} <span aria-hidden="true">↗</span></a>
    </div>}
    <button
      type="button"
      className={styles.trigger}
      aria-label={`${expanded ? "Hide" : "Show"} robot guide highlight: ${title}`}
      aria-expanded={expanded}
      aria-controls={expanded ? "robot-highlight" : undefined}
      onClick={() => setExpanded(open => !open)}
    >
      <span ref={hostRef} className={styles.figure} aria-hidden="true">
        <img src="/hoodie-robot.webp" alt="" width="360" height="450" />
      </span>
      <span className={styles.label}>{title}</span>
    </button>
  </aside>;
}
