import React, { useEffect, useMemo, useState } from "react";
import { fetchAdminConfig, saveAdminConfig } from "./adminApi.js";
import { AdminLayout } from "./AdminLayout.jsx";
import { LoginView } from "./LoginView.jsx";
import { getSupabaseClient } from "./supabaseClient.js";

export function AdminApp() {
  const [session, setSession] = useState(null);
  const [config, setConfig] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    try {
      const supabase = getSupabaseClient();
      supabase.auth.getSession().then(({ data }) => {
        setSession(data.session || null);
      });

      const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
        setSession(nextSession);
      });

      return () => data.subscription.unsubscribe();
    } catch (nextError) {
      setError(nextError.message);
      return undefined;
    }
  }, []);

  useEffect(() => {
    if (!session) return;

    fetchAdminConfig(session)
      .then((nextConfig) => {
        setConfig(nextConfig);
        setError("");
      })
      .catch((nextError) => setError(nextError.message));
  }, [session]);

  const hasEnvError = useMemo(
    () => error.includes("VITE_SUPABASE_URL") || error.includes("VITE_SUPABASE_ANON_KEY"),
    [error]
  );

  const handleSave = async () => {
    if (!session || !config) return;
    setSaving(true);
    setError("");
    try {
      const nextConfig = await saveAdminConfig(session, config);
      setConfig(nextConfig);
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setSaving(false);
    }
  };

  if (!session) {
    return (
      <LoginView
        envError={hasEnvError ? error : ""}
        error={hasEnvError ? "" : error}
        onError={setError}
        onSignedIn={setSession}
      />
    );
  }

  return (
    <AdminLayout
      config={config}
      error={error}
      saving={saving}
      session={session}
      onConfigChange={setConfig}
      onSave={handleSave}
      onSignOut={async () => {
        await getSupabaseClient().auth.signOut();
        setSession(null);
        setConfig(null);
      }}
    />
  );
}
