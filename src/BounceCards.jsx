import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import "./BounceCards.css";

export default function BounceCards({
  className = "",
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
  const [currentTransformStyles, setCurrentTransformStyles] = useState(transformStyles);

  useEffect(() => {
    const updateTransformStyles = () => {
      const isMobile = window.innerWidth <= 768;
      
      if (isMobile) {
        const mobileTransformStyles = [
          "rotate(5deg) translate(-130px)",
          "rotate(0deg) translate(-65px)",
          "rotate(-5deg)",
          "rotate(5deg) translate(65px)",
          "rotate(-5deg) translate(130px)",
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

      let hasAnimated = false;
      const runIntro = () => {
        if (hasAnimated) return;
        hasAnimated = true;
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
        const rect = container.getBoundingClientRect();
        const viewportHeight =
          window.innerHeight || document.documentElement.clientHeight;
        if (rect.top < viewportHeight * 0.82 && rect.bottom > viewportHeight * 0.12) {
          runIntro();
          window.removeEventListener("scroll", checkInView);
          window.removeEventListener("resize", checkInView);
        }
      };

      window.addEventListener("scroll", checkInView, { passive: true });
      window.addEventListener("resize", checkInView);
      window.requestAnimationFrame(checkInView);
      const viewCheckTimer = window.setInterval(checkInView, 180);

      return () => {
        window.removeEventListener("scroll", checkInView);
        window.removeEventListener("resize", checkInView);
        window.clearInterval(viewCheckTimer);
      };
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

    images.forEach((_, i) => {
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

    images.forEach((_, i) => {
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
    images.forEach((_, i) => {
      const target = q(`.card-${i}`);
      if (target) {
        gsap.to(target, {
          transform: `translate(-50%, -50%) ${currentTransformStyles[i] ?? "none"}`,
          duration: 0.3,
          ease: "back.out(1.4)",
        });
      }
    });
  }, [currentTransformStyles, images]);

  const isMobileDevice = typeof window !== 'undefined' && window.innerWidth <= 768;

  return (
    <div
      className={`bounceCardsContainer ${className}`}
      ref={containerRef}
      style={{
        position: "relative",
        width: isMobileDevice ? "100%" : containerWidth,
        height: isMobileDevice ? "auto" : containerHeight,
        aspectRatio: isMobileDevice ? "1.6" : undefined,
        marginTop: isMobileDevice ? "1rem" : undefined,
        marginBottom: isMobileDevice ? "0.5rem" : undefined,
      }}
    >
      {images.map((src, idx) => (
        <div
          key={src}
          className={`card card-${idx}`}
          style={{
            transform: `translate(-50%, -50%) ${currentTransformStyles[idx] ?? "none"}`,
            top: isMobileDevice ? "45%" : "50%",
          }}
          onMouseEnter={() => pushSiblings(idx)}
          onMouseMove={(event) => updateCardTilt(event, idx)}
          onMouseLeave={() => {
            resetCardTilt(idx);
            resetSiblings();
          }}
        >
          <div className="cardTiltSurface">
            <img className="image" src={src} alt={`card-${idx}`} />
          </div>
        </div>
      ))}
    </div>
  );
}
