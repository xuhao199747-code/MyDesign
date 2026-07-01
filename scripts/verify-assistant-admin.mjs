import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import {
  detectResumeIntent,
  findKnowledgeMatch,
} from "../src/chat/knowledgeMatcher.js";
import { fallbackPublicConfig } from "../src/chat/chatApi.js";

const require = createRequire(import.meta.url);
const loginViewSource = readFileSync(
  new URL("../src/admin/LoginView.jsx", import.meta.url),
  "utf8"
);
const loginFormSource = readFileSync(
  new URL("../src/components/login-form.jsx", import.meta.url),
  "utf8"
);
const adminDir = new URL("../src/admin/", import.meta.url);
const adminSources = readdirSync(adminDir, { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith(".jsx"))
  .map((entry) => [
    entry.name,
    readFileSync(new URL(entry.name, adminDir), "utf8"),
  ]);
const adminSourceText = adminSources.map(([, source]) => source).join("\n");

function invoke(handler, req) {
  return new Promise((resolve) => {
    const res = {
      statusCode: 200,
      headers: {},
      setHeader(name, value) {
        this.headers[name] = value;
      },
      end(body) {
        resolve({
          statusCode: this.statusCode,
          headers: this.headers,
          body: body ? JSON.parse(body) : null,
        });
      },
    };

    Promise.resolve(handler(req, res)).catch((error) => {
      resolve({ statusCode: 500, body: { error: error.message } });
    });
  });
}

function loadChatWithMocks({ used = 0, limit = 20 } = {}) {
  const chatPath = require.resolve("../api/chat.js");
  const supabasePath = require.resolve("../api/_shared/supabase.js");
  const configPath = require.resolve("../api/_shared/assistant-config.js");

  process.env.SUPABASE_URL = "https://supabase.test";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role";
  delete require.cache[chatPath];

  require.cache[supabasePath] = {
    exports: {
      getServiceSupabaseClient() {
        return {
          from(table) {
            assert.equal(table, "visitor_usage");
            return {
              select() {
                return this;
              },
              eq() {
                return this;
              },
              async maybeSingle() {
                return {
                  data: { visitor_id: "visitor-test", api_call_count: used },
                  error: null,
                };
              },
              async upsert(row) {
                return {
                  data: row,
                  error: null,
                };
              },
            };
          },
        };
      },
    },
  };

  require.cache[configPath] = {
    exports: {
      async readAssistantConfig() {
        return {
          assistant: {
            systemPrompt: "test prompt",
            apiLimitPerVisitor: limit,
          },
          knowledgeItems: [],
        };
      },
    },
  };

  return require("../api/chat.js");
}

function loadChatWithoutSupabase() {
  const chatPath = require.resolve("../api/chat.js");
  delete require.cache[chatPath];
  return require("../api/chat.js");
}

function restoreModule(modulePath) {
  delete require.cache[require.resolve(modulePath)];
}

assert.equal(detectResumeIntent("可以下载你的简历吗"), true);
assert.equal(detectResumeIntent("tell me about projects"), false);

const workMatch = findKnowledgeMatch("你做过什么工作", fallbackPublicConfig);
assert.equal(workMatch?.id, "work");
assert.equal(findKnowledgeMatch("完全不匹配的问题", fallbackPublicConfig), null);
assert.equal(
  loginViewSource.includes("disabled={Boolean(envError) || loading}"),
  false,
  "login inputs must remain editable when Supabase env is missing"
);
assert.equal(
  loginViewSource.includes("ADMIN_USERNAME") &&
    loginViewSource.includes("admin") &&
    loginViewSource.includes("ADMIN_PASSWORD") &&
    loginViewSource.includes("123456"),
  true,
  "admin login should use fixed username admin and password 123456"
);
assert.equal(
  loginViewSource.includes("adminCredentials") &&
    loginViewSource.includes("window.btoa"),
  true,
  "fixed admin login should create server-recognized admin credentials"
);
assert.equal(
  loginViewSource.includes("signInWithPassword") ||
    loginViewSource.includes("getSupabaseClient"),
  false,
  "admin login view should not call Supabase auth"
);
assert.equal(
  adminSourceText.includes("assistantAdminConfig") &&
    adminSourceText.includes("localStorage.setItem"),
  true,
  "preview mode may still save config to localStorage"
);
assert.equal(
  adminSourceText.includes("setError(\"\")") &&
    adminSourceText.includes("onSignOut"),
  true,
  "admin sign out should clear stale errors before returning to login"
);
assert.equal(
  adminSources.some(
    ([name, source]) => name === "ResumeEditor.jsx" && source.includes("@/components/ui/alert")
  ),
  false,
  "resume editor should avoid Alert border surface in local admin UI"
);
assert.equal(
  adminSources.some(([, source]) => source.includes("ai-elements")),
  false,
  "admin module must not import ai-elements; reserve ai-elements for chat UI only"
);
assert.equal(
  adminSources.some(([, source]) => source.includes("@/components/ui/card")),
  true,
  "admin module should use shadcn Card primitives for panels"
);
assert.equal(
  adminSources.some(([, source]) => source.includes("@/components/ui/sidebar")),
  true,
  "admin module should use shadcn Sidebar primitives for section navigation"
);
assert.equal(
  adminSources.some(([, source]) => source.includes("@/components/ui/badge")),
  true,
  "admin module should use shadcn Badge primitives for statuses"
);
assert.equal(
  loginViewSource.includes("@/components/login-form"),
  true,
  "admin login view should render the shadcn login form block"
);
assert.equal(
  loginFormSource.includes("@/components/ui/field"),
  true,
  "admin login form should use shadcn Field primitives"
);
assert.equal(
  /admin-|(?:bg|text|border)-\[#|border-white|bg-white\/|text-white|neutral-\d/.test(adminSourceText),
  false,
  "admin module should use shadcn semantic tokens instead of custom admin or hardcoded color classes"
);
assert.equal(
  /\[var\(--admin-|data-admin-/.test(adminSourceText),
  false,
  "admin module should not use a parallel admin styling system"
);
assert.equal(
  /<(input|textarea|select|button|label)\b/.test(
    `${adminSourceText}\n${loginFormSource}`
  ),
  false,
  "admin module should use shadcn form primitives instead of raw form controls"
);

const publicConfigHandler = require("../api/public-config.js");
const publicResponse = await invoke(publicConfigHandler, {
  method: "GET",
  headers: {},
});
assert.equal(publicResponse.statusCode, 200);
assert.equal(publicResponse.body.assistant.apiLimitPerVisitor, 20);

const adminConfigHandler = require("../api/admin-config.js");
const adminConfigSource = readFileSync(
  new URL("../api/admin-config.js", import.meta.url),
  "utf8"
);
const supabaseHelperSource = readFileSync(
  new URL("../api/_shared/supabase.js", import.meta.url),
  "utf8"
);
const adminApiSource = readFileSync(
  new URL("../src/admin/adminApi.js", import.meta.url),
  "utf8"
);
assert.equal(
  adminConfigSource.includes("getDeepSeekConfigStatus") &&
    adminConfigSource.includes("providerStatus"),
  true,
  "admin config endpoint should expose DeepSeek environment status without exposing the API key"
);
assert.equal(
  supabaseHelperSource.includes("validateBasicAdmin") &&
    supabaseHelperSource.includes("ADMIN_USERNAME") &&
    supabaseHelperSource.includes("ADMIN_PASSWORD"),
  true,
  "admin API should accept fixed admin credentials without requiring Supabase Auth"
);
assert.equal(
  adminApiSource.includes("Basic ${session.adminCredentials}") &&
    adminApiSource.includes("getAuthorizationHeader"),
  true,
  "admin browser API should send fixed admin credentials to server routes"
);
assert.equal(
  adminSourceText.includes("模型 API 状态") &&
    adminSourceText.includes("DEEPSEEK_API_KEY"),
  true,
  "admin Prompt page should show where to configure the DeepSeek API key"
);
assert.equal(
  adminSourceText.includes("apiKeyConfigured") &&
    adminSourceText.includes("baseUrl") &&
    adminSourceText.includes("model"),
  true,
  "admin Prompt page should display DeepSeek key status, base URL, and model"
);
const adminNoAuth = await invoke(adminConfigHandler, {
  method: "GET",
  headers: {},
});
assert.equal(adminNoAuth.statusCode, 401);
assert.equal(adminNoAuth.body.error, "missing_bearer_token");

const resumeUploadHandler = require("../api/resume-upload.js");
const resumeUploadNoAuth = await invoke(resumeUploadHandler, {
  method: "POST",
  headers: {},
  body: {
    fileName: "resume.pdf",
    contentType: "application/pdf",
    base64: "JVBERi0=",
  },
});
assert.equal(resumeUploadNoAuth.statusCode, 401);
assert.equal(resumeUploadNoAuth.body.error, "missing_bearer_token");

let chatHandler = loadChatWithMocks({ used: 20, limit: 20 });
const limitResponse = await invoke(chatHandler, {
  method: "POST",
  headers: {},
  body: {
    visitorId: "visitor-test",
    messages: [{ role: "user", content: "hello" }],
  },
});
assert.equal(limitResponse.statusCode, 429);
assert.equal(limitResponse.body.error, "limit_reached");
assert.equal(limitResponse.body.limit, 20);
assert.equal(limitResponse.body.used, 20);

restoreModule("../api/chat.js");
restoreModule("../api/_shared/supabase.js");
restoreModule("../api/_shared/assistant-config.js");

const previousEnv = {
  DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
  DEEPSEEK_BASE_URL: process.env.DEEPSEEK_BASE_URL,
  DEEPSEEK_MODEL: process.env.DEEPSEEK_MODEL,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
};
const previousFetch = globalThis.fetch;
process.env.DEEPSEEK_API_KEY = "test-key";
process.env.DEEPSEEK_BASE_URL = "https://deepseek.test";
process.env.DEEPSEEK_MODEL = "deepseek-chat";
delete process.env.SUPABASE_URL;
delete process.env.SUPABASE_SERVICE_ROLE_KEY;
globalThis.fetch = async () => ({
  ok: true,
  async json() {
    return {
      choices: [{ message: { content: "fallback assistant reply" } }],
    };
  },
});

chatHandler = loadChatWithoutSupabase();
const fallbackChatResponse = await invoke(chatHandler, {
  method: "POST",
  headers: {},
  body: {
    visitorId: "local-preview",
    messages: [{ role: "user", content: "hello from local preview" }],
  },
});
assert.equal(fallbackChatResponse.statusCode, 200);
assert.equal(fallbackChatResponse.body.type, "assistant");
assert.equal(fallbackChatResponse.body.text, "fallback assistant reply");
assert.equal(fallbackChatResponse.body.usage.mode, "local-preview");

for (const [key, value] of Object.entries(previousEnv)) {
  if (value === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }
}
globalThis.fetch = previousFetch;
restoreModule("../api/chat.js");

console.log("assistant admin verification passed");
