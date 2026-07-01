import React, { useEffect, useState } from "react";
import { fetchAdminConfig, saveAdminConfig } from "./adminApi.js";
import { AdminLayout } from "./AdminLayout.jsx";
import { LoginView } from "./LoginView.jsx";
import { getSupabaseClient } from "./supabaseClient.js";

const previewConfig = {
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
