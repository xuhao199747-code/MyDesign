const normalize = (value) => String(value || "").trim().toLowerCase();

const resumeKeywords = ["简历", "resume", "cv", "下载"];

export function detectResumeIntent(message) {
  const normalized = normalize(message);
  return resumeKeywords.some((keyword) => normalized.includes(keyword));
}

export function findKnowledgeMatch(message, config) {
  const normalized = normalize(message);
  const items = Array.isArray(config?.knowledgeItems)
    ? config.knowledgeItems
    : [];

  return (
    items.find((item) => {
      if (item.enabled === false) return false;
      if (!Array.isArray(item.questionPatterns)) return false;

      return item.questionPatterns.some((pattern) =>
        normalized.includes(normalize(pattern))
      );
    }) || null
  );
}
