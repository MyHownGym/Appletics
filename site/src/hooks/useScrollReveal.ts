import { useLayoutEffect, useRef } from "react";

export function useScrollReveal() {
  const pageRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const page = pageRef.current;
    if (!page || !("IntersectionObserver" in window)) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const elements = new Set<HTMLElement>();
    const reset = (element: HTMLElement) => {
      element.classList.remove("scroll-reveal-pending", "scroll-reveal-visible");
    };
    const reveal = (element: HTMLElement, immediately = false) => {
      observer.unobserve(element);
      if (immediately) reset(element);
      else element.classList.add("scroll-reveal-visible");
    };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) reveal(entry.target as HTMLElement);
      });
    }, { threshold: 0, rootMargin: "0px 0px -24px 0px" });
    const register = (element: HTMLElement) => {
      if (elements.has(element)) return;
      elements.add(element);
      if (motion.matches || element.getBoundingClientRect().bottom <= 0) return;
      element.classList.add("scroll-reveal-pending");
      observer.observe(element);
    };
    page.querySelectorAll<HTMLElement>("[data-scroll-reveal]").forEach(register);
    const mutations = new MutationObserver((records) => {
      records.forEach((record) => record.addedNodes.forEach((node) => {
        if (!(node instanceof HTMLElement)) return;
        if (node.matches("[data-scroll-reveal]")) register(node);
        node.querySelectorAll<HTMLElement>("[data-scroll-reveal]").forEach(register);
      }));
    });
    const stopMotion = () => {
      if (!motion.matches) return;
      observer.disconnect();
      elements.forEach(reset);
    };
    const revealFocused = (event: FocusEvent) => {
      if (!(event.target instanceof HTMLElement)) return;
      const element = event.target.closest<HTMLElement>("[data-scroll-reveal]");
      if (element && elements.has(element)) reveal(element, true);
    };
    const finishTransition = (event: TransitionEvent) => {
      if (event.propertyName !== "opacity" || !(event.target instanceof HTMLElement)) return;
      if (elements.has(event.target) && event.target.classList.contains("scroll-reveal-visible")) reset(event.target);
    };
    mutations.observe(page, { childList: true, subtree: true });
    motion.addEventListener("change", stopMotion);
    page.addEventListener("focusin", revealFocused);
    page.addEventListener("transitionend", finishTransition);
    return () => {
      observer.disconnect();
      mutations.disconnect();
      motion.removeEventListener("change", stopMotion);
      page.removeEventListener("focusin", revealFocused);
      page.removeEventListener("transitionend", finishTransition);
      elements.forEach(reset);
    };
  }, []);

  return pageRef;
}
