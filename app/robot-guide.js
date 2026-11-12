"use client";

import { useEffect, useRef, useState } from "react";
import { createFallbackBeam } from "./robot-beam-fallback";
import styles from "./robot-guide.module.css";

const highlights = {
  overview: ["Work guide", "Explore my featured project, production experience, and technical expertise.", "See Postline", "#projects"],
  projects: ["Postline", "See how my Claude connector drafts, schedules, and publishes LinkedIn posts.", "Explore the project", "#projects-title"],
  thesis: ["Engineering judgment", "See how product context and judgment shape the decisions behind Postline.", "Read what I believe", "#work-thesis"],
  lab: ["Inside the work", "Explore the systems and outcomes behind American Water, Claimocity, and Emplify.", "Explore the work", "#lab-title"],
  experience: ["Production work", "See the outcomes behind my work on American Water, Claimocity, and Emplify.", "View experience", "#experience"],
  method: ["Engineering method", "See how I connect interface design, integration, validation, and iteration.", "Explore the method", "#engineering-method"],
  expertise: ["Technical expertise", "Explore the frontend, integration, and data tools I use across products.", "View expertise", "#expertise"],
  contact: ["Get in touch", "Tell me about your team, your product, and the engineering challenge ahead.", "View contact", "#contact"],
};

function smoothStep(start, end, value) {
  const progress = Math.max(0, Math.min(1, (value - start) / (end - start)));
  return progress * progress * (3 - 2 * progress);
}

export function RobotGuide() {
  const hostRef = useRef(null);
  const overlayRef = useRef(null);
  const [active, setActive] = useState("overview");
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const overlay = overlayRef.current;
    const sections = Array.from(document.querySelectorAll("main [data-motion-chapter], #work-thesis"), section => ({
      id: section.dataset.motionChapter ?? "thesis",
      heading: section.querySelector("h1, h2"),
    })).filter(section => highlights[section.id] && section.heading);
    const textRange = document.createRange();
    const page = document.documentElement;
    const header = document.querySelector("header");
    let litHeading;
    let current;
    let target;
    let switchTime = 0;
    let lift = 0;
    let view;
    let fallback;
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

    function lightHeading(heading, intensity) {
      if (litHeading && litHeading !== heading) {
        litHeading.classList.remove(styles.litHeadline);
        litHeading.style.removeProperty("--torch-glow");
      }
      if (heading) {
        heading.classList.add(styles.litHeadline);
        heading.style.setProperty("--torch-glow", `${Math.round(intensity * 100)}%`);
      }
      litHeading = heading;
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

      const elapsed = Math.max(0, now - switchTime);
      const settle = moving ? smoothStep(250, 920, elapsed) : 1;
      const desiredLift = target ? 1 : 0;
      lift = moving ? lift + (desiredLift - lift) * .12 : desiredLift;
      const power = target ? smoothStep(150, 420, moving ? elapsed : 420) : 0;
      const sweptTarget = target && {
        ...target,
        x: target.x + (1 - settle) * Math.min(100, target.radiusX * .55),
        y: target.y + (1 - settle) * 75,
      };

      const scene = view ?? fallback;
      scene?.draw({ yaw, pitch, blink, lift, power, target: sweptTarget, elapsed: Math.min(elapsed, 1100) / 1000, settle });
      const landing = scene && target ? power * settle * settle : 0;
      lightHeading(landing > .03 ? current : undefined, landing);
      if (moving && (blinking || Math.abs(yaw - targetYaw) + Math.abs(pitch - targetPitch) > .01 ||
        (scene && ((target && elapsed < 1100) || Math.abs(lift - desiredLift) > .01)))) schedule();
    }

    function update() {
      const scroll = window.scrollY;
      const guideLine = window.innerHeight * .52;
      const headerBottom = Math.max(0, header?.getBoundingClientRect().bottom ?? 0);
      const rects = sections.map(({ heading }) => heading.getBoundingClientRect());
      const lastVisible = rects.findLastIndex(rect => rect.top <= guideLine);
      const atBottom = scroll + window.innerHeight >= page.scrollHeight - 4;
      const index = atBottom ? sections.length - 1 : Math.max(0, lastVisible);
      const direction = Math.sign(scroll - lastScroll);
      const local = Math.max(-1, Math.min(1, (guideLine - rects[index].top) / window.innerHeight - .42));
      setActive(sections[index].id);
      targetYaw = -.50 + Math.sin(index * 1.28 + local * 2.5) * .39 + direction * .09;
      targetPitch = local * .48 + direction * .50;
      lastScroll = scroll;

      const heading = sections[index].heading;
      const bounds = rects[index];
      const inFrame = bounds.top < window.innerHeight * .82 && bounds.bottom > headerBottom + 12;
      const next = inFrame && !page.hasAttribute("data-portfolio-entrance") ? heading : undefined;
      if (current !== next) {
        current = next;
        switchTime = performance.now();
      }

      if (current) {
        textRange.selectNodeContents(current);
        const textBounds = textRange.getBoundingClientRect();
        const top = Math.max(headerBottom + 8, textBounds.top);
        const bottom = Math.min(window.innerHeight - 12, textBounds.bottom);
        target = {
          x: textBounds.left + textBounds.width * .5,
          y: (top + bottom) * .5,
          radiusX: Math.max(44, textBounds.width * .65),
          radiusY: Math.max(28, (bottom - top) * .85),
        };
      } else {
        target = undefined;
      }
      schedule();
    }

    function resize() {
      (view ?? fallback)?.resize();
      update();
    }

    function release() {
      if (!view) return;
      view.canvas.removeEventListener("webglcontextlost", loseContext);
      view.dispose();
      view = undefined;
      delete host.dataset.robotRendered;
      lightHeading(undefined, 0);
    }

    function useFallback() {
      if (disposed) return;
      release();
      fallback = createFallbackBeam(host, overlay);
      switchTime = performance.now();
      resize();
    }

    function loseContext(event) {
      event.preventDefault();
      useFallback();
    }

    const dimensions = new ResizeObserver(resize);
    dimensions.observe(overlay);
    dimensions.observe(host);
    const entrance = new MutationObserver(update);
    entrance.observe(page, { attributes: true, attributeFilter: ["data-portfolio-entrance"] });
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
      view = createRobotScene(host, overlay);
      view.resize();
      switchTime = performance.now();
      if (frame) cancelAnimationFrame(frame);
      render(switchTime);
      view.canvas.addEventListener("webglcontextlost",loseContext);
      host.dataset.robotRendered = "true";
      schedule();
    }).catch(useFallback);

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      window.clearInterval(blinkTimer);
      dimensions.disconnect();
      entrance.disconnect();
      window.removeEventListener("scroll",update);
      window.removeEventListener("resize",resize);
      document.removeEventListener("visibilitychange",schedule);
      motion.removeEventListener("change",update);
      release();
      fallback?.dispose();
      lightHeading(undefined, 0);
    };
  }, []);

  const [title, text, action, href] = highlights[active];

  return <>
    <div ref={overlayRef} className={styles.stage} aria-hidden="true" />
    <aside className={styles.guide} aria-label="Portfolio robot guide">
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
    </aside>
  </>;
}
