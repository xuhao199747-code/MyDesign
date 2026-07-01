import React, { useEffect, useState } from "react";
import { fetchAdminConfig, saveAdminConfig } from "./adminApi.js";
import { AdminLayout } from "./AdminLayout.jsx";
import { LoginView } from "./LoginView.jsx";
import { getSupabaseClient } from "./supabaseClient.js";

const previewConfig = {
  assistant: {
    systemPrompt:
      "你是“徐浩 Agent”，是徐浩个人作品集网站里的中文 AI 助手。帮助访客了解徐浩的产品与设计经历、作品项目、技能方向和简历信息。",
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
  providerStatus: {
    deepSeek: {
      apiKeyConfigured: false,
      baseUrl: "https://api.deepseek.com",
      model: "deepseek-chat",
    },
  },
};
const LOCAL_CONFIG_STORAGE_KEY = "assistantAdminConfig";

function readLocalAdminConfig() {
  try {
    const storedConfig = window.localStorage.getItem(LOCAL_CONFIG_STORAGE_KEY);
    return storedConfig ? JSON.parse(storedConfig) : previewConfig;
  } catch {
    return previewConfig;
  }
}

function writeLocalAdminConfig(config) {
  window.localStorage.setItem(LOCAL_CONFIG_STORAGE_KEY, JSON.stringify(config));
}

export function AdminApp() {
  const [session, setSession] = useState(null);
  const [config, setConfig] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!session) return;
    if (session.localAdmin) {
      setConfig(readLocalAdminConfig());
      setError("当前是本地后台模式，配置会保存到这个浏览器。");
      return;
    }

    fetchAdminConfig(session)
      .then((nextConfig) => {
        setConfig(nextConfig);
        setError("");
      })
      .catch((nextError) => setError(nextError.message));
  }, [session]);

  const handleSave = async () => {
    if (!session || !config) return;
    if (session.localAdmin) {
      writeLocalAdminConfig(config);
      setError("已保存到本地浏览器。");
      return;
    }

    if (session.localPreview) {
      setError("当前是本地预览模式，配置不会保存到 Supabase。");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const nextConfig = await saveAdminConfig(session, config);
      setConfig(nextConfig);
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setSaving(false);
    }
  };

  if (!session) {
    return (
      <LoginView
        envError=""
        error={error}
        onError={setError}
        onSignedIn={setSession}
      />
    );
  }

  return (
    <AdminLayout
      config={config}
      error={error}
      saving={saving}
      session={session}
      onConfigChange={setConfig}
      onSave={handleSave}
      onSignOut={async () => {
        if (!session.localAdmin && !session.adminCredentials) {
          await getSupabaseClient().auth.signOut();
        }
        setError("");
        setSession(null);
        setConfig(null);
      }}
    />
  );
}
