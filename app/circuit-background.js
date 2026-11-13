"use client";
import { useEffect, useRef } from "react";
import styles from "./circuit-background.module.css";

export function CircuitBackground() {
  const ref = useRef(null);
  useEffect(() => {
    let dispose;
    let cancelled = false;
    import("./circuit-world").then(({ createCircuitWorld }) => {
      if (!cancelled) dispose = createCircuitWorld(ref.current);
    }).catch(() => {});
    return () => { cancelled = true; dispose?.(); };
  }, []);
  return <div ref={ref} className={styles.background} aria-hidden="true" />;
}
