import { cn } from "@/lib/index"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export function LoginForm({
  className,
  username,
  envError,
  error,
  loading,
  password,
  onUsernameChange,
  onPasswordChange,
  onPreview,
  onSubmit,
  ...props
}) {
  const isSubmitDisabled = loading || !username || !password;

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Assistant Config</CardTitle>
          <CardDescription>
            使用后台用户名和密码登录管理对话配置。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit}>
            <FieldGroup>
              {envError ? (
                <Field>
                  <FieldDescription>{envError}</FieldDescription>
                </Field>
              ) : null}
              {error ? (
                <Field>
                  <FieldError>{error}</FieldError>
                </Field>
              ) : null}
              <Field>
                <FieldLabel htmlFor="username">Username</FieldLabel>
                <Input
                  autoComplete="username"
                  disabled={loading}
                  id="username"
                  type="text"
                  value={username}
                  onChange={(event) => onUsernameChange(event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  autoComplete="current-password"
                  disabled={loading}
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => onPasswordChange(event.target.value)}
                />
              </Field>
              <Field>
                {envError ? (
                  <Button type="button" variant="outline" onClick={onPreview}>
                    Preview dashboard
                  </Button>
                ) : null}
                <Button disabled={isSubmitDisabled} type="submit">
                  {loading ? "Signing in..." : "Sign in"}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
