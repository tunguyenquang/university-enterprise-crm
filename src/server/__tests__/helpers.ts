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

// Nap .env ngay tai day: config.ts goi dotenv.config() nhung chi khi module do duoc import,
// tuc SAU doan nay. Khong nap truoc thi DB_BACKEND / DATABASE_URL con rong va nhanh doi
// DB sang ban _test duoi day khong chay -> test lai ghi vao DB dev.
// dotenv khong ghi de bien da co san nen cac dong process.env.* o tren van thang.
const dotenv = await import("dotenv");
dotenv.default.config();

// Khi chay test tren backend Prisma, BAT BUOC tro vao DB test rieng.
// Truoc day test dung DATABASE_URL cua .env nen ghi thang vao DB dev, de lai
// du lieu rac ("DN Atomic", "DN Staff Tao", "MOU-SAP-HET-HAN-TEST"...) hien ra giao dien.
// Uu tien TEST_DATABASE_URL; neu khong khai thi tu doi ten DB sang "<db>_test".
if ((process.env.DB_BACKEND || "json") === "prisma") {
  const explicit = process.env.TEST_DATABASE_URL;
  if (explicit) {
    process.env.DATABASE_URL = explicit;
  } else {
    const current = process.env.DATABASE_URL || "";
    if (current && !/_test(\?|$)/.test(current)) {
      // Chen hau to _test vao ten database, giu nguyen query string (vd ?schema=public).
      process.env.DATABASE_URL = current.replace(/\/([^/?]+)(\?|$)/, "/$1_test$2");
    }
  }
}

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
