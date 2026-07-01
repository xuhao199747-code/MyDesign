import React from "react";

export function UsageView({ usage }) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">调用统计</h2>
      <div className="grid gap-3 md:grid-cols-3">
        <article className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
          <p className="text-sm text-white/55">访客数</p>
          <p className="mt-2 text-2xl font-semibold">{usage.visitors || 0}</p>
        </article>
        <article className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
          <p className="text-sm text-white/55">DeepSeek 调用</p>
          <p className="mt-2 text-2xl font-semibold">{usage.totalCalls || 0}</p>
        </article>
        <article className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
          <p className="text-sm text-white/55">默认上限</p>
          <p className="mt-2 text-2xl font-semibold">{usage.limit || 20}</p>
        </article>
      </div>
    </section>
  );
}
