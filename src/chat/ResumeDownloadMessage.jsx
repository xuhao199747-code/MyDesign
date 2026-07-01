import React from "react";
import { DownloadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ResumeDownloadMessage({ resume }) {
  if (!resume?.url) {
    return (
      <p className="text-sm leading-6 text-muted-foreground">
        简历暂时还没有配置下载地址。
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm leading-6 text-muted-foreground">
        可以，下面是我的简历下载入口。
      </p>
      <Button asChild size="sm">
        <a href={resume.url} target="_blank" rel="noreferrer">
          <DownloadIcon className="size-4" />
          下载{resume.displayName || "简历"}
        </a>
      </Button>
    </div>
  );
}
