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
      id: "intro",
      enabled: true,
      title: "身份介绍",
      questionPatterns: ["你是谁", "介绍一下徐浩", "徐浩是做什么的", "个人背景"],
      answer: "徐浩是一名 AI 产品经理，拥有五年产品经验和 UI/UX 设计背景，持有 PMP 证书，本科。当前主要负责 AI 产品体系建设、GEO 平台和智能营销方向，也会使用 IDE、编程类 Agent、Dify 和 HTML/CSS 快速验证产品方案。",
    },
    {
      id: "strengths",
      enabled: true,
      title: "核心能力",
      questionPatterns: ["核心优势", "擅长什么", "产品能力", "有什么优势"],
      answer: "徐浩的核心优势包括：AI 产品落地闭环，以“AI＋业务场景”双视角兼顾 C 端需求与 B 端逻辑，完成场景拆解、模型选型、MVP 和 PE，围绕北极星指标平衡效果、成本与收益；深入客户业务一线，将需求转化为产品规划和行业解决方案；具备 UI/UX 设计背景和良好视觉审美，能够统筹信息架构、交互路径和状态反馈；结合编程 AI 工具及 Dify 快速构建交互 Demo/POC，验证核心流程和商业假设；深度理解 RAG、Multi-Agent、Loop、Graph、MCP 等 AI 技术栈；能够通过数据归因和评测体系持续优化产品效果。",
    },
    {
      id: "skills",
      enabled: true,
      title: "技能与工具",
      questionPatterns: ["技能", "会哪些工具", "技术栈", "会不会 Dify", "AI 技术"],
      answer: "徐浩理解 RAG、LightRAG、混合检索、Rerank、Multi-Agent、Graph、MCP、Skill 和 Memory 等方法，熟悉 Dify、IDE、编程类 Agent、HTML/CSS，并具备 UI/UX、PRD、原型、评测体系和项目交付能力。",
    },
    {
      id: "aliyun",
      enabled: true,
      title: "当前经历：阿里云 MaaS",
      questionPatterns: ["现在在哪里工作", "当前工作", "阿里云", "MaaS", "目前做什么"],
      answer: "2024 年 11 月至今，徐浩在阿里云 MaaS 项目制团队担任 AI 产品经理。主导 AI 底层产品能力建设，搭建多智能体协同架构，整合 RAG、内容生成等核心能力，核心能力复用率超过 80%；负责 GEO 品牌增长平台全流程产品规划，客户品牌 AI 最高提及率达到 95.1%，核心关键词平均排名前 2 位，正向内容覆盖率 100%；深耕旅游获客场景，搭建内容生产、线索承接、智能转化全链路能力及前置风控体系，整体营销人效提升 40%+。",
    },
    {
      id: "saixinghang",
      enabled: true,
      title: "杭州赛兴航经历",
      questionPatterns: ["赛兴航", "上一份工作", "智能客服经历", "业务产品"],
      answer: "2023 年 4 月至 2024 年 11 月，徐浩在杭州赛兴航科技有限公司担任 AI 产品经理，负责酒店、公寓、园区和文旅项目的业务产品建设，主导智能客服从 0 到 1 的调研、定位、规划和交付。",
    },
    {
      id: "early-experience",
      enabled: true,
      title: "阿里企业智能与 UI/UX 经历",
      questionPatterns: ["更早的工作经历", "阿里企业智能", "售前经历", "UIUX 经历", "设计经历"],
      answer: "2021 年 1 月至 2023 年 4 月，徐浩在阿里企业智能项目制团队负责售前与产品，累计参与 10+ 政企重点项目。2019 年 2 月至 2021 年 1 月，他在杭州辰上星辰信息科技有限公司负责网站、小程序、移动端和后台系统的 UI/UX 设计。",
    },
    {
      id: "alpharank",
      enabled: true,
      title: "AlphaRank GEO 平台",
      questionPatterns: ["AlphaRank", "GEO 项目", "品牌 AI 监测", "品牌增长平台"],
      answer: "AlphaRank 是面向品牌方和营销团队的品牌 AI 认知管理与 GEO 增长平台，解决品牌在 AI Search 中表现不可见、问题难定位、检索效果不稳定等问题，构建从数据采集、品牌监测、诊断归因到内容优化和效果复测的产品闭环。徐浩参与平台从 0 到 1 建设，搭建“数据采集与指标层—知识资产层—Agent 编排与工具层—GEO 应用层”架构，参与设计“Leader Agent＋六类专业 Agent”协作体系，使知识库检索准确率由 71.1% 提升至 85%+；通过 Prompt 与 Agent 模板化沉淀 20+ 标准化 Prompt 模板，完成 6 个主流 AI 平台监测能力建设。",
    },
    {
      id: "lai-trip",
      enabled: true,
      title: "Lai Trip 旅游场景自动化营销",
      questionPatterns: ["Lai Trip", "旅游项目", "旅游营销", "旅游 Agent", "自动化营销"],
      answer: "Lai Trip 是面向旅行社、定制游团队与旅游顾问的全链路数字化展业工作台，以 Agent 协同串联“内容生产—商机挖掘—营销转化”，覆盖公域获客、私域沉淀、智能待客及转化出单。徐浩将旅游顾问的隐性销售经验转化为可编排能力，围绕销售阶段定义意图、情绪、槽位和话术，规划 Skill、Memory、MCP 能力分层，并通过工具或知识库校验路线、价格、库存、交通及退改规则；建立“单技能级—流程级—业务级”三级评测链路，约 80% 的核心能力可复用于其他咨询转化及服务型场景。",
    },
    {
      id: "customer-service",
      enabled: true,
      title: "智能客服 AI 应用",
      questionPatterns: ["智能客服", "客服项目", "RAG 项目", "知识库项目", "客服 SaaS"],
      answer: "徐浩主导企业智能客服 SaaS 平台从 0 到 1 搭建，负责智能问答、人工转接、知识运维和数据运营等模块；设计标准化 RAG 知识处理流程，涵盖清洗、切片、Embedding、混合召回与重排，搭建“意图识别—检索生成—业务查询—异常兜底—人工接管”闭环问答工作流；搭建多维度量化评测机制，通过标准题库、分级评分、Bad Case 归因与回归测试持续优化产品。项目问答准确率达到 82%+，AI 承接 60%+ 高频咨询，并支持多行业快速 POC 落地与规模化交付。",
    },
    {
      id: "results",
      enabled: true,
      title: "项目成果与数据",
      questionPatterns: ["项目成果", "做出过什么成绩", "数据成果", "指标", "效果怎么样"],
      answer: "代表性成果包括：AI 产品核心能力复用率超过 80%；客户品牌 AI 最高提及率达到 95.1%，核心关键词平均排名前 2 位，正向内容覆盖率 100%；旅游营销整体人效提升 40%+；AlphaRank 知识库检索准确率由 71.1% 提升至 85%+；完成 6 个主流 AI 平台监测能力建设；智能客服问答准确率达到 82%+，AI 承接 60%+ 高频咨询；Bad Case 首轮根因定位率由约 45% 提升至 80%，多人评审一致性由约 65% 提升至 90%，内容首轮准出率由约 55% 提升至 75%；累计参与落地 10+ 政企重点项目。",
    },
    {
      id: "method",
      enabled: true,
      title: "产品方法与评测体系",
      questionPatterns: ["如何做 AI 产品", "怎么评测 Agent", "评测体系", "质量控制", "产品方法论"],
      answer: "徐浩以“AI＋业务场景”双视角推进产品设计，围绕北极星指标平衡效果、成本与收益，先拆解场景、用户任务和业务目标，再规划模型、知识库、Agent、工具及评测闭环。曾建立“单技能级—流程级—业务级”三级评测链路，通过标准测试集、Bad Case 归因和回归测试贯通模型能力、任务流程与业务结果；也结合 E-E-A-T、100 分制、6 个维度、15 个评分项及 4 档准出规则，统一内容评审标准。",
    },
    {
      id: "portfolio",
      enabled: true,
      title: "作品集与简历",
      questionPatterns: ["作品集", "有哪些作品", "想看作品", "简历", "下载简历"],
      answer: "徐浩的作品集网站展示产品设计、UI/UX、交互体验、前端实现和 AI/Vibe Coding 探索。访客可以继续询问具体项目，也可以点击聊天窗口中的简历下载入口获取简历。",
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
