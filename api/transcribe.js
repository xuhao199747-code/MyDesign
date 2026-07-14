const tencentcloud = require("tencentcloud-sdk-nodejs-asr");
const { getOptionalEnv, getRequiredEnv } = require("./_shared/env");
const { json, methodNotAllowed } = require("./_shared/http");

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

function normalizeBase64(value) {
  const rawValue = String(value || "");
  const [, dataUriBody] = rawValue.match(/^data:[^;]+;base64,(.*)$/) || [];
  return dataUriBody || rawValue;
}

function resolveVoiceFormat(mimeType) {
  const normalized = String(mimeType || "").toLowerCase();
  if (normalized.includes("ogg")) return "ogg-opus";
  if (normalized.includes("mpeg") || normalized.includes("mp3")) return "mp3";
  if (normalized.includes("wav")) return "wav";
  if (normalized.includes("mp4") || normalized.includes("m4a")) return "m4a";
  return "ogg-opus";
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    methodNotAllowed(res);
    return;
  }

  try {
    const body = parseBody(req);
    const audioBase64 = normalizeBase64(body.audioBase64);
    const audioBuffer = Buffer.from(audioBase64, "base64");

    if (!audioBase64 || audioBuffer.length === 0) {
      json(res, 400, { error: "missing_audio" });
      return;
    }

    const voiceFormat = resolveVoiceFormat(body.mimeType);
    console.info("[transcribe] request", {
      bytes: audioBuffer.length,
      mimeType: body.mimeType || "",
      voiceFormat,
    });

    const Client = tencentcloud.asr.v20190614.Client;
    const client = new Client({
      credential: {
        secretId: getRequiredEnv("TENCENTCLOUD_SECRET_ID"),
        secretKey: getRequiredEnv("TENCENTCLOUD_SECRET_KEY"),
      },
      region: getOptionalEnv("TENCENTCLOUD_ASR_REGION") || "ap-shanghai",
      profile: {
        httpProfile: {
          endpoint: "asr.tencentcloudapi.com",
        },
      },
    });

    const result = await client.SentenceRecognition({
      EngSerViceType: getOptionalEnv("TENCENTCLOUD_ASR_ENGINE") || "16k_zh",
      SourceType: 1,
      VoiceFormat: voiceFormat,
      Data: audioBase64,
      DataLen: audioBuffer.length,
      FilterDirty: 0,
      FilterModal: 0,
      FilterPunc: 0,
      ConvertNumMode: 1,
    });

    const text = result.Result || "";
    console.info("[transcribe] result", {
      hasText: Boolean(text.trim()),
      textLength: text.length,
      requestId: result.RequestId,
    });

    json(res, 200, { text });
  } catch (error) {
    console.error("[transcribe] failed", {
      code: error.code,
      message: error.message,
      requestId: error.requestId,
    });
    json(res, error.statusCode || 500, {
      error: error.message || "transcription_failed",
    });
  }
};
