async function parseResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || "request_failed");
    error.data = data;
    throw error;
  }
  return data;
}

export async function fetchAdminConfig(session) {
  const response = await fetch("/api/admin-config", {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  return parseResponse(response);
}

export async function saveAdminConfig(session, payload) {
  const response = await fetch("/api/admin-config", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return parseResponse(response);
}
