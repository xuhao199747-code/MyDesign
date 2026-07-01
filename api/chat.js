const { readAssistantConfig } = require("./_shared/assistant-config");
const { getOptionalEnv, getRequiredEnv } = require("./_shared/env");
const { json, methodNotAllowed } = require("./_shared/http");
const { getServiceSupabaseClient } = require("./_shared/supabase");

function parseBody(req) {
  if (!req.body) return {};
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
}

const normalize = (value) => String(value || "").trim().toLowerCase();

const resumeKeywords = ["简历", "resume", "cv", "下载"];

function detectResumeIntent(message) {
  const normalized = normalize(message);
  return resumeKeywords.some((keyword) => normalized.includes(keyword));
}

function findKnowledgeMatch(message, config) {
  const normalized = normalize(message);
  const items = Array.isArray(config?.knowledgeItems)
    ? config.knowledgeItems
    : [];

  return (
    items.find((item) => {
      if (item.enabled === false) return false;
      if (!Array.isArray(item.questionPatterns)) return false;

      return item.questionPatterns.some((pattern) =>
        normalized.includes(normalize(pattern))
      );
    }) || null
  );
}

function getLatestUserMessage(messages) {
  const userMessages = messages.filter((message) => message.role === "user");
  const latest = userMessages.at(-1);
  return latest?.content || latest?.text || "";
}

function toDeepSeekMessages(messages, config) {
  const knowledgeContext = (config.knowledgeItems || [])
    .filter((item) => item.enabled !== false && item.answer)
    .map((item) => `- ${item.title}: ${item.answer}`)
    .join("\n");

  const systemContent = [
    config.assistant.systemPrompt,
    "Use this configured portfolio knowledge when it is relevant:",
    knowledgeContext || "- No configured knowledge yet.",
    "If the user asks for a resume download, tell them to use the resume button in the chat UI.",
  ].join("\n\n");

  return [
    { role: "system", content: systemContent },
    ...messages
      .filter((message) => message.role === "user" || message.role === "assistant")
      .map((message) => ({
        role: message.role,
        content: message.content || message.text || "",
      }))
      .filter((message) => message.content),
  ];
}

async function readVisitorUsage(supabase, visitorId) {
  const { data, error } = await supabase
    .from("visitor_usage")
    .select("*")
    .eq("visitor_id", visitorId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function incrementVisitorUsage(supabase, visitorId, currentCount) {
  const nextCount = currentCount + 1;
  const { error } = await supabase.from("visitor_usage").upsert(
    {
      visitor_id: visitorId,
      api_call_count: nextCount,
      last_called_at: new Date().toISOString(),
    },
    { onConflict: "visitor_id" }
  );

  if (error) throw error;
  return nextCount;
}

async function callDeepSeek(messages) {
  const baseUrl = getOptionalEnv("DEEPSEEK_BASE_URL") || "https://api.deepseek.com";
  const model = getOptionalEnv("DEEPSEEK_MODEL") || "deepseek-chat";
  const apiKey = getRequiredEnv("DEEPSEEK_API_KEY");

  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error?.message || "deepseek_request_failed");
    error.statusCode = 502;
    throw error;
  }

  return data.choices?.[0]?.message?.content || "";
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    methodNotAllowed(res);
    return;
  }

  try {
    const body = parseBody(req);
    const visitorId = String(body.visitorId || "").trim();
    const messages = Array.isArray(body.messages) ? body.messages : [];

    if (!visitorId) {
      json(res, 400, { error: "missing_visitor_id" });
      return;
    }

    if (!messages.length) {
      json(res, 400, { error: "missing_messages" });
      return;
    }

    const supabase = getServiceSupabaseClient();
    const config = await readAssistantConfig(supabase);
    const latestUserMessage = getLatestUserMessage(messages);

    if (detectResumeIntent(latestUserMessage)) {
      json(res, 200, {
        type: "resume",
        text: "可以，下面是我的简历下载入口。",
        resume: config.resume || null,
      });
      return;
    }

    const knowledgeMatch = findKnowledgeMatch(latestUserMessage, config);
    if (knowledgeMatch) {
      json(res, 200, {
        type: "knowledge",
        text: knowledgeMatch.answer,
        knowledgeItemId: knowledgeMatch.id,
      });
      return;
    }

    const limit = config.assistant.apiLimitPerVisitor || 20;
    const usage = await readVisitorUsage(supabase, visitorId);
    const used = usage?.api_call_count || 0;

    if (used >= limit) {
      json(res, 429, {
        error: "limit_reached",
        limit,
        used,
      });
      return;
    }

    const answer = await callDeepSeek(toDeepSeekMessages(messages, config));
    const nextUsed = await incrementVisitorUsage(supabase, visitorId, used);

    json(res, 200, {
      type: "assistant",
      text: answer,
      usage: {
        limit,
        used: nextUsed,
        remaining: Math.max(0, limit - nextUsed),
      },
    });
  } catch (error) {
    json(res, error.statusCode || 500, {
      error: error.message || "chat_failed",
    });
  }
};
