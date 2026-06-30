const siteProjectCatalog =
  typeof window !== "undefined" && Array.isArray(window.__siteConfig?.projectCatalog)
    ? window.__siteConfig.projectCatalog
    : null;

const fallbackProjectCatalog = [
  {
    slug: "profile",
    title: "Profile",
    category: "VIBE CODING",
    image: "./imag/photo1.webp",
    summary: "个人展示页与信息架构整理，聚焦视觉表达、身份识别和内容层级。",
    description:
      "这个项目围绕个人主页的视觉呈现展开，重点优化了首屏识别、内容编排和品牌语气，让用户在短时间内理解角色定位与作品方向。",
    tags: ["Brand", "Portfolio", "UI"],
  },
  {
    slug: "sneakers",
    title: "Sneakers",
    category: "MY DESIGN",
    image: "./imag/portfolio-cards1.webp",
    summary: "电商鞋服专题页，强调卡片节奏、醒目标识与产品转化链路。",
    description:
      "Sneakers 项目聚焦产品信息与活动视觉的组合表达，通过高反差主视觉、卡片式陈列和明确的行动路径，提高了浏览效率与转化感知。",
    tags: ["E-commerce", "Campaign", "Visual"],
  },
  {
    slug: "about",
    title: "About",
    category: "MY DESIGN",
    image: "./imag/Image2.webp",
    summary: "关于页与介绍型版面的系统整理，统一语气、图文关系和阅读节奏。",
    description:
      "About 项目主要处理品牌自我介绍和方法论表达，目标是把信息从“堆叠”变成“叙述”，让版面更有结构，也更有可信度。",
    tags: ["Content", "Storytelling", "Layout"],
  },
  {
    slug: "portrait",
    title: "Portrait",
    category: "VIBE CODING",
    image: "./imag/photo2.webp",
    summary: "视觉实验型人物展示页，强调图像裁切、氛围塑造和轻交互反馈。",
    description:
      "Portrait 项目通过人物影像和轻量动效的组合强化氛围表达，在不打断阅读的前提下增加页面记忆点，适合用于品牌或设计展示场景。",
    tags: ["Art Direction", "Motion", "Showcase"],
  },
];

export const projectCatalog = siteProjectCatalog || fallbackProjectCatalog;

const projectCatalogBySlug = new Map(
  projectCatalog.map((item) => [item.slug, item])
);

export function getProjectBySlug(slug) {
  return projectCatalogBySlug.get(slug) || projectCatalog[0];
}

export function getProjectsBySlugs(slugs = []) {
  return slugs
    .map((slug) => projectCatalogBySlug.get(slug))
    .filter(Boolean);
}
