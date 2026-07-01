const { readAssistantConfig } = require("./_shared/assistant-config");
const { json, methodNotAllowed } = require("./_shared/http");
const {
  getServiceSupabaseClient,
  requireAdmin,
} = require("./_shared/supabase");

async function replaceKnowledgeItems(supabase, items) {
  await supabase.from("knowledge_items").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  if (!items.length) return;

  const rows = items.map((item, index) => ({
    category: item.category || "general",
    title: item.title || "Untitled",
    question_patterns: item.questionPatterns || [],
    answer: item.answer || "",
    enabled: item.enabled !== false,
    sort_order: item.sortOrder ?? index,
  }));

  const { error } = await supabase.from("knowledge_items").insert(rows);
  if (error) throw error;
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "PUT") {
    methodNotAllowed(res);
    return;
  }

  try {
    await requireAdmin(req);
    const supabase = getServiceSupabaseClient();

    if (req.method === "GET") {
      const config = await readAssistantConfig(supabase);
      json(res, 200, config);
      return;
    }

    const payload = req.body || {};
    const assistant = payload.assistant || {};
    const resume = payload.resume || {};
    const knowledgeItems = Array.isArray(payload.knowledgeItems)
      ? payload.knowledgeItems
      : [];

    const { error: assistantError } = await supabase
      .from("assistant_config")
      .upsert(
        {
          id: "00000000-0000-0000-0000-000000000001",
          system_prompt: assistant.systemPrompt || "",
          welcome_message: assistant.welcomeMessage || "",
          api_limit_per_visitor: assistant.apiLimitPerVisitor || 20,
          enabled: assistant.enabled !== false,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );
    if (assistantError) throw assistantError;

    const { error: resumeError } = await supabase
      .from("resume_settings")
      .upsert(
        {
          id: "00000000-0000-0000-0000-000000000001",
          file_path: resume.filePath || "",
          external_url: resume.externalUrl || resume.url || "",
          display_name: resume.displayName || "简历",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );
    if (resumeError) throw resumeError;

    await replaceKnowledgeItems(supabase, knowledgeItems);

    const nextConfig = await readAssistantConfig(supabase);
    json(res, 200, nextConfig);
  } catch (error) {
    json(res, error.statusCode || 500, {
      error: error.message || "admin_config_failed",
    });
  }
};
