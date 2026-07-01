import React from "react";

export function LoginView({ onSignedIn }) {
  return (
    <main className="grid min-h-screen place-items-center px-6">
      <section className="w-full max-w-sm rounded-lg border border-white/10 bg-white/[0.04] p-6">
        <p className="text-xs uppercase tracking-[0.24em] text-white/45">
          Admin
        </p>
        <h1 className="mt-3 text-2xl font-semibold">Assistant Config</h1>
        <p className="mt-2 text-sm leading-6 text-white/60">
          Supabase email login will be connected in the next task.
        </p>
        <button
          type="button"
          className="mt-6 w-full rounded-md bg-white px-4 py-2 text-sm font-medium text-neutral-950"
          onClick={() => onSignedIn({ user: { email: "local-preview" } })}
        >
          Preview dashboard
        </button>
      </section>
    </main>
  );
}
