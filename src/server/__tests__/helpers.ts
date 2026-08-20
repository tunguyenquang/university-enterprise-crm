// ==========================================
// TEST HELPERS - khởi động server cô lập cho integration test
// ==========================================
// Mỗi lần chạy test dùng một thư mục DB tạm riêng (qua DB_DIR) để không đụng db.json thật.

import http from "http";
import os from "os";
import fs from "fs";
import path from "path";

// Thiết lập môi trường test TRƯỚC khi import bất kỳ module nào đọc env/DB.
const TEST_DB_DIR = path.join(
  os.tmpdir(),
  `crm-test-${process.pid}-${Math.floor(process.hrtime()[1] % 1e6)}`
);
process.env.DB_DIR = TEST_DB_DIR;
process.env.UPLOAD_DIR = path.join(TEST_DB_DIR, "uploads");
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret-key-for-integration-tests-1234567890";
process.env.JWT_EXPIRES_IN = "1h";
process.env.BCRYPT_ROUNDS = "4"; // nhanh hơn cho test
process.env.SEED_DEFAULT_PASSWORD = "Password123!";

// Import sau khi đã set env. Dùng dynamic import để đảm bảo thứ tự.
const { app } = await import("../server.ts");

let server: http.Server | null = null;
let baseUrl = "";

export async function startTestServer(): Promise<string> {
  if (server) return baseUrl;
  server = http.createServer(app);
  await new Promise<void>((resolve) => {
    server!.listen(0, "127.0.0.1", () => resolve());
  });
  const addr = server.address();
  const port = typeof addr === "object" && addr ? addr.port : 0;
  baseUrl = `http://127.0.0.1:${port}`;
  return baseUrl;
}

export async function stopTestServer(): Promise<void> {
  if (server) {
    await new Promise<void>((resolve) => server!.close(() => resolve()));
    server = null;
  }
  // Dọn thư mục DB tạm.
  try {
    fs.rmSync(TEST_DB_DIR, { recursive: true, force: true });
  } catch {
    // bỏ qua
  }
}

// Tiện ích gọi API trả về { status, body }.
export async function api(
  method: string,
  pathname: string,
  options: { token?: string; body?: unknown } = {}
): Promise<{ status: number; body: any }> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (options.token) headers.Authorization = `Bearer ${options.token}`;

  const res = await fetch(`${baseUrl}${pathname}`, {
    method,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  let body: any = null;
  const text = await res.text();
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { status: res.status, body };
}

// Đăng nhập tiện lợi, trả về token.
export async function login(email: string, password = "Password123!"): Promise<string> {
  const res = await api("POST", "/api/auth/login", { body: { email, password } });
  if (res.status !== 200) {
    throw new Error(`Login thất bại cho ${email}: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body.token;
}

export const SEED = {
  adminEmail: "admin@hust.edu.vn",
  leaderEmail: "bgh.hai@hust.edu.vn", // chỉ có quyền xem
  staffEmail: "qhdn.an@hust.edu.vn",
  password: "Password123!",
};
