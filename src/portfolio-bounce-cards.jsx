import React from "react";
import BounceCards from "./BounceCards.jsx";
import { mountReactRoot } from "./lib/mount-react-root.js";
import { getSiteConfigSection } from "./lib/site-config.js";
import { getProjectsBySlugs } from "./projectCatalog.js";

const portfolioBounceCardsConfig = getSiteConfigSection("portfolioBounceCards");
const cards = getProjectsBySlugs(portfolioBounceCardsConfig.cardSlugs || []);

export function mountPortfolioBounceCards() {
  const mount = document.getElementById("portfolioBounceCardsRoot");
  return mountReactRoot(
    mount,
    <BounceCards
      className="custom-bounceCards"
      cards={cards}
      animationDelay={portfolioBounceCardsConfig.animationDelay}
      animationStagger={portfolioBounceCardsConfig.animationStagger}
      easeType={portfolioBounceCardsConfig.easeType}
      transformStyles={portfolioBounceCardsConfig.desktopTransformStyles}
      mobileTransformStyles={portfolioBounceCardsConfig.mobileTransformStyles}
      enableHover={portfolioBounceCardsConfig.enableHover !== false}
    />
  );
}
