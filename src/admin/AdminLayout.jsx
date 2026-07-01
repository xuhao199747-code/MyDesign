import React from "react";

const previewSections = ["Knowledge", "Prompt", "Resume", "Usage"];

export function AdminLayout({ session, onSignOut }) {
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
      <section className="mx-auto grid max-w-6xl gap-4 py-6 md:grid-cols-4">
        {previewSections.map((item) => (
          <article
            key={item}
            className="rounded-lg border border-white/10 bg-white/[0.04] p-4"
          >
            <h2 className="text-sm font-semibold">{item}</h2>
            <p className="mt-2 text-sm text-white/55">
              {session.user.email}
            </p>
          </article>
        ))}
      </section>
    </main>
  );
}
