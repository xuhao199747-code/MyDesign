const { json, methodNotAllowed } = require("./_shared/http");
const {
  getServiceSupabaseClient,
  requireAdmin,
} = require("./_shared/supabase");

const MAX_RESUME_BYTES = 8 * 1024 * 1024;

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

function sanitizeFileName(fileName) {
  const stem = String(fileName || "resume.pdf")
    .toLowerCase()
    .replace(/\.pdf$/i, "")
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return stem || "resume";
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    methodNotAllowed(res);
    return;
  }

  try {
    await requireAdmin(req);
    const body = parseBody(req);
    const contentType = body.contentType || "application/pdf";
    const base64 = String(body.base64 || "");

    if (contentType !== "application/pdf") {
      json(res, 400, { error: "resume_must_be_pdf" });
      return;
    }

    if (!base64) {
      json(res, 400, { error: "missing_resume_file" });
      return;
    }

    const buffer = Buffer.from(base64, "base64");
    if (!buffer.length || buffer.length > MAX_RESUME_BYTES) {
      json(res, 400, { error: "invalid_resume_size" });
      return;
    }

    const filePath = `resume/${Date.now()}-${sanitizeFileName(body.fileName)}.pdf`;
    const supabase = getServiceSupabaseClient();
    const { error } = await supabase.storage
      .from("resumes")
      .upload(filePath, buffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (error) throw error;

    json(res, 200, {
      filePath,
      displayName: body.fileName || "简历.pdf",
    });
  } catch (error) {
    json(res, error.statusCode || 500, {
      error: error.message || "resume_upload_failed",
    });
  }
};
