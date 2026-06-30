import { useEffect, useRef } from "react";

import "./CursorRing.css";

export default function CursorRing({
  followEase = 0.22,
  assistantBlockSelectors = "#chatWidgetRoot, .site-assistant__panel, .site-assistant__trigger",
  interactiveSelectors = "a, button, input, textarea, select, label, [role='button'], .photo-hover-hitbox, .bounceCardsContainer .card, .portfolio-featured__cell",
}) {
  const lensRef = useRef(null);
  const ringRef = useRef(null);
  const dotRef = useRef(null);
  const pointerRef = useRef({
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  });
  const ringPosRef = useRef({
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  });

  useEffect(() => {
    const lens = lensRef.current;
    const ring = ringRef.current;
    const dot = dotRef.current;
    if (!lens || !ring || !dot) return undefined;

    let frameId = 0;
    let isPointerActive = false;
    let isLocked = false;

    const stopAnimation = () => {
      if (!frameId) return;
      window.cancelAnimationFrame(frameId);
      frameId = 0;
    };

    const isInsideAssistant = (target) =>
      target instanceof Element && Boolean(target.closest(assistantBlockSelectors));

    const updatePointer = (event) => {
      if (isInsideAssistant(event.target)) {
        hide();
        return;
      }
      if (isLocked) return;
      isPointerActive = true;
      pointerRef.current.x = event.clientX;
      pointerRef.current.y = event.clientY;
      dot.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0) translate(-50%, -50%)`;
      lens.classList.add("is-visible");
      ring.classList.add("is-visible");
      dot.classList.add("is-visible");
      ensureAnimation();
      const target = event.target;
      const isInteractive =
        target instanceof Element && Boolean(target.closest(interactiveSelectors));

      lens.classList.toggle("is-interactive", isInteractive);
      ring.classList.toggle("is-interactive", isInteractive);
    };

    const animate = () => {
      const pointer = pointerRef.current;
      const ringPos = ringPosRef.current;
      const dx = pointer.x - ringPos.x;
      const dy = pointer.y - ringPos.y;
      ringPos.x += dx * followEase;
      ringPos.y += dy * followEase;
      lens.style.transform = `translate3d(${ringPos.x}px, ${ringPos.y}px, 0) translate(-50%, -50%)`;
      ring.style.transform = `translate3d(${ringPos.x}px, ${ringPos.y}px, 0) translate(-50%, -50%)`;

      if (Math.abs(dx) < 0.35 && Math.abs(dy) < 0.35) {
        frameId = 0;
        return;
      }

      frameId = window.requestAnimationFrame(animate);
    };

    const ensureAnimation = () => {
      if (frameId) return;
      frameId = window.requestAnimationFrame(animate);
    };

    const hide = () => {
      isPointerActive = false;
      lens.classList.remove("is-visible", "is-interactive");
      ring.classList.remove("is-visible", "is-interactive");
      dot.classList.remove("is-visible");
      stopAnimation();
    };

    const handleCursorLock = (event) => {
      isLocked = Boolean(event.detail?.locked);
      if (isLocked) {
        hide();
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        hide();
      } else {
        show();
      }
    };

    const show = () => {
      if (!isPointerActive) return;
      lens.classList.add("is-visible");
      ring.classList.add("is-visible");
      dot.classList.add("is-visible");
    };

    window.addEventListener("pointermove", updatePointer, { passive: true });
    window.addEventListener("site-assistant:cursor-lock", handleCursorLock);
    window.addEventListener("pointerleave", hide);
    window.addEventListener("blur", hide);
    window.addEventListener("focus", show);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("pointermove", updatePointer);
      window.removeEventListener("site-assistant:cursor-lock", handleCursorLock);
      window.removeEventListener("pointerleave", hide);
      window.removeEventListener("blur", hide);
      window.removeEventListener("focus", show);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      stopAnimation();
    };
  }, [assistantBlockSelectors, followEase, interactiveSelectors]);

  return (
    <>
      <div ref={lensRef} className="cursor-ring-lens" />
      <div ref={ringRef} className="cursor-ring" />
      <div ref={dotRef} className="cursor-ring-dot" />
    </>
  );
}
