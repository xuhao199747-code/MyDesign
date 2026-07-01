const { createClient } = require("@supabase/supabase-js");
const { getRequiredEnv } = require("./env");

let serviceClient;

function getServiceSupabaseClient() {
  if (serviceClient) return serviceClient;

  serviceClient = createClient(
    getRequiredEnv("SUPABASE_URL"),
    getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false } }
  );

  return serviceClient;
}

async function requireAdmin(req) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) {
    const error = new Error("missing_bearer_token");
    error.statusCode = 401;
    throw error;
  }

  const supabase = getServiceSupabaseClient();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    const authError = new Error("invalid_session");
    authError.statusCode = 401;
    throw authError;
  }

  return data.user;
}

module.exports = {
  getServiceSupabaseClient,
  requireAdmin,
};
