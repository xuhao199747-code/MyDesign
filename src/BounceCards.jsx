import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import "./BounceCards.css";

export default function BounceCards({
  className = "",
  cards = [],
  images = [],
  animationDelay = 1,
  animationStagger = 0.08,
  easeType = "elastic.out(1, 0.5)",
  transformStyles = [
    "rotate(5deg) translate(-150px)",
    "rotate(0deg) translate(-70px)",
    "rotate(-5deg)",
    "rotate(5deg) translate(70px)",
    "rotate(-5deg) translate(150px)",
  ],
  mobileTransformStyles = [
    "rotate(5deg) translate(-104px)",
    "rotate(-4deg) translate(-34px)",
    "rotate(4deg) translate(34px)",
    "rotate(-5deg) translate(104px)",
  ],
  enableHover = true,
}) {
  const containerRef = useRef(null);
  const cardRefs = useRef([]);
  const hasAnimatedRef = useRef(false);
  const resetTimerRef = useRef(null);
  const navigationTimerRef = useRef(null);
  const lastPointerTypeRef = useRef("mouse");
  const [isMobileLayout, setIsMobileLayout] = useState(false);
  const [currentTransformStyles, setCurrentTransformStyles] = useState(transformStyles);
  const [raisedCardIndex, setRaisedCardIndex] = useState(null);
  const entries = cards.length
    ? cards
    : images.map((src, index) => ({
        slug: `image-${index}`,
        title: `Card ${index + 1}`,
        image: src,
        href: src,
      }));

  useEffect(() => {
    if (!window.matchMedia) {
      setIsMobileLayout(window.innerWidth <= 768);
      return undefined;
    }

    const mediaQuery = window.matchMedia("(max-width: 768px)");

    const syncLayoutMode = (event) => {
      setIsMobileLayout(event.matches);
    };

    setIsMobileLayout(mediaQuery.matches);
    mediaQuery.addEventListener("change", syncLayoutMode);

    return () => {
      mediaQuery.removeEventListener("change", syncLayoutMode);
    };
  }, []);

  useEffect(() => {
    setCurrentTransformStyles(isMobileLayout ? mobileTransformStyles : transformStyles);
  }, [isMobileLayout, mobileTransformStyles, transformStyles]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray(".card");
      gsap.set(cards, { scale: 0.001 });

      const runIntro = () => {
        if (hasAnimatedRef.current) return;
        hasAnimatedRef.current = true;
        gsap.fromTo(
          cards,
          { scale: 0.001 },
          {
            scale: 1,
            stagger: animationStagger,
            ease: easeType,
            delay: animationDelay,
            overwrite: "auto",
          }
        );
      };

      if ("IntersectionObserver" in window) {
        const observer = new IntersectionObserver(
          (entries) => {
            const [entry] = entries;
            if (!entry?.isIntersecting || hasAnimatedRef.current) return;
            runIntro();
            observer.disconnect();
          },
          {
            root: null,
            rootMargin: "0px 0px -12% 0px",
            threshold: 0.12,
          }
        );

        observer.observe(container);
        return () => observer.disconnect();
      }

      const checkInView = () => {
        const rect = container.getBoundingClientRect();
        const viewportHeight =
          window.innerHeight || document.documentElement.clientHeight;
        if (rect.top < viewportHeight * 0.82 && rect.bottom > viewportHeight * 0.12) {
          runIntro();
          cleanup();
        }
      };

      const cleanup = () => {
        window.removeEventListener("scroll", checkInView);
        window.removeEventListener("resize", checkInView);
      };

      window.addEventListener("scroll", checkInView, { passive: true });
      window.addEventListener("resize", checkInView);
      window.requestAnimationFrame(checkInView);

      return cleanup;
    }, containerRef);

    return () => ctx.revert();
  }, [animationStagger, easeType, animationDelay]);

  const getNoRotationTransform = (transformStr) => {
    const hasRotate = /rotate\([\s\S]*?\)/.test(transformStr);
    if (hasRotate) {
      return transformStr.replace(/rotate\([\s\S]*?\)/, "rotate(0deg)");
    }
    if (transformStr === "none") {
      return "rotate(0deg)";
    }
    return `${transformStr} rotate(0deg)`;
  };

  const getPushedTransform = (baseTransform, offsetX) => {
    const translateRegex = /translate\(([-0-9.]+)px\)/;
    const match = baseTransform.match(translateRegex);
    if (match) {
      const currentX = parseFloat(match[1]);
      const newX = currentX + offsetX;
      return baseTransform.replace(translateRegex, `translate(${newX}px)`);
    }
    return baseTransform === "none"
      ? `translate(${offsetX}px)`
      : `${baseTransform} translate(${offsetX}px)`;
  };

  const getCardNode = (idx) => cardRefs.current[idx] || null;

  const pushSiblings = (hoveredIdx) => {
    if (!enableHover) return;
    const hoverOffset = isMobileLayout ? -110 : -160;

    entries.forEach((_, i) => {
      const target = getCardNode(i);
      if (!target) return;
      gsap.killTweensOf(target);

      const baseTransform = currentTransformStyles[i] || "none";

      if (i === hoveredIdx) {
        const noRotationTransform = getNoRotationTransform(baseTransform);
        gsap.to(target, {
          transform: `translate(-50%, -50%) ${noRotationTransform}`,
          duration: 0.4,
          ease: "back.out(1.4)",
          overwrite: "auto",
        });
      } else {
        const offsetX = i < hoveredIdx ? hoverOffset : Math.abs(hoverOffset);
        const pushedTransform = getPushedTransform(baseTransform, offsetX);
        const distance = Math.abs(hoveredIdx - i);
        const delay = distance * 0.05;

        gsap.to(target, {
          transform: `translate(-50%, -50%) ${pushedTransform}`,
          duration: 0.4,
          ease: "back.out(1.4)",
          delay,
          overwrite: "auto",
        });
      }
    });
  };

  const resetSiblings = () => {
    if (!enableHover) return;

    entries.forEach((_, i) => {
      const target = getCardNode(i);
      if (!target) return;
      gsap.killTweensOf(target);
      const baseTransform = currentTransformStyles[i] || "none";
      gsap.to(target, {
        transform: `translate(-50%, -50%) ${baseTransform}`,
        duration: 0.4,
        ease: "back.out(1.4)",
        overwrite: "auto",
      });
    });
  };

  const activateCard = (idx) => {
    setRaisedCardIndex(idx);
    pushSiblings(idx);
    if (resetTimerRef.current) {
      window.clearTimeout(resetTimerRef.current);
    }
    resetTimerRef.current = window.setTimeout(() => {
      resetSiblings();
      setRaisedCardIndex(null);
      resetTimerRef.current = null;
    }, 1100);
  };

  const isMobileInteraction = () =>
    isMobileLayout;

  const openCardLink = (href) => {
    if (!href) return;
    window.location.assign(href);
  };

  useEffect(() => {
    if (!containerRef.current) return;
    entries.forEach((_, i) => {
      const target = getCardNode(i);
      if (target) {
        gsap.to(target, {
          transform: `translate(-50%, -50%) ${currentTransformStyles[i] ?? "none"}`,
          duration: 0.3,
          ease: "back.out(1.4)",
        });
      }
    });
  }, [currentTransformStyles, entries]);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) {
        window.clearTimeout(resetTimerRef.current);
      }
      if (navigationTimerRef.current) {
        window.clearTimeout(navigationTimerRef.current);
      }
    };
  }, []);

  return (
    <div
      className={`bounceCardsContainer relative block w-full max-w-none touch-pan-y isolate overflow-visible max-md:w-full ${className}`}
      ref={containerRef}
    >
      {entries.map((item, idx) => (
        <a
          key={item.slug || item.image}
          className={`card card-${idx} absolute left-1/2 top-1/2 origin-center cursor-pointer no-underline [will-change:transform] max-md:rounded-[clamp(10px,2.5vw,14px)]`}
          ref={(node) => {
            cardRefs.current[idx] = node;
          }}
          href={item.href || `./project.html?slug=${item.slug}`}
          style={{
            transform: `translate(-50%, -50%) ${currentTransformStyles[idx] ?? "none"}`,
            top: "50%",
            left: "50%",
            zIndex: raisedCardIndex === idx ? 8 : undefined,
          }}
          onMouseEnter={() => {
            setRaisedCardIndex(idx);
            pushSiblings(idx);
          }}
          onMouseLeave={() => {
            resetSiblings();
            setRaisedCardIndex(null);
          }}
          onPointerDown={(event) => {
            lastPointerTypeRef.current = event.pointerType || "mouse";
            setRaisedCardIndex(idx);
          }}
          onFocus={() => setRaisedCardIndex(idx)}
          onBlur={() => setRaisedCardIndex(null)}
          onClick={(event) => {
            if (window.__portfolioBounceDragging) {
              event.preventDefault();
              return;
            }

            const shouldAnimateFirst =
              isMobileInteraction() || lastPointerTypeRef.current !== "mouse";

            if (!shouldAnimateFirst) {
              return;
            }

            event.preventDefault();
            activateCard(idx);

            if (navigationTimerRef.current) {
              window.clearTimeout(navigationTimerRef.current);
            }

            const { href } = event.currentTarget;
            navigationTimerRef.current = window.setTimeout(() => {
              openCardLink(href);
              navigationTimerRef.current = null;
            }, 360);
          }}
        >
          <div className="cardTiltSurface h-full w-full overflow-hidden rounded-[inherit] bg-slate-50 shadow-[0_22px_60px_rgba(15,23,42,0.16)]">
            <img
              className="image block h-full w-full object-cover"
              src={item.image}
              alt={item.title || `card-${idx}`}
              loading="lazy"
              decoding="async"
            />
          </div>
        </a>
      ))}
    </div>
  );
}
