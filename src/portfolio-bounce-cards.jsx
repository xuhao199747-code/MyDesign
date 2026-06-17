import React from "react";
import { createRoot } from "react-dom/client";
import BounceCards from "./BounceCards.jsx";

const mount = document.getElementById("portfolioBounceCardsRoot");

const images = [
  "./imag/photo1.png",
  "./imag/portfolio-cards1.webp",
  "./imag/Image2.webp",
  "./imag/photo2.png",
];

const transformStyles = [
  "rotate(5deg) translate(-240px)",
  "rotate(-4deg) translate(-80px)",
  "rotate(4deg) translate(80px)",
  "rotate(-5deg) translate(240px)",
];

if (mount) {
  createRoot(mount).render(
    <BounceCards
      className="custom-bounceCards"
      images={images}
      containerWidth={500}
      containerHeight={250}
      animationDelay={0.15}
      animationStagger={0.08}
      easeType="elastic.out(1, 0.5)"
      transformStyles={transformStyles}
      enableHover
    />
  );
}
