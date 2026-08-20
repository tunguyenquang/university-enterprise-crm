// ==========================================
// UPLOAD FILE - xử lý tải file đính kèm (vd: bản scan MOU đã ký)
// ==========================================
// Lưu file vào thư mục uploads/ trên ổ đĩa server, phục vụ lại qua static route /files.
// Có giới hạn dung lượng và lọc loại file để tránh lạm dụng.

import fs from "fs";
import path from "path";
import multer from "multer";
import { Request } from "express";

export const UPLOAD_DIR = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.join(process.cwd(), "uploads");

// Đảm bảo thư mục lưu file tồn tại.
function ensureUploadDir(): void {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}
ensureUploadDir();

// Các loại file cho phép (văn bản hợp tác thường là PDF/ảnh/Word).
const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

// Sinh tên file an toàn, duy nhất, giữ phần mở rộng gốc.
function safeFilename(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase().slice(0, 10);
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `mou-${stamp}${ext}`;
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    ensureUploadDir();
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    cb(null, safeFilename(file.originalname));
  },
});

function fileFilter(_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback): void {
  if (ALLOWED_MIME.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Loại file không được phép. Chỉ chấp nhận PDF, ảnh (PNG/JPG/WEBP) hoặc Word."));
  }
}

export const mouUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
});

// Xóa file vật lý theo URL công khai (vd "/files/mou-xxx.pdf"). Bỏ qua nếu không tồn tại.
export function deleteUploadedFile(publicUrl?: string | null): void {
  if (!publicUrl || !publicUrl.startsWith("/files/")) return;
  const filename = path.basename(publicUrl);
  const filePath = path.join(UPLOAD_DIR, filename);
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch {
    // bỏ qua lỗi xóa file
  }
}
