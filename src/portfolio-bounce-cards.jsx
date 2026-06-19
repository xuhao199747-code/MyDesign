import React from "react";
import { createRoot } from "react-dom/client";
import BounceCards from "./BounceCards.jsx";
import { projectCatalog } from "./projectCatalog.js";

const mount = document.getElementById("portfolioBounceCardsRoot");

const cards = [
  projectCatalog.find((item) => item.slug === "profile"),
  projectCatalog.find((item) => item.slug === "sneakers"),
  projectCatalog.find((item) => item.slug === "about"),
  projectCatalog.find((item) => item.slug === "portrait"),
].filter(Boolean);

const transformStyles = [
  "rotate(5deg) translate(-340px)",
  "rotate(-4deg) translate(-115px)",
  "rotate(4deg) translate(115px)",
  "rotate(-5deg) translate(340px)",
];

if (mount) {
  createRoot(mount).render(
    <BounceCards
      className="custom-bounceCards"
      cards={cards}
      containerWidth={700}
      containerHeight={380}
      animationDelay={0.15}
      animationStagger={0.08}
      easeType="elastic.out(1, 0.5)"
      transformStyles={transformStyles}
      enableHover
    />
  );
}
