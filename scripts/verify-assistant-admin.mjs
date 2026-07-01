import assert from "node:assert/strict";
import { createRequire } from "node:module";
import {
  detectResumeIntent,
  findKnowledgeMatch,
} from "../src/chat/knowledgeMatcher.js";
import { fallbackPublicConfig } from "../src/chat/chatApi.js";

const require = createRequire(import.meta.url);

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

function restoreModule(modulePath) {
  delete require.cache[require.resolve(modulePath)];
}

assert.equal(detectResumeIntent("可以下载你的简历吗"), true);
assert.equal(detectResumeIntent("tell me about projects"), false);

const workMatch = findKnowledgeMatch("你做过什么工作", fallbackPublicConfig);
assert.equal(workMatch?.id, "work");
assert.equal(findKnowledgeMatch("完全不匹配的问题", fallbackPublicConfig), null);

const publicConfigHandler = require("../api/public-config.js");
const publicResponse = await invoke(publicConfigHandler, {
  method: "GET",
  headers: {},
});
assert.equal(publicResponse.statusCode, 200);
assert.equal(publicResponse.body.assistant.apiLimitPerVisitor, 20);

const adminConfigHandler = require("../api/admin-config.js");
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

console.log("assistant admin verification passed");
