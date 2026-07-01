import React from "react";
import { getSupabaseClient } from "./supabaseClient.js";

export function LoginView({ envError, error, onError, onSignedIn }) {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    onError("");

    try {
      const { data, error: authError } =
        await getSupabaseClient().auth.signInWithPassword({
          email,
          password,
        });

      if (authError) throw authError;
      onSignedIn(data.session);
    } catch (nextError) {
      onError(nextError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center px-6">
      <form
        className="w-full max-w-sm rounded-lg border border-white/10 bg-white/[0.04] p-6"
        onSubmit={handleSubmit}
      >
        <p className="text-xs uppercase tracking-[0.24em] text-white/45">
          Admin
        </p>
        <h1 className="mt-3 text-2xl font-semibold">Assistant Config</h1>
        <p className="mt-2 text-sm leading-6 text-white/60">
          使用 Supabase 邮箱密码登录管理对话配置。
        </p>
        {envError ? (
          <p className="mt-4 rounded-md border border-amber-300/20 bg-amber-300/10 p-3 text-sm leading-6 text-amber-100">
            {envError}
          </p>
        ) : null}
        {error ? (
          <p className="mt-4 rounded-md border border-red-300/20 bg-red-300/10 p-3 text-sm leading-6 text-red-100">
            {error}
          </p>
        ) : null}
        <label className="mt-6 block space-y-1 text-sm">
          <span className="text-white/55">Email</span>
          <input
            className="w-full rounded-md border border-white/10 bg-neutral-900 px-3 py-2 text-white outline-none"
            disabled={Boolean(envError) || loading}
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label className="mt-3 block space-y-1 text-sm">
          <span className="text-white/55">Password</span>
          <input
            className="w-full rounded-md border border-white/10 bg-neutral-900 px-3 py-2 text-white outline-none"
            disabled={Boolean(envError) || loading}
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <button
          type="button"
          className="mt-6 hidden w-full rounded-md bg-white px-4 py-2 text-sm font-medium text-neutral-950"
          onClick={() => onSignedIn({ user: { email: "local-preview" } })}
        >
          Preview dashboard
        </button>
        <button
          className="mt-6 w-full rounded-md bg-white px-4 py-2 text-sm font-medium text-neutral-950 disabled:opacity-40"
          disabled={Boolean(envError) || loading || !email || !password}
          type="submit"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </main>
  );
}
