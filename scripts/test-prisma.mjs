// ==========================================
// CHẠY TEST TRÊN BACKEND POSTGRESQL (PRISMA)
// ==========================================
// Mỗi lần chạy: reset schema crm_test -> migrate -> seed -> chạy test với DB_BACKEND=prisma.
// Nhờ reset, test luôn bắt đầu từ trạng thái sạch (idempotent).
//
// Dùng: node scripts/test-prisma.mjs

import { execSync } from "child_process";

const TEST_DB_URL = "postgresql://postgres:postgres@localhost:5432/crm_test?schema=public";

const env = {
  ...process.env,
  DATABASE_URL: TEST_DB_URL,
  DB_BACKEND: "prisma",
  // Đồng ý của người dùng cho thao tác reset (CHỈ áp dụng cho DB test crm_test).
  // Có thể truyền từ ngoài; nếu chưa có thì để trống và prisma sẽ chặn.
  PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION:
    process.env.PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION || "",
};

function run(cmd, label) {
  console.log(`\n=== ${label} ===`);
  execSync(cmd, { stdio: "inherit", env });
}

try {
  // 1. Reset schema (xóa sạch dữ liệu cũ) + áp lại migration
  run("npx prisma migrate reset --force --skip-generate --skip-seed", "Reset schema crm_test");
  // 2. Seed dữ liệu mẫu
  run("npx tsx prisma/seed.ts", "Seed dữ liệu");
  // 3. Chạy test trên backend Prisma
  run("npx tsx --test src/server/__tests__/*.test.ts", "Chạy test (Prisma backend)");
  console.log("\n✅ Test Prisma hoàn tất.");
} catch (err) {
  console.error("\n❌ Test Prisma thất bại.");
  process.exit(1);
}
