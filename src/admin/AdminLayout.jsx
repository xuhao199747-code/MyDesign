import React from "react";
import { Suggestions, Suggestion } from "@/components/ai-elements/suggestion";
import { KnowledgeEditor } from "./KnowledgeEditor.jsx";
import { PromptEditor } from "./PromptEditor.jsx";
import { ResumeEditor } from "./ResumeEditor.jsx";
import { UsageView } from "./UsageView.jsx";

const sections = ["Knowledge", "Prompt", "Resume", "Usage"];

export function AdminLayout({
  config,
  error,
  saving,
  session,
  onConfigChange,
  onSave,
  onSignOut,
}) {
  const [activeSection, setActiveSection] = React.useState("Knowledge");

  const updateConfig = (patch) => {
    onConfigChange({ ...config, ...patch });
  };

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-6 text-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between border-b border-white/10 pb-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-white/45">
            Assistant Admin
          </p>
          <h1 className="mt-2 text-2xl font-semibold">配置中心</h1>
        </div>
        <button
          type="button"
          className="rounded-md border border-white/15 px-3 py-2 text-sm text-white/80"
          onClick={onSignOut}
        >
          Sign out
        </button>
      </header>
      <section className="mx-auto max-w-6xl py-6">
        <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <Suggestions>
            {sections.map((section) => (
              <Suggestion
                key={section}
                className={
                  activeSection === section
                    ? "bg-white text-neutral-950"
                    : "border-white/15 bg-transparent text-white"
                }
                suggestion={section}
                onClick={setActiveSection}
              />
            ))}
          </Suggestions>
          <button
            className="rounded-md bg-white px-4 py-2 text-sm font-medium text-neutral-950 disabled:opacity-40"
            disabled={!config || saving}
            type="button"
            onClick={onSave}
          >
            {saving ? "Saving..." : "Save config"}
          </button>
        </div>

        {error ? (
          <p className="mb-4 rounded-md border border-red-300/20 bg-red-300/10 p-3 text-sm leading-6 text-red-100">
            {error}
          </p>
        ) : null}

        {!config ? (
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-6 text-sm text-white/55">
            Loading config for {session.user.email}...
          </div>
        ) : null}

        {config && activeSection === "Knowledge" ? (
          <KnowledgeEditor
            items={config.knowledgeItems || []}
            onChange={(knowledgeItems) => updateConfig({ knowledgeItems })}
          />
        ) : null}
        {config && activeSection === "Prompt" ? (
          <PromptEditor
            config={config.assistant || {}}
            onChange={(assistant) => updateConfig({ assistant })}
          />
        ) : null}
        {config && activeSection === "Resume" ? (
          <ResumeEditor
            resume={config.resume || {}}
            session={session}
            onChange={(resume) => updateConfig({ resume })}
          />
        ) : null}
        {config && activeSection === "Usage" ? (
          <UsageView usage={config.usage || {}} />
        ) : null}
      </section>
    </main>
  );
}
