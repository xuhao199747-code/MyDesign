import React from "react";
import { LoginForm } from "@/components/login-form";

export function LoginView({ envError, error, onError, onSignedIn }) {
  const ADMIN_USERNAME = "admin";
  const ADMIN_PASSWORD = "123456";
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    onError("");

    try {
      if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
        throw new Error("用户名或密码错误。");
      }

      onSignedIn({
        access_token: "",
        localAdmin: true,
        localPreview: true,
        user: { email: ADMIN_USERNAME },
      });
    } catch (nextError) {
      onError(nextError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-background p-6 text-foreground">
      <LoginForm
        className="w-full max-w-sm"
        username={username}
        envError={envError}
        error={error}
        loading={loading}
        password={password}
        onUsernameChange={setUsername}
        onPasswordChange={setPassword}
        onPreview={() =>
          onSignedIn({
            access_token: "",
            localPreview: true,
            user: { email: "local-preview" },
          })
        }
        onSubmit={handleSubmit}
      />
    </main>
  );
}
