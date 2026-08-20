// ==========================================
// CRON JOB - tác vụ chạy nền định kỳ
// ==========================================
// Trước đây cảnh báo MOU sắp hết hạn chỉ sinh ra khi có người mở trang notifications.
// Nay nó chạy nền theo lịch (kể cả khi không ai online), đảm bảo cảnh báo luôn kịp thời.

import { dbService } from "./db.ts";
import { logger } from "./logger.ts";
import { DocumentStatus } from "../types/crm.ts";

const NINETY_DAYS_MS = 90 * 24 * 3600 * 1000;
// Chạy mỗi 6 giờ. Đủ kịp thời cho cảnh báo theo ngày, không tốn tài nguyên.
const CHECK_INTERVAL_MS = 6 * 3600 * 1000;

// Quét toàn bộ MOU; với MOU đã ký và sẽ hết hạn trong 90 ngày tới, sinh cảnh báo
// cho người phụ trách (nếu chưa có cảnh báo cho MOU đó).
export async function checkExpiringMous(): Promise<number> {
  const now = new Date();
  const limit = new Date(now.getTime() + NINETY_DAYS_MS);

  const mous = await dbService.getMOUs();
  const ents = await dbService.getEnterprises();
  let created = 0;

  for (const m of mous) {
    const expiry = new Date(m.expiryDate);
    if (m.status === DocumentStatus.DA_KY && expiry > now && expiry <= limit) {
      const targetUserId = m.picId;
      if (!targetUserId) continue;

      // Tránh tạo trùng cảnh báo cho cùng một MOU.
      const existing = await dbService.getNotifications(targetUserId);
      const hasAlert = existing.some(
        (n) => n.type === "MOU_EXPIRY" && n.content.includes(m.code)
      );
      if (hasAlert) continue;

      const ent = ents.find((e) => e.id === m.enterpriseId);
      await dbService.createNotification({
        userId: targetUserId,
        title: "Cảnh báo: Thỏa thuận MOU sắp hết hạn!",
        content: `Văn bản hợp tác số ${m.code} với DN ${
          ent?.shortName || ent?.name || ""
        } có thời hạn đến ${expiry.toLocaleDateString(
          "vi-VN"
        )}. Hãy tiến hành bàn bạc kế hoạch tái ký.`,
        type: "MOU_EXPIRY",
        link: "/mous",
      });
      created += 1;
    }
  }

  if (created > 0) {
    logger.info(`[cron] Đã tạo ${created} cảnh báo MOU sắp hết hạn.`);
  }
  return created;
}

let timer: NodeJS.Timeout | null = null;

// Khởi động cron: chạy ngay 1 lần khi boot, sau đó lặp theo CHECK_INTERVAL_MS.
export function startMouExpiryCron(): void {
  if (timer) return; // tránh khởi động trùng
  logger.info("[cron] Bật tác vụ nền kiểm tra MOU sắp hết hạn (mỗi 6 giờ).");

  checkExpiringMous().catch((err) => {
    logger.error("[cron] Lỗi khi chạy kiểm tra MOU lần đầu", {
      message: (err as Error).message,
    });
  });

  timer = setInterval(() => {
    checkExpiringMous().catch((err) => {
      logger.error("[cron] Lỗi khi chạy kiểm tra MOU định kỳ", {
        message: (err as Error).message,
      });
    });
  }, CHECK_INTERVAL_MS);

  // Không giữ tiến trình sống chỉ vì timer (cho phép thoát sạch).
  if (timer.unref) timer.unref();
}

// Dừng cron (dùng cho test hoặc shutdown).
export function stopMouExpiryCron(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}
