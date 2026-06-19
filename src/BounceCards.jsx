import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import "./BounceCards.css";

export default function BounceCards({
  className = "",
  cards = [],
  images = [],
  containerWidth = 500,
  containerHeight = 250,
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
  enableHover = true,
}) {
  const containerRef = useRef(null);
  const hasAnimatedRef = useRef(false);
  const resetTimerRef = useRef(null);
  const navigationTimerRef = useRef(null);
  const lastPointerTypeRef = useRef("mouse");
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
    const updateTransformStyles = () => {
      const isMobile = window.innerWidth <= 768;
      
      if (isMobile) {
        const mobileTransformStyles = [
          "rotate(5deg) translate(-104px)",
          "rotate(-4deg) translate(-34px)",
          "rotate(4deg) translate(34px)",
          "rotate(-5deg) translate(104px)",
        ];
        setCurrentTransformStyles(mobileTransformStyles);
      } else {
        setCurrentTransformStyles(transformStyles);
      }
    };

    updateTransformStyles();
    window.addEventListener("resize", updateTransformStyles);
    
    return () => {
      window.removeEventListener("resize", updateTransformStyles);
    };
  }, [transformStyles]);

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

      const checkInView = () => {
        if (hasAnimatedRef.current) {
          cleanup();
          return;
        }
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
        window.clearInterval(viewCheckTimer);
      };

      window.addEventListener("scroll", checkInView, { passive: true });
      window.addEventListener("resize", checkInView);
      window.requestAnimationFrame(checkInView);
      const viewCheckTimer = window.setInterval(checkInView, 180);

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

  const pushSiblings = (hoveredIdx) => {
    if (!enableHover || !containerRef.current) return;

    const q = gsap.utils.selector(containerRef);
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
    const hoverOffset = isMobile ? -110 : -160;

    entries.forEach((_, i) => {
      const target = q(`.card-${i}`);
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
    if (!enableHover || !containerRef.current) return;

    const q = gsap.utils.selector(containerRef);

    entries.forEach((_, i) => {
      const target = q(`.card-${i}`);
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
      resetCardTilt(idx);
      resetSiblings();
      setRaisedCardIndex(null);
      resetTimerRef.current = null;
    }, 1100);
  };

  const isMobileInteraction = () =>
    typeof window !== "undefined" && window.innerWidth <= 768;

  const openCardLink = (href, target) => {
    if (!href) return;
    if (target === "_blank") {
      window.open(href, "_blank", "noopener,noreferrer");
      return;
    }
    window.location.assign(href);
  };

  const updateCardTilt = (event, idx) => {
    if (!enableHover) return;

    const card = event.currentTarget;
    const rect = card.getBoundingClientRect();
    const edgeInset = 10;
    const isInsideStableHoverZone =
      event.clientX >= rect.left + edgeInset &&
      event.clientX <= rect.right - edgeInset &&
      event.clientY >= rect.top + edgeInset &&
      event.clientY <= rect.bottom - edgeInset;

    if (!isInsideStableHoverZone) {
      resetCardTilt(idx);
      return;
    }

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const rotateX = Math.max(
      -10,
      Math.min(10, ((event.clientY - centerY) / (rect.height / 2)) * -10)
    );
    const rotateY = Math.max(
      -10,
      Math.min(10, ((event.clientX - centerX) / (rect.width / 2)) * 10)
    );

    const target = containerRef.current?.querySelector(`.card-${idx}`);
    if (!target) return;
    target.style.setProperty("--card-tilt-x", `${rotateX.toFixed(3)}deg`);
    target.style.setProperty("--card-tilt-y", `${rotateY.toFixed(3)}deg`);
    target.style.setProperty("--card-tilt-scale", "1.025");
  };

  const resetCardTilt = (idx) => {
    const target = containerRef.current?.querySelector(`.card-${idx}`);
    if (!target) return;
    target.style.setProperty("--card-tilt-x", "0deg");
    target.style.setProperty("--card-tilt-y", "0deg");
    target.style.setProperty("--card-tilt-scale", "1");
  };

  useEffect(() => {
    if (!containerRef.current) return;
    
    const q = gsap.utils.selector(containerRef);
    entries.forEach((_, i) => {
      const target = q(`.card-${i}`);
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
      className={`bounceCardsContainer ${className}`}
      ref={containerRef}
      style={{
        position: "relative",
        width: "100%",
        height: "auto",
        aspectRatio: "1.4",
      }}
    >
      {entries.map((item, idx) => (
        <a
          key={item.slug || item.image}
          className={`card card-${idx}`}
          href={item.href || `./project.html?slug=${item.slug}`}
          target="_blank"
          rel="noopener noreferrer"
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
          onMouseMove={(event) => updateCardTilt(event, idx)}
          onMouseLeave={() => {
            resetCardTilt(idx);
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

            const { href, target } = event.currentTarget;
            navigationTimerRef.current = window.setTimeout(() => {
              openCardLink(href, target);
              navigationTimerRef.current = null;
            }, 360);
          }}
        >
          <div className="cardTiltSurface">
            <img className="image" src={item.image} alt={item.title || `card-${idx}`} />
          </div>
        </a>
      ))}
    </div>
  );
}
