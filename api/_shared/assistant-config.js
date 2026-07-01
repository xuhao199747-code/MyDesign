const fallbackConfig = {
  assistant: {
    systemPrompt:
      "You are the portfolio owner assistant. Answer clearly and honestly using the configured knowledge base.",
    welcomeMessage:
      "Hi, I can answer questions about my work, projects, and resume.",
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
      answer: "这部分会由后台知识库配置。当前是本地 fallback 内容。",
      sortOrder: 0,
    },
    {
      id: "projects",
      category: "projects",
      enabled: true,
      title: "项目经历",
      questionPatterns: ["有哪些项目", "项目经历", "作品"],
      answer: "我可以介绍作品集里的项目。后台接入后，这里会读取可配置项目内容。",
      sortOrder: 1,
    },
    {
      id: "skills",
      category: "skills",
      enabled: true,
      title: "技能",
      questionPatterns: ["会什么技能", "技能", "擅长"],
      answer: "后台接入后，这里会展示可配置的技能与方向。",
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
