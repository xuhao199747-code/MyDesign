import React, { useState } from "react";
import { getSupabaseClient } from "./supabaseClient.js";

export function ResumeEditor({ resume, onChange }) {
  const [fileName, setFileName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    setFileName(file?.name || "");
    setUploadError("");
    if (!file) return;

    if (file.type !== "application/pdf") {
      setUploadError("请选择 PDF 文件。");
      return;
    }

    setUploading(true);
    try {
      const safeName = file.name
        .toLowerCase()
        .replace(/[^a-z0-9._-]+/g, "-")
        .replace(/^-+|-+$/g, "");
      const path = `resume/${Date.now()}-${safeName || "resume.pdf"}`;
      const { error } = await getSupabaseClient().storage
        .from("resumes")
        .upload(path, file, {
          contentType: "application/pdf",
          upsert: true,
        });

      if (error) throw error;

      onChange({
        ...resume,
        filePath: path,
        displayName: resume.displayName || file.name,
      });
    } catch (error) {
      setUploadError(error.message || "简历上传失败。");
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">简历配置</h2>
      <label className="block space-y-1 text-sm">
        <span className="text-white/55">显示名称</span>
        <input
          className="w-full rounded-md border border-white/10 bg-neutral-900 px-3 py-2 text-white outline-none"
          value={resume.displayName || ""}
          onChange={(event) =>
            onChange({ ...resume, displayName: event.target.value })
          }
        />
      </label>
      <label className="block space-y-1 text-sm">
        <span className="text-white/55">外链地址</span>
        <input
          className="w-full rounded-md border border-white/10 bg-neutral-900 px-3 py-2 text-white outline-none"
          placeholder="https://..."
          value={resume.externalUrl || ""}
          onChange={(event) =>
            onChange({ ...resume, externalUrl: event.target.value })
          }
        />
      </label>
      <label className="block space-y-1 text-sm">
        <span className="text-white/55">PDF 文件路径</span>
        <input
          className="w-full rounded-md border border-white/10 bg-neutral-900 px-3 py-2 text-white outline-none"
          placeholder="resume/xuhao.pdf"
          value={resume.filePath || ""}
          onChange={(event) =>
            onChange({ ...resume, filePath: event.target.value })
          }
        />
      </label>
      <label className="block space-y-1 text-sm">
        <span className="text-white/55">上传 PDF 到 Supabase Storage</span>
        <input
          accept="application/pdf"
          className="w-full rounded-md border border-white/10 bg-neutral-900 px-3 py-2 text-white outline-none"
          disabled={uploading}
          type="file"
          onChange={handleFileChange}
        />
      </label>
      {fileName ? (
        <p className="text-sm text-white/55">
          {uploading ? "Uploading" : "Selected"}: {fileName}
        </p>
      ) : null}
      {uploadError ? (
        <p className="rounded-md border border-red-300/20 bg-red-300/10 p-3 text-sm leading-6 text-red-100">
          {uploadError}
        </p>
      ) : null}
    </section>
  );
}
