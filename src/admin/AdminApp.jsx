import React, { useState } from "react";
import { AdminLayout } from "./AdminLayout.jsx";
import { LoginView } from "./LoginView.jsx";

export function AdminApp() {
  const [session, setSession] = useState(null);

  if (!session) {
    return <LoginView onSignedIn={setSession} />;
  }

  return <AdminLayout session={session} onSignOut={() => setSession(null)} />;
}
