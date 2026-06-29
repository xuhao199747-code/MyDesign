import React from "react";
import BounceCards from "./BounceCards.jsx";
import { getElementById, queryElements } from "./lib/dom-target.js";
import { mountReactRoot } from "./lib/mount-react-root.js";
import { getSiteConfigSection } from "./lib/site-config.js";
import { getProjectsBySlugs } from "./projectCatalog.js";

const portfolioBounceCardsConfig = getSiteConfigSection("portfolioBounceCards");
const cards = getProjectsBySlugs(portfolioBounceCardsConfig.cardSlugs || []);

export function mountPortfolioBounceCards() {
  const mounts = Array.from(
    new Set([
      ...queryElements('[data-section-node="portfolio-bounce-root"]'),
      getElementById("portfolioBounceCardsRoot"),
    ].filter(Boolean))
  );

  return mounts.map((mount) =>
    mountReactRoot(
      mount,
      <BounceCards
        className="custom-bounceCards w-full max-w-none"
        cards={cards}
        animationDelay={portfolioBounceCardsConfig.animationDelay}
        animationStagger={portfolioBounceCardsConfig.animationStagger}
        easeType={portfolioBounceCardsConfig.easeType}
        transformStyles={portfolioBounceCardsConfig.desktopTransformStyles}
        mobileTransformStyles={portfolioBounceCardsConfig.mobileTransformStyles}
        enableHover={portfolioBounceCardsConfig.enableHover !== false}
      />
    )
  );
}
