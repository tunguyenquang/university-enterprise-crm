// ==========================================
// TẦNG DỮ LIỆU - CHỌN BACKEND QUA CỜ DB_BACKEND
// ==========================================
// DB_BACKEND = "prisma" -> dùng PostgreSQL (qua Prisma).
// DB_BACKEND = "json"   -> dùng file data/db.json (mặc định, tiện cho dev/test/demo).
//
// Cả hai backend implement cùng interface DbService (bất đồng bộ) trong db.types.ts,
// nên phần còn lại của ứng dụng (server.ts, cron.ts) không cần biết đang dùng backend nào.

import { config } from "./config.ts";
import { DbService } from "./db.types.ts";
import { jsonDbService } from "./db.json.ts";
import { prismaDbService } from "./db.prisma.ts";

// Re-export tiện ích băm mật khẩu (test & nơi khác dùng).
export { hashPassword, comparePassword } from "./db.json.ts";

const backend = (process.env.DB_BACKEND || "json").toLowerCase();

let chosen: DbService;
if (backend === "prisma") {
  chosen = prismaDbService;
  console.log("[db] Backend dữ liệu: PostgreSQL (Prisma)");
} else {
  chosen = jsonDbService;
  console.log(
    `[db] Backend dữ liệu: JSON file${
      config.isProduction ? " (CẢNH BÁO: không nên dùng JSON ở production)" : ""
    }`
  );
}

export const dbService: DbService = chosen;
