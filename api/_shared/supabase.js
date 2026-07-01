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

function validateBasicAdmin(req) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Basic ")) return null;

  const credentials = Buffer.from(header.slice(6), "base64").toString("utf8");
  const separatorIndex = credentials.indexOf(":");
  if (separatorIndex === -1) return null;

  const username = credentials.slice(0, separatorIndex);
  const password = credentials.slice(separatorIndex + 1);
  const adminUsername = getOptionalEnv("ADMIN_USERNAME") || "admin";
  const adminPassword = getOptionalEnv("ADMIN_PASSWORD") || "123456";

  if (username !== adminUsername || password !== adminPassword) {
    const error = new Error("invalid_admin_credentials");
    error.statusCode = 401;
    throw error;
  }

  return { email: adminUsername, app_metadata: { provider: "basic-admin" } };
}

async function requireAdmin(req) {
  const header = req.headers.authorization || "";
  const basicAdmin = validateBasicAdmin(req);
  if (basicAdmin) return basicAdmin;

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
