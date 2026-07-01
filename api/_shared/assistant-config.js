const fallbackConfig = {
  assistant: {
    systemPrompt:
      "你是“徐浩 Agent”，是徐浩个人作品集网站里的中文 AI 助手。帮助访客了解徐浩的产品与设计经历、作品项目、技能方向和简历信息。不要说自己是投资组合拥有者助手。",
    welcomeMessage:
      "你好，我是徐浩 Agent，可以回答关于徐浩的经历、作品项目、技能和简历的问题。",
    apiLimitPerVisitor: 20,
    enabled: true,
  },
  resume: {
    filePath: "",
    externalUrl: "",
    url: "",
    displayName: "简历",
  },
  knowledgeItems: [
    {
      id: "work",
      category: "work",
      enabled: true,
      title: "工作经历",
      questionPatterns: ["你做过什么工作", "工作经历", "经历"],
      answer: "徐浩从事产品和设计工作，专注于设计和构建数字产品、品牌和体验。他的作品集重点展示界面设计、交互体验、视觉表达、前端实现和 AI/Vibe Coding 方向的探索。",
      sortOrder: 0,
    },
    {
      id: "projects",
      category: "projects",
      enabled: true,
      title: "项目经历",
      questionPatterns: ["有哪些项目", "项目经历", "作品"],
      answer: "作品集里主要有 Profile、Sneakers、About、Portrait 等设计项目，也有 Vibe Coding 相关作品，例如组件库、猪猪黄昏、LODING、BRAIN UI、SNEAKERS 等。",
      sortOrder: 1,
    },
    {
      id: "skills",
      category: "skills",
      enabled: true,
      title: "技能",
      questionPatterns: ["会什么技能", "技能", "擅长"],
      answer: "徐浩的能力集中在产品与视觉设计、界面结构、交互动效、品牌表达、前端页面实现，以及使用 AI/Vibe Coding 快速构建设计原型和网页体验。",
      sortOrder: 2,
    },
  ],
  usage: {
    visitors: 0,
    totalCalls: 0,
    limit: 20,
  },
};

function mapAssistant(row) {
  return {
    systemPrompt: row?.system_prompt || fallbackConfig.assistant.systemPrompt,
    welcomeMessage:
      row?.welcome_message || fallbackConfig.assistant.welcomeMessage,
    apiLimitPerVisitor:
      row?.api_limit_per_visitor ||
      fallbackConfig.assistant.apiLimitPerVisitor,
    enabled: row?.enabled !== false,
  };
}

function mapKnowledgeItem(row) {
  return {
    id: row.id,
    category: row.category,
    title: row.title,
    questionPatterns: row.question_patterns || [],
    answer: row.answer,
    enabled: row.enabled !== false,
    sortOrder: row.sort_order || 0,
  };
}

function mapResume(row) {
  return {
    filePath: row?.file_path || "",
    externalUrl: row?.external_url || "",
    url: row?.external_url || "",
    displayName: row?.display_name || "简历",
  };
}

async function readAssistantConfig(supabase) {
  const [assistantResult, knowledgeResult, resumeResult, usageResult] =
    await Promise.all([
      supabase
        .from("assistant_config")
        .select("*")
        .eq("enabled", true)
        .limit(1)
        .maybeSingle(),
      supabase
        .from("knowledge_items")
        .select("*")
        .eq("enabled", true)
        .order("sort_order", { ascending: true }),
      supabase.from("resume_settings").select("*").limit(1).maybeSingle(),
      supabase.from("visitor_usage").select("api_call_count"),
    ]);

  if (assistantResult.error) throw assistantResult.error;
  if (knowledgeResult.error) throw knowledgeResult.error;
  if (resumeResult.error) throw resumeResult.error;
  if (usageResult.error) throw usageResult.error;

  const totalCalls = (usageResult.data || []).reduce(
    (sum, item) => sum + (item.api_call_count || 0),
    0
  );

  return {
    assistant: mapAssistant(assistantResult.data),
    knowledgeItems: (knowledgeResult.data || []).map(mapKnowledgeItem),
    resume: mapResume(resumeResult.data),
    usage: {
      visitors: usageResult.data?.length || 0,
      totalCalls,
      limit:
        assistantResult.data?.api_limit_per_visitor ||
        fallbackConfig.assistant.apiLimitPerVisitor,
    },
  };
}

module.exports = {
  fallbackConfig,
  mapAssistant,
  mapKnowledgeItem,
  mapResume,
  readAssistantConfig,
};
