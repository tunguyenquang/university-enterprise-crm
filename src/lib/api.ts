// ==========================================
// API CLIENT - gọi REST API tập trung
// ==========================================
// Gom việc gắn token, parse JSON và ném lỗi có thông báo về một nơi,
// giúp các component không phải lặp lại boilerplate fetch.

function authHeaders(token: string | null, extra: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = { ...extra };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function parse(res: Response): Promise<any> {
  const text = await res.text();
  let body: any = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!res.ok) {
    const message = (body && body.message) || `Lỗi ${res.status}`;
    throw new Error(message);
  }
  return body;
}

export const api = {
  get: (path: string, token: string | null) =>
    fetch(path, { headers: authHeaders(token) }).then(parse),

  post: (path: string, body: unknown, token: string | null) =>
    fetch(path, {
      method: "POST",
      headers: authHeaders(token, { "Content-Type": "application/json" }),
      body: JSON.stringify(body),
    }).then(parse),

  put: (path: string, body: unknown, token: string | null) =>
    fetch(path, {
      method: "PUT",
      headers: authHeaders(token, { "Content-Type": "application/json" }),
      body: JSON.stringify(body),
    }).then(parse),

  del: (path: string, token: string | null) =>
    fetch(path, { method: "DELETE", headers: authHeaders(token) }).then(parse),

  // Upload file qua multipart/form-data (không set Content-Type để trình duyệt tự thêm boundary).
  upload: (path: string, file: File, token: string | null) => {
    const formData = new FormData();
    formData.append("file", file);
    return fetch(path, { method: "POST", headers: authHeaders(token), body: formData }).then(parse);
  },
};
