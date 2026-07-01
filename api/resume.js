const { json, methodNotAllowed } = require("./_shared/http");
const { getServiceSupabaseClient } = require("./_shared/supabase");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    methodNotAllowed(res);
    return;
  }

  try {
    const supabase = getServiceSupabaseClient();
    const { data, error } = await supabase
      .from("resume_settings")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    if (data?.file_path) {
      const { data: signed, error: signedError } = await supabase.storage
        .from("resumes")
        .createSignedUrl(data.file_path, 60 * 60);
      if (signedError) throw signedError;

      json(res, 200, {
        url: signed.signedUrl,
        displayName: data.display_name || "简历",
      });
      return;
    }

    json(res, 200, {
      url: data?.external_url || "",
      displayName: data?.display_name || "简历",
    });
  } catch (error) {
    json(res, 500, { error: error.message || "resume_failed" });
  }
};
