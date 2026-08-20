// ==========================================
// BACKUP DATABASE - sao lưu định kỳ (#19)
// ==========================================
// Hiện hệ thống lưu dữ liệu ở data/db.json. Script này copy file đó (+ thư mục uploads)
// thành bản sao có timestamp vào thư mục backups/, và chỉ giữ lại N bản gần nhất.
//
// Chạy thủ công:   node scripts/backup-db.mjs
// Lập lịch:
//   - Windows: dùng Task Scheduler gọi "node <đường-dẫn>/scripts/backup-db.mjs" hằng ngày.
//   - Linux/macOS (cron):  0 2 * * *  cd /path/to/app && node scripts/backup-db.mjs
//
// Khi chuyển sang PostgreSQL, thay phần copy JSON bằng pg_dump (mẫu ở cuối file).

import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const DATA_DIR = process.env.DB_DIR ? path.resolve(process.env.DB_DIR) : path.join(ROOT, "data");
const DB_FILE = path.join(DATA_DIR, "db.json");
const UPLOAD_DIR = process.env.UPLOAD_DIR ? path.resolve(process.env.UPLOAD_DIR) : path.join(ROOT, "uploads");
const BACKUP_DIR = path.join(ROOT, "backups");
const KEEP = Number(process.env.BACKUP_KEEP || 14); // giữ 14 bản gần nhất

function timestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function copyDirRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDirRecursive(s, d);
    else fs.copyFileSync(s, d);
  }
}

function main() {
  if (!fs.existsSync(DB_FILE)) {
    console.error(`[backup] Không tìm thấy ${DB_FILE}. Bỏ qua.`);
    process.exit(1);
  }

  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const stamp = timestamp();
  const target = path.join(BACKUP_DIR, `backup-${stamp}`);
  fs.mkdirSync(target, { recursive: true });

  // 1. Copy db.json
  fs.copyFileSync(DB_FILE, path.join(target, "db.json"));

  // 2. Copy uploads (nếu có file đính kèm)
  if (fs.existsSync(UPLOAD_DIR)) {
    copyDirRecursive(UPLOAD_DIR, path.join(target, "uploads"));
  }

  console.log(`[backup] Đã sao lưu vào ${target}`);

  // 3. Dọn bản cũ, chỉ giữ KEEP bản gần nhất.
  const backups = fs
    .readdirSync(BACKUP_DIR)
    .filter((name) => name.startsWith("backup-"))
    .sort(); // tên có timestamp => sort tăng dần theo thời gian

  if (backups.length > KEEP) {
    const toDelete = backups.slice(0, backups.length - KEEP);
    for (const name of toDelete) {
      fs.rmSync(path.join(BACKUP_DIR, name), { recursive: true, force: true });
      console.log(`[backup] Đã xóa bản cũ: ${name}`);
    }
  }

  console.log(`[backup] Hoàn tất. Đang giữ ${Math.min(backups.length, KEEP)} bản gần nhất.`);
}

main();

// ------------------------------------------------------------------
// MẪU backup khi đã chuyển sang PostgreSQL (dùng pg_dump):
//
//   import { execSync } from "child_process";
//   const url = process.env.DATABASE_URL;
//   const out = path.join(BACKUP_DIR, `pg-${stamp}.dump`);
//   execSync(`pg_dump "${url}" -F c -f "${out}"`, { stdio: "inherit" });
//
// Khôi phục:  pg_restore -d "$DATABASE_URL" --clean backups/pg-XXXX.dump
// ------------------------------------------------------------------
