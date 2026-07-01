const STORAGE_KEY = "portfolio-assistant-visitor-id";

export function getVisitorId() {
  const existing = window.localStorage.getItem(STORAGE_KEY);
  if (existing) return existing;

  const id =
    window.crypto?.randomUUID?.() ||
    `visitor-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  window.localStorage.setItem(STORAGE_KEY, id);
  return id;
}
