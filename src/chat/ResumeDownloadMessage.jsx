import React from "react";

export function ResumeDownloadMessage({ resume }) {
  if (!resume?.url) {
    return (
      <p className="text-sm leading-6 text-neutral-700">
        简历暂时还没有配置下载地址。
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm leading-6 text-neutral-700">
        可以，下面是我的简历下载入口。
      </p>
      <a
        className="inline-flex rounded-md bg-neutral-950 px-3 py-2 text-sm font-medium text-white"
        href={resume.url}
        target="_blank"
        rel="noreferrer"
      >
        下载{resume.displayName || "简历"}
      </a>
    </div>
  );
}
