// ==========================================
// CẤU HÌNH TẬP TRUNG - đọc & kiểm tra biến môi trường
// ==========================================
// Mọi cấu hình của hệ thống đều đọc qua module này (không viết cứng trong code).
// Nạp file .env (nếu có) trước khi đọc process.env.

import dotenv from "dotenv";
dotenv.config();

function readString(key: string, fallback?: string): string {
  const value = process.env[key];
  if (value === undefined || value === "") {
    if (fallback !== undefined) return fallback;
    throw new Error(`Thiếu biến môi trường bắt buộc: ${key}`);
  }
  return value;
}

function readNumber(key: string, fallback: number): number {
  const raw = process.env[key];
  if (raw === undefined || raw === "") return fallback;
  const num = Number(raw);
  if (Number.isNaN(num)) {
    throw new Error(`Biến môi trường ${key} phải là số, nhận được: "${raw}"`);
  }
  return num;
}

const NODE_ENV = readString("NODE_ENV", "development");
const IS_PRODUCTION = NODE_ENV === "production";

// JWT_SECRET: ở production bắt buộc phải đặt và đủ mạnh; ở dev có giá trị mặc định để chạy được ngay.
const DEV_DEFAULT_SECRET = "dev-only-insecure-jwt-secret-change-me-please-32+";
let jwtSecret = process.env.JWT_SECRET || "";
if (!jwtSecret) {
  if (IS_PRODUCTION) {
    throw new Error("JWT_SECRET là bắt buộc ở môi trường production. Vui lòng cấu hình trong .env");
  }
  jwtSecret = DEV_DEFAULT_SECRET;
  console.warn("[config] CẢNH BÁO: JWT_SECRET chưa được đặt, đang dùng secret mặc định CHỈ cho development.");
} else if (IS_PRODUCTION && jwtSecret.length < 32) {
  throw new Error("JWT_SECRET ở production phải dài tối thiểu 32 ký tự.");
}

export const config = {
  nodeEnv: NODE_ENV,
  isProduction: IS_PRODUCTION,
  port: readNumber("PORT", 3000),

  jwt: {
    secret: jwtSecret,
    expiresIn: readString("JWT_EXPIRES_IN", "8h"),
  },

  bcryptRounds: readNumber("BCRYPT_ROUNDS", 10),

  // Mật khẩu mặc định cho dữ liệu seed (chỉ áp dụng lần khởi tạo đầu tiên).
  seedDefaultPassword: readString("SEED_DEFAULT_PASSWORD", "Password123!"),

  // CORS: danh sách origin được phép. Rỗng => không bật CORS (same-origin).
  corsOrigins: (process.env.CORS_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
};

export type AppConfig = typeof config;
