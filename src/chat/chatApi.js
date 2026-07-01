export const fallbackPublicConfig = {
  assistant: {
    welcomeMessage:
      "你好，我是徐浩 Agent，可以回答关于徐浩的经历、作品项目、技能和简历的问题。",
    apiLimitPerVisitor: 20,
  },
  resume: {
    url: "",
    displayName: "简历",
  },
  knowledgeItems: [
    {
      id: "work",
      enabled: true,
      title: "工作经历",
      questionPatterns: ["你做过什么工作", "工作经历", "经历"],
      answer: "徐浩从事产品和设计工作，专注于设计和构建数字产品、品牌和体验。他的作品集重点展示界面设计、交互体验、视觉表达、前端实现和 AI/Vibe Coding 方向的探索。",
    },
    {
      id: "projects",
      enabled: true,
      title: "项目经历",
      questionPatterns: ["有哪些项目", "项目经历", "作品"],
      answer: "作品集里主要有 Profile、Sneakers、About、Portrait 等设计项目，也有 Vibe Coding 相关作品，例如组件库、猪猪黄昏、LODING、BRAIN UI、SNEAKERS 等。",
    },
    {
      id: "skills",
      enabled: true,
      title: "技能",
      questionPatterns: ["会什么技能", "技能", "擅长"],
      answer: "徐浩的能力集中在产品与视觉设计、界面结构、交互动效、品牌表达、前端页面实现，以及使用 AI/Vibe Coding 快速构建设计原型和网页体验。",
    },
  ],
};

export async function fetchPublicAssistantConfig() {
  try {
    const response = await fetch("/api/public-config");
    if (!response.ok) throw new Error("Failed to load assistant config");
    return await response.json();
  } catch {
    return fallbackPublicConfig;
  }
}

export async function fetchResumeDownload(fallbackResume = {}) {
  try {
    const response = await fetch("/api/resume");
    if (!response.ok) throw new Error("Failed to load resume");
    return await response.json();
  } catch {
    return {
      url: fallbackResume.url || fallbackResume.externalUrl || "",
      displayName: fallbackResume.displayName || "简历",
    };
  }
}

export async function sendChatMessage(payload) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || "chat_request_failed");
    error.data = data;
    throw error;
  }

  return data;
}
