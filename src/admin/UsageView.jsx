import React from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const metrics = [
  ["访客数", "visitors", 0],
  ["DeepSeek 调用", "totalCalls", 0],
  ["默认上限", "limit", 20],
];

export function UsageView({ usage }) {
  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold">调用统计</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            知识库命中和简历下载不计入 DeepSeek 调用次数。
          </p>
        </div>
        <Badge variant="outline">Visitor based</Badge>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {metrics.map(([label, key, fallback]) => (
          <Card key={key}>
            <CardHeader>
              <CardDescription>{label}</CardDescription>
              <CardTitle className="text-2xl">{usage[key] || fallback}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
    </section>
  );
}
