import React, { useState } from "react";
import { UploadCloud } from "lucide-react";
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
import { uploadResumeFile } from "./adminApi.js";

export function ResumeEditor({ resume, session, onChange }) {
  const [fileName, setFileName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    setFileName(file?.name || "");
    setUploadError("");
    if (!file) return;

    if (session.localAdmin || session.localPreview) {
      setUploadError("本地后台不能上传文件，请填写外链地址或 PDF 文件路径。");
      return;
    }

    if (file.type !== "application/pdf") {
      setUploadError("请选择 PDF 文件。");
      return;
    }

    setUploading(true);
    try {
      const result = await uploadResumeFile(session, file);

      onChange({
        ...resume,
        filePath: result.filePath,
        displayName: resume.displayName || file.name,
      });
    } catch (error) {
      setUploadError(error.message || "简历上传失败。");
    } finally {
      setUploading(false);
    }
  };
  const hasDownloadTarget = Boolean(
    resume.filePath || resume.externalUrl || resume.url
  );

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">简历配置</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          配置访客在对话中索取简历时拿到的文件或外链。
        </p>
      </div>
      <Card>
        <CardHeader className="flex-row items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle>下载来源</CardTitle>
            <CardDescription>优先使用上传 PDF，也可以保留外链。</CardDescription>
          </div>
          <Badge variant={hasDownloadTarget ? "secondary" : "outline"}>
            {hasDownloadTarget ? "Ready" : "Not set"}
          </Badge>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel>显示名称</FieldLabel>
              <Input
                value={resume.displayName || ""}
                onChange={(event) =>
                  onChange({ ...resume, displayName: event.target.value })
                }
              />
            </Field>
            <Field>
              <FieldLabel>外链地址</FieldLabel>
              <Input
                placeholder="https://..."
                value={resume.externalUrl || ""}
                onChange={(event) =>
                  onChange({ ...resume, externalUrl: event.target.value })
                }
              />
            </Field>
            <Field>
              <FieldLabel>PDF 文件路径</FieldLabel>
              <Input
                placeholder="resume/xuhao.pdf"
                value={resume.filePath || ""}
                onChange={(event) =>
                  onChange({ ...resume, filePath: event.target.value })
                }
              />
            </Field>
          <Field>
            <FieldLabel>上传 PDF 到 Supabase Storage</FieldLabel>
            {(session.localAdmin || session.localPreview) ? (
              <FieldDescription>
                本地后台不能上传文件，请填写外链地址或 PDF 文件路径。
              </FieldDescription>
            ) : null}
            <Input
              accept="application/pdf"
              disabled={uploading || session.localAdmin || session.localPreview}
              type="file"
              onChange={handleFileChange}
            />
            </Field>
            {fileName ? (
              <FieldDescription>
                <UploadCloud className="mr-2 inline size-4" />
                {uploading ? "Uploading" : "Selected"}: {fileName}
              </FieldDescription>
          ) : null}
          {uploadError ? (
            <FieldDescription className="text-destructive">
              {uploadError}
            </FieldDescription>
          ) : null}
          </FieldGroup>
        </CardContent>
      </Card>
    </section>
  );
}
