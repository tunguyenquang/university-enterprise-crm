// ==========================================
// LOGGER - ghi log ra console + file để truy vết khi có sự cố
// ==========================================
// Production cần log lưu được để điều tra; không chỉ console.log biến mất khi restart.
// Log được ghi theo dòng JSON (mỗi dòng 1 sự kiện) vào logs/app.log.

import fs from "fs";
import path from "path";

type LogLevel = "info" | "warn" | "error" | "debug";

const LOG_DIR = path.join(process.cwd(), "logs");
const LOG_FILE = path.join(LOG_DIR, "app.log");

function ensureLogDir(): void {
  try {
    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR, { recursive: true });
    }
  } catch {
    // Không chặn ứng dụng nếu không tạo được thư mục log
  }
}

function writeLine(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
  const entry = {
    ts: new Date().toISOString(),
    level,
    message,
    ...(meta ? { meta } : {}),
  };

  // Console (giữ màu sắc qua level)
  const consoleFn =
    level === "error" ? console.error : level === "warn" ? console.warn : console.log;
  consoleFn(`[${entry.ts}] [${level.toUpperCase()}] ${message}`, meta ?? "");

  // File (append, không chặn nếu lỗi)
  try {
    ensureLogDir();
    fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + "\n", "utf-8");
  } catch {
    // Bỏ qua lỗi ghi file để không làm sập request
  }
}

export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => writeLine("info", message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => writeLine("warn", message, meta),
  error: (message: string, meta?: Record<string, unknown>) => writeLine("error", message, meta),
  debug: (message: string, meta?: Record<string, unknown>) => writeLine("debug", message, meta),
};
