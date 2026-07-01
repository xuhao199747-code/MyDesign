import React from "react";

export function KnowledgeEditor({ items, onChange }) {
  const updateItem = (index, patch) => {
    onChange(
      items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item
      )
    );
  };

  const addItem = () => {
    onChange([
      ...items,
      {
        id: `local-${Date.now()}`,
        category: "general",
        title: "New answer",
        questionPatterns: ["关键词"],
        answer: "",
        enabled: true,
        sortOrder: items.length,
      },
    ]);
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">知识库</h2>
        <button
          type="button"
          className="rounded-md bg-white px-3 py-2 text-sm font-medium text-neutral-950"
          onClick={addItem}
        >
          Add
        </button>
      </div>
      <div className="space-y-3">
        {items.map((item, index) => (
          <article
            key={item.id || index}
            className="space-y-3 rounded-lg border border-white/10 bg-white/[0.04] p-4"
          >
            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span className="text-white/55">标题</span>
                <input
                  className="w-full rounded-md border border-white/10 bg-neutral-900 px-3 py-2 text-white outline-none"
                  value={item.title || ""}
                  onChange={(event) =>
                    updateItem(index, { title: event.target.value })
                  }
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-white/55">匹配关键词，用逗号分隔</span>
                <input
                  className="w-full rounded-md border border-white/10 bg-neutral-900 px-3 py-2 text-white outline-none"
                  value={(item.questionPatterns || []).join(", ")}
                  onChange={(event) =>
                    updateItem(index, {
                      questionPatterns: event.target.value
                        .split(",")
                        .map((value) => value.trim())
                        .filter(Boolean),
                    })
                  }
                />
              </label>
            </div>
            <label className="space-y-1 text-sm">
              <span className="text-white/55">回答内容</span>
              <textarea
                className="min-h-28 w-full rounded-md border border-white/10 bg-neutral-900 px-3 py-2 text-white outline-none"
                value={item.answer || ""}
                onChange={(event) =>
                  updateItem(index, { answer: event.target.value })
                }
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-white/70">
              <input
                checked={item.enabled !== false}
                type="checkbox"
                onChange={(event) =>
                  updateItem(index, { enabled: event.target.checked })
                }
              />
              Enabled
            </label>
          </article>
        ))}
      </div>
    </section>
  );
}
