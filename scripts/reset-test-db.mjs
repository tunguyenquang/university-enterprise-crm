// ==========================================
// RESET DB TEST (PostgreSQL) - chạy trước test suite
// ==========================================
// Vì sao cần: các integration test cũ tạo doanh nghiệp với MÃ CỐ ĐỊNH
// ("DN-E2E", "DN-DUP", "DN-ATOMIC", "DN-STAFF-1"). Trên backend JSON không sao
// vì mỗi lần chạy dùng thư mục tạm mới, nhưng trên PostgreSQL thì dữ liệu còn lại
// từ lần trước làm vi phạm ràng buộc UNIQUE(code) -> API trả 500 và test đỏ oan
// từ lần chạy thứ hai trở đi.
//
// Script này drop + tạo lại + migrate + seed DB test, đảm bảo mỗi lần chạy test
// đều bắt đầu từ trạng thái sạch. KHÔNG bao giờ chạm vào DB dev: tên DB đích
// buộc phải kết thúc bằng "_test", nếu không thì dừng ngay.
//
// Chạy: node scripts/reset-test-db.mjs   (npm test đã tự gọi qua pretest)
// Bỏ qua an toàn khi DB_BACKEND != "prisma".

import { execFileSync } from "child_process";
import dotenv from "dotenv";

dotenv.config();

const backend = (process.env.DB_BACKEND || "json").toLowerCase();
if (backend !== "prisma") {
  console.log('[reset-test-db] DB_BACKEND != "prisma" - bỏ qua (test dùng file JSON tạm).');
  process.exit(0);
}

// Suy ra URL DB test theo đúng quy tắc trong __tests__/helpers.ts.
function resolveTestUrl() {
  if (process.env.TEST_DATABASE_URL) return process.env.TEST_DATABASE_URL;
  const current = process.env.DATABASE_URL || "";
  if (!current) throw new Error("Thiếu DATABASE_URL trong .env");
  if (/_test(\?|$)/.test(current)) return current;
  return current.replace(/\/([^/?]+)(\?|$)/, "/$1_test$2");
}

const testUrl = resolveTestUrl();
const parsed = new URL(testUrl);
const dbName = parsed.pathname.replace(/^\//, "");

// Chốt an toàn: chỉ cho phép tác động lên database có hậu tố _test.
if (!dbName.endsWith("_test")) {
  console.error(`[reset-test-db] DỪNG: "${dbName}" không kết thúc bằng "_test". Từ chối xóa để tránh xóa nhầm DB dev/production.`);
  process.exit(1);
}

// Kết nối vào database "postgres" để có thể DROP/CREATE database đích.
const adminUrl = new URL(testUrl);
adminUrl.pathname = "/postgres";
adminUrl.search = "";

const psqlEnv = { ...process.env, PGPASSWORD: decodeURIComponent(parsed.password || "") };
const psqlArgs = (sql) => [
  "-U", decodeURIComponent(parsed.username || "postgres"),
  "-h", parsed.hostname,
  "-p", parsed.port || "5432",
  "-d", "postgres",
  "-v", "ON_ERROR_STOP=1",
  "-Atc", sql,
];

function psql(sql) {
  return execFileSync("psql", psqlArgs(sql), { env: psqlEnv, encoding: "utf-8" }).trim();
}

try {
  console.log(`[reset-test-db] Reset database test: ${dbName}`);
  // Ngắt các kết nối đang mở, nếu không DROP sẽ báo "đang được sử dụng".
  psql(`SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='${dbName}' AND pid<>pg_backend_pid();`);
  psql(`DROP DATABASE IF EXISTS "${dbName}";`);
  psql(`CREATE DATABASE "${dbName}" ENCODING 'UTF8' TEMPLATE template0;`);

  const childEnv = { ...process.env, DATABASE_URL: testUrl, BCRYPT_ROUNDS: "4" };
  execFileSync("npx", ["prisma", "migrate", "deploy"], { env: childEnv, stdio: "inherit", shell: true });
  execFileSync("npx", ["tsx", "prisma/seed.ts"], { env: childEnv, stdio: "inherit", shell: true });
  console.log(`[reset-test-db] Xong - ${dbName} đã sạch và có dữ liệu seed.`);
} catch (err) {
  console.error("[reset-test-db] Lỗi:", err.message);
  console.error("[reset-test-db] Kiểm tra: psql có trong PATH, PostgreSQL đang chạy, thông tin trong DATABASE_URL đúng.");
  process.exit(1);
}
