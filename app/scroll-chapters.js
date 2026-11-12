import { useEffect } from "react";

const clamp = value => Math.min(1, Math.max(0, value));

export function useScrollChapters(rootRef) {
  useEffect(() => {
    const root = rootRef.current;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const chapters = [...root.querySelectorAll("[data-motion-chapter]")];
    let frame = 0;

    function reset() {
      for (const chapter of chapters) {
        chapter.style.removeProperty("--chapter-progress");
        chapter.style.removeProperty("--chapter-arrival");
      }
    }

    function update() {
      frame = 0;
      const height = window.innerHeight;
      const scroll = window.scrollY;
      const viewportTravel = document.documentElement.scrollHeight - height;
      const states = chapters.map(chapter => {
        const { top } = chapter.getBoundingClientRect();
        const hero = chapter.dataset.motionChapter === "overview";
        const start = hero ? height * 0.19 : height * 0.90;
        // Short sections near the footer still settle before the page ends.
        const end = hero ? -height * 0.46 : Math.max(height * 0.27, top + scroll - viewportTravel);
        const progress = clamp((start - top) / Math.max(height * 0.18, start - end));
        return { chapter, progress };
      });
      for (const { chapter, progress } of states) {
        chapter.style.setProperty("--chapter-progress", progress.toFixed(4));
        chapter.style.setProperty("--chapter-arrival", (1 - progress * progress * (3 - 2 * progress)).toFixed(4));
      }
    }

    function schedule() {
      if (!frame && !motion.matches) frame = requestAnimationFrame(update);
    }

    function onMotionChange() {
      if (motion.matches) {
        cancelAnimationFrame(frame);
        frame = 0;
        reset();
      } else {
        schedule();
      }
    }

    const dimensions = new ResizeObserver(schedule);
    dimensions.observe(root);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    motion.addEventListener("change", onMotionChange);
    schedule();

    return () => {
      cancelAnimationFrame(frame);
      dimensions.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      motion.removeEventListener("change", onMotionChange);
      reset();
    };
  }, [rootRef]);
}
