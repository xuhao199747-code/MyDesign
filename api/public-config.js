const { fallbackConfig, readAssistantConfig } = require("./_shared/assistant-config");
const { json, methodNotAllowed } = require("./_shared/http");
const { getServiceSupabaseClient } = require("./_shared/supabase");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    methodNotAllowed(res);
    return;
  }

  try {
    const supabase = getServiceSupabaseClient();
    const config = await readAssistantConfig(supabase);
    json(res, 200, config);
  } catch {
    json(res, 200, fallbackConfig);
  }
};
