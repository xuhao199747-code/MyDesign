import React from "react";

export function PromptEditor({ config, onChange }) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Prompt 设置</h2>
      <label className="block space-y-1 text-sm">
        <span className="text-white/55">欢迎语</span>
        <input
          className="w-full rounded-md border border-white/10 bg-neutral-900 px-3 py-2 text-white outline-none"
          value={config.welcomeMessage || ""}
          onChange={(event) =>
            onChange({ ...config, welcomeMessage: event.target.value })
          }
        />
      </label>
      <label className="block space-y-1 text-sm">
        <span className="text-white/55">系统提示词</span>
        <textarea
          className="min-h-44 w-full rounded-md border border-white/10 bg-neutral-900 px-3 py-2 text-white outline-none"
          value={config.systemPrompt || ""}
          onChange={(event) =>
            onChange({ ...config, systemPrompt: event.target.value })
          }
        />
      </label>
      <label className="block max-w-xs space-y-1 text-sm">
        <span className="text-white/55">每个访客 DeepSeek 调用上限</span>
        <input
          className="w-full rounded-md border border-white/10 bg-neutral-900 px-3 py-2 text-white outline-none"
          min="1"
          type="number"
          value={config.apiLimitPerVisitor || 20}
          onChange={(event) =>
            onChange({
              ...config,
              apiLimitPerVisitor: Number(event.target.value) || 20,
            })
          }
        />
      </label>
    </section>
  );
}
