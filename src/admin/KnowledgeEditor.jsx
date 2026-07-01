import React from "react";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function KnowledgeEditor({ items, onChange }) {
  const updateItem = (index, patch) => {
    onChange(
      items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item
      )
    );
  };

  const addItem = () => {
    onChange([
      ...items,
      {
        id: `local-${Date.now()}`,
        category: "general",
        title: "New answer",
        questionPatterns: ["关键词"],
        answer: "",
        enabled: true,
        sortOrder: items.length,
      },
    ]);
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold">知识库</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            命中这些关键词时直接使用配置答案，不消耗 DeepSeek 调用次数。
          </p>
        </div>
        <Button type="button" size="sm" onClick={addItem}>
          <Plus />
          Add
        </Button>
      </div>
      <div className="space-y-3">
        {items.map((item, index) => (
          <Card key={item.id || index}>
            <CardHeader className="flex-row items-start justify-between gap-4">
              <div className="space-y-1">
                <CardTitle>{item.title || `条目 ${index + 1}`}</CardTitle>
                <CardDescription>
                  {(item.questionPatterns || []).length || 0} 个匹配关键词
                </CardDescription>
              </div>
              <Badge variant={item.enabled !== false ? "secondary" : "outline"}>
                {item.enabled !== false ? "Enabled" : "Disabled"}
              </Badge>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <div className="grid gap-3 md:grid-cols-2">
                  <Field>
                    <FieldLabel>标题</FieldLabel>
                    <Input
                      value={item.title || ""}
                      onChange={(event) =>
                        updateItem(index, { title: event.target.value })
                      }
                    />
                  </Field>
                  <Field>
                    <FieldLabel>匹配关键词</FieldLabel>
                    <Input
                      placeholder="用逗号分隔"
                      value={(item.questionPatterns || []).join(", ")}
                      onChange={(event) =>
                        updateItem(index, {
                          questionPatterns: event.target.value
                            .split(",")
                            .map((value) => value.trim())
                            .filter(Boolean),
                        })
                      }
                    />
                  </Field>
                </div>
                <Field>
                  <FieldLabel>回答内容</FieldLabel>
                  <Textarea
                    className="min-h-28"
                    value={item.answer || ""}
                    onChange={(event) =>
                      updateItem(index, { answer: event.target.value })
                    }
                  />
                </Field>
                <Field orientation="horizontal">
                  <Checkbox
                    id={`knowledge-enabled-${item.id || index}`}
                    checked={item.enabled !== false}
                    onCheckedChange={(checked) =>
                      updateItem(index, { enabled: checked === true })
                    }
                  />
                  <FieldContent>
                    <FieldLabel htmlFor={`knowledge-enabled-${item.id || index}`}>
                      Enabled
                    </FieldLabel>
                    <FieldDescription>
                      关闭后这条知识不会参与对话命中。
                    </FieldDescription>
                  </FieldContent>
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
