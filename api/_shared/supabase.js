const { createClient } = require("@supabase/supabase-js");
const { getOptionalEnv, getRequiredEnv } = require("./env");

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

  const allowedEmails = getOptionalEnv("ADMIN_EMAILS")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  if (
    allowedEmails.length > 0 &&
    !allowedEmails.includes(String(data.user.email || "").toLowerCase())
  ) {
    const forbiddenError = new Error("admin_email_not_allowed");
    forbiddenError.statusCode = 403;
    throw forbiddenError;
  }

  return data.user;
}

module.exports = {
  getServiceSupabaseClient,
  requireAdmin,
};
