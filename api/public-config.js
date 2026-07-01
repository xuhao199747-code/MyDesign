const { json, methodNotAllowed } = require("./_shared/http");

const fallbackConfig = {
  assistant: {
    welcomeMessage:
      "Hi, I can answer questions about my work, projects, and resume.",
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

module.exports = function handler(req, res) {
  if (req.method !== "GET") {
    methodNotAllowed(res);
    return;
  }

  json(res, 200, fallbackConfig);
};
