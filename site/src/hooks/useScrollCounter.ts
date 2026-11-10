import { useEffect, useRef, useState } from "react";

export function useScrollCounter(duration = 1400) {
  const sectionRef = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motion.matches || !("IntersectionObserver" in window) || duration <= 0) {
      setProgress(1);
      return;
    }
    let frame = 0;
    let start: number | undefined;
    const animate = (timestamp: number) => {
      start ??= timestamp;
      const elapsed = Math.min((timestamp - start) / duration, 1);
      setProgress(1 - Math.pow(1 - elapsed, 3));
      if (elapsed < 1) frame = window.requestAnimationFrame(animate);
    };
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return;
      observer.disconnect();
      frame = window.requestAnimationFrame(animate);
    }, { threshold: 0.15 });
    const stopForReducedMotion = () => {
      if (!motion.matches) return;
      observer.disconnect();
      window.cancelAnimationFrame(frame);
      setProgress(1);
    };
    observer.observe(section);
    motion.addEventListener("change", stopForReducedMotion);
    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frame);
      motion.removeEventListener("change", stopForReducedMotion);
    };
  }, [duration]);

  return { sectionRef, progress };
}
