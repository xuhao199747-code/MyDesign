export const fallbackPublicConfig = {
  assistant: {
    welcomeMessage:
      "你好，我可以回答关于工作经历、项目过程和简历的问题。",
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
      answer: "这部分会由后台知识库配置。当前是本地 fallback 内容。",
    },
    {
      id: "projects",
      enabled: true,
      title: "项目经历",
      questionPatterns: ["有哪些项目", "项目经历", "作品"],
      answer: "我可以介绍作品集里的项目。后台接入后，这里会读取可配置项目内容。",
    },
    {
      id: "skills",
      enabled: true,
      title: "技能",
      questionPatterns: ["会什么技能", "技能", "擅长"],
      answer: "后台接入后，这里会展示可配置的技能与方向。",
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
