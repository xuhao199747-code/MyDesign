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

export async function uploadResumeFile(session, file) {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  const response = await fetch("/api/resume-upload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fileName: file.name,
      contentType: file.type || "application/pdf",
      base64: window.btoa(binary),
    }),
  });

  return parseResponse(response);
}
