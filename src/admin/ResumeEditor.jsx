import React, { useState } from "react";

export function ResumeEditor({ resume, onChange }) {
  const [fileName, setFileName] = useState("");

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
          placeholder="resumes/xuhao.pdf"
          value={resume.filePath || ""}
          onChange={(event) =>
            onChange({ ...resume, filePath: event.target.value })
          }
        />
      </label>
      <label className="block space-y-1 text-sm">
        <span className="text-white/55">选择 PDF 后会在 Supabase 接入阶段上传</span>
        <input
          accept="application/pdf"
          className="w-full rounded-md border border-white/10 bg-neutral-900 px-3 py-2 text-white outline-none"
          type="file"
          onChange={(event) => {
            const file = event.target.files?.[0];
            setFileName(file?.name || "");
          }}
        />
      </label>
      {fileName ? <p className="text-sm text-white/55">Selected: {fileName}</p> : null}
    </section>
  );
}
