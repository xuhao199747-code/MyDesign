import React from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

export function PromptEditor({ config, providerStatus, onChange }) {
  const deepSeek = providerStatus?.deepSeek || {};
  const apiKeyConfigured = Boolean(deepSeek.apiKeyConfigured);

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Prompt 设置</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          控制对话开场、系统身份和每个访客可调用 DeepSeek 的次数。
        </p>
      </div>
      <Card>
        <CardHeader className="flex-row items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle>对话行为</CardTitle>
            <CardDescription>这些内容会影响 API 调用时的上下文。</CardDescription>
          </div>
          <Badge variant="secondary">{config.enabled === false ? "Off" : "On"}</Badge>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel>欢迎语</FieldLabel>
              <Input
                value={config.welcomeMessage || ""}
                onChange={(event) =>
                  onChange({ ...config, welcomeMessage: event.target.value })
                }
              />
            </Field>
            <Field>
              <FieldLabel>系统提示词</FieldLabel>
              <FieldDescription>会随 DeepSeek API 调用一起发送。</FieldDescription>
              <Textarea
                className="min-h-44"
                value={config.systemPrompt || ""}
                onChange={(event) =>
                  onChange({ ...config, systemPrompt: event.target.value })
                }
              />
            </Field>
            <Field className="max-w-xs">
              <FieldLabel>每个访客 DeepSeek 调用上限</FieldLabel>
              <Input
                min="1"
                type="number"
                value={config.apiLimitPerVisitor || 20}
                onChange={(event) =>
                  onChange({
                    ...config,
                    apiLimitPerVisitor: Number(event.target.value) || 20,
                  })
                }
              />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle>模型 API 状态</CardTitle>
            <CardDescription>
              API Key 只在服务端环境变量中配置，后台不会显示或保存密钥明文。
            </CardDescription>
          </div>
          <Badge variant={apiKeyConfigured ? "secondary" : "destructive"}>
            {apiKeyConfigured ? "Configured" : "Missing"}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                DEEPSEEK_API_KEY
              </p>
              <p className="text-sm font-medium">
                {apiKeyConfigured ? "已配置" : "未配置"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Base URL</p>
              <p className="break-all text-sm font-medium">
                {deepSeek.baseUrl || "https://api.deepseek.com"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Model</p>
              <p className="break-all text-sm font-medium">
                {deepSeek.model || "deepseek-chat"}
              </p>
            </div>
          </div>
          <Separator />
          <p className="text-sm text-muted-foreground">
            本地测试填在 .env.local；线上部署填在 Vercel Project Settings 的
            Environment Variables。
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
