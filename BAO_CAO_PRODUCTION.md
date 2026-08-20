# Báo cáo: Những việc cần làm để đưa dự án lên Production

> **Dự án:** University Enterprise CRM (Hệ thống CRM Quan hệ Doanh nghiệp Đại học)
> **Ngày lập:** 22/06/2026
> **Mục đích:** Phân tích hiện trạng và liệt kê đầy đủ các việc cần làm để đưa dự án từ bản demo lên môi trường production. Viết theo cách dễ hiểu cho người mới.

---

## 1. Tổng quan dự án

Đây là một **CRM quản lý quan hệ doanh nghiệp** cho trường Đại học, dùng để quản lý: hồ sơ doanh nghiệp đối tác, văn bản hợp tác MOU/MOA, nhật ký tương tác, tuyển dụng/thực tập, sự kiện và nhắc việc.

**Công nghệ đang dùng:**

| Lớp | Công nghệ |
|-----|-----------|
| Frontend | React 19 + TypeScript + TailwindCSS 4 + lucide-react |
| Backend | Express 4 (REST API) |
| Build/Dev | Vite 6 (chạy chung 1 cổng `3000` với Express) |
| "Database" | **File JSON** (`data/db.json`) — chưa phải DB thật |
| Schema thiết kế | Prisma (PostgreSQL) — hiện chỉ là file thiết kế tham chiếu |

---

## 2. Hiểu đúng vạch xuất phát

Dự án hiện là một **bản demo chạy được** (sinh ra từ Google AI Studio). Nó "trông như thật" nhưng bên trong còn nhiều thứ chỉ là đồ giả.

> **Ví von:** Nó giống một **căn nhà mẫu** ở khu đô thị — nhìn đẹp, đi lại được, nhưng chưa có điện nước thật, cửa chưa khóa được, và móng chỉ là tạm. Muốn cho người vào ở thật (production) thì phải làm nốt những phần "ẩn" đó.

Các việc được chia thành **3 nhóm theo độ ưu tiên**:

- 🔴 **Bắt buộc** — không có thì sập / mất dữ liệu / bị hack
- 🟡 **Nên có** — production nghiêm túc cần
- 🟢 **Tốt nếu có** — chất lượng & vận hành

---

## 🔴 NHÓM 1 — BẮT BUỘC (chưa làm là không thể lên production)

### 1.1. Database thật (hiện đang là "DB giả")

- **Vấn đề:** Dữ liệu đang lưu trong 1 file `data/db.json` (`src/server/db.ts`). Mỗi lần ghi là viết lại **cả file**.
- **Tại sao nguy hiểm:**
  - 2 người dùng cùng lúc → ghi đè lên nhau → **mất dữ liệu**.
  - Server restart trên cloud (rất hay xảy ra) → file biến mất → **mất sạch dữ liệu**.
  - Không chịu nổi nhiều dữ liệu / nhiều người.
- **Việc cần làm:** Kết nối database thật. Dự án đã có sẵn bản thiết kế `prisma/schema.prisma` cho PostgreSQL, và máy đã cài Postgres 15 → chỉ cần cài Prisma + viết lại `db.ts` để gọi DB thật.

### 1.2. Bảo mật đăng nhập (hiện đang "khóa giả")

- **Vấn đề:** "Vé vào cửa" (token) hiện là chuỗi tự chế `token-<userId>-<timestamp>` (`src/server/server.ts:111`).
- **Tại sao nguy hiểm:** Token này **không có chữ ký và không bao giờ hết hạn**. Bất kỳ ai cũng có thể tự chế token với `userId` của người khác (kể cả admin) và **đăng nhập giả mạo** mà không cần mật khẩu.
- **Việc cần làm:**
  - Thay bằng **JWT** (token có chữ ký, có hạn) hoặc session chuẩn.
  - Mật khẩu đang hash bằng **SHA-256** (`src/server/db.ts:71`) — quá yếu. Đổi sang **bcrypt** hoặc **argon2**.
  - Mọi user demo đang chung mật khẩu `Password123` (`src/server/db.ts:171`) — phải bỏ.

### 1.3. Phân quyền chưa được "gắn" vào API

- **Vấn đề:** Code có viết hàm kiểm tra quyền `requirePermission()` (`src/server/server.ts:43`) **nhưng không route nào gọi nó cả**.
- **Tại sao nguy hiểm:** Nghĩa là **bất kỳ ai đăng nhập được đều làm được mọi thứ** — kể cả xóa doanh nghiệp, dù vai trò chỉ là "chỉ được xem". Phân quyền hiện chỉ là trang trí.
- **Việc cần làm:** Gắn `requirePermission("...")` vào từng route (vd route xóa DN phải có `requirePermission("delete_enterprise")`).

### 1.4. Biến môi trường & secrets

- **Vấn đề:** `.env.example` chưa có `DATABASE_URL`, chưa có khóa bí mật cho JWT. Cổng server bị **viết cứng** `PORT = 3000` (`src/server/server.ts:8`).
- **Việc cần làm:** Đưa tất cả cấu hình (DB, JWT secret, PORT) vào file `.env`, đọc qua `process.env`. **Tuyệt đối không commit** file `.env` thật lên git (`.gitignore` đã chặn `.env*` — tốt).

### 1.5. Validation dữ liệu đầu vào

- **Vấn đề:** Server chỉ kiểm tra sơ sài kiểu "có điền hay chưa" (`if (!data.name)`). Không kiểm tra định dạng (email đúng không, ngày hợp lệ không, số âm...).
- **Tại sao cần:** Người dùng (hoặc kẻ xấu) gửi dữ liệu rác/độc hại sẽ làm hỏng DB hoặc gây lỗi.
- **Việc cần làm:** Thêm thư viện kiểm tra như **Zod** để xác thực mọi dữ liệu trước khi lưu.

---

## 🟡 NHÓM 2 — NÊN CÓ (production nghiêm túc cần những cái này)

| # | Việc cần làm | Giải thích đơn giản |
|---|---|---|
| 6 | **CRUD cho Master data** | Quản lý Khoa/Phòng, Cán bộ, Vai trò hiện **chỉ xem, không thêm/sửa/xóa được**. Backend chỉ có `GET`. |
| 7 | **Xử lý upload file** | MOU có trường `fileUrl` nhưng **không có chỗ upload file thật**. Cần API upload + nơi lưu (ổ đĩa hoặc cloud như S3). |
| 8 | **CORS & Security headers** | Hiện không có `cors`, `helmet`. Cần thêm để chặn các kiểu tấn công web cơ bản. |
| 9 | **Rate limiting** | Giới hạn số lần gọi API (vd chặn dò mật khẩu bằng cách thử 1000 lần/giây). |
| 10 | **Xử lý lỗi tập trung** | Frontend đang báo lỗi bằng `alert()` (`src/App.tsx:207`) — xấu và thiếu chuyên nghiệp. Backend cần middleware bắt lỗi chung để không lộ thông tin nhạy cảm. |
| 11 | **Logging thật** | Hiện chỉ có `console.log`. Production cần log ra file/dịch vụ để truy vết khi có sự cố. |
| 12 | **"Cron giả" cho cảnh báo MOU** | Cảnh báo MOU sắp hết hạn chỉ chạy khi có người mở trang (`src/server/server.ts:866`). Nên đổi thành **tác vụ chạy nền định kỳ** (cron job thật) để gửi cảnh báo kể cả khi không ai online. |
| 13 | **Tính năng AI chưa làm** | Đã cài `@google/genai` nhưng **chưa dùng ở đâu**. Nếu định có AI thì còn phải làm; nếu không thì gỡ bỏ cho gọn. |

---

## 🟢 NHÓM 3 — TỐT NẾU CÓ (chất lượng & vận hành)

| # | Việc cần làm | Giải thích |
|---|---|---|
| 14 | **Tiêu đề trang & favicon** | `index.html` vẫn ghi `"My Google AI Studio App"` — đổi thành tên CRM. |
| 15 | **Tách App.tsx** | File `src/App.tsx` dài **1462 dòng** — quá lớn, khó bảo trì. Nên tách thành nhiều file nhỏ. |
| 16 | **Refresh token / tự đăng xuất** | Khi token hết hạn (sau khi làm việc 1.2), cần xử lý gia hạn hoặc tự đăng xuất mượt mà. |
| 17 | **Testing** | Hiện **không có test nào**. Nên có test cho các luồng quan trọng (đăng nhập, tạo DN, automation). |
| 18 | **CI/CD & hạ tầng deploy** | Cần chọn nơi host (Render, Railway, VPS...), cấu hình build tự động, HTTPS, domain. |
| 19 | **Backup database** | Lên lịch sao lưu DB định kỳ để không mất dữ liệu khi sự cố. |
| 20 | **Sửa lỗi nhỏ trong seed** | `src/server/db.ts:108` có mã `"TT_K khởi nghiệp"` dính khoảng trắng + tiếng Việt — nên sửa thành mã chuẩn. |

---

## 3. Lộ trình gợi ý (làm theo thứ tự này)

### Giai đoạn 1 — "Làm cho an toàn & bền" (bắt buộc trước khi cho ai dùng)

1. Kết nối Database thật (Prisma + PostgreSQL) ← *nền móng*
2. Viết seed data vào DB
3. JWT + bcrypt (đăng nhập an toàn)
4. Gắn `requirePermission` vào các route
5. Biến môi trường (`.env`: `DATABASE_URL`, `JWT_SECRET`, `PORT`)
6. Validation bằng Zod

### Giai đoạn 2 — "Làm cho đủ tính năng"

7. CRUD Master data (Khoa/Phòng, Users, Roles)
8. Upload file cho MOU
9. CORS + helmet + rate-limit + xử lý lỗi tập trung

### Giai đoạn 3 — "Làm cho chạy ngoài đời"

10. Cron job thật cho cảnh báo MOU
11. Logging + Backup
12. Chọn nơi deploy, cấu hình HTTPS/domain, CI/CD
13. Dọn dẹp (tách App.tsx, sửa index.html, gỡ genai nếu không dùng)

---

## 4. Bảng tổng hợp checklist

| # | Việc | Nhóm | Trạng thái |
|---|------|:----:|:----------:|
| 1 | Kết nối Database thật (Prisma + PostgreSQL) | 🔴 | ✅ *(PostgreSQL qua Prisma; có cờ DB_BACKEND chuyển json/prisma)* |
| 2 | Bảo mật đăng nhập (JWT + bcrypt) | 🔴 | ✅ |
| 3 | Gắn phân quyền vào API | 🔴 | ✅ |
| 4 | Biến môi trường & secrets | 🔴 | ✅ |
| 5 | Validation dữ liệu (Zod) | 🔴 | ✅ |
| 6 | CRUD Master data | 🟡 | ✅ *(API + UI quản lý Users/Departments)* |
| 7 | Upload file cho MOU | 🟡 | ✅ *(multer, lưu ổ đĩa, /files)* |
| 8 | CORS & security headers | 🟡 | ✅ |
| 9 | Rate limiting | 🟡 | ✅ |
| 10 | Xử lý lỗi tập trung | 🟡 | ✅ *(backend: error handler tập trung; frontend vẫn dùng alert)* |
| 11 | Logging thật | 🟡 | ✅ |
| 12 | Cron job thật cho cảnh báo MOU | 🟡 | ✅ |
| 13 | Hoàn thiện / gỡ tính năng AI | 🟡 | ☐ *(giữ @google/genai theo yêu cầu, chưa tích hợp)* |
| 14 | Tiêu đề trang & favicon | 🟢 | ✅ |
| 15 | Tách nhỏ App.tsx | 🟢 | ✅ *(tách lib/api, lib/crmLabels, UserManagement)* |
| 16 | Refresh token / tự đăng xuất | 🟢 | ✅ *(tự đăng xuất khi JWT hết hạn / nhận 401)* |
| 17 | Testing | 🟢 | ✅ *(56 test, pass 56/56 trên cả JSON & PostgreSQL)* |
| 18 | CI/CD & hạ tầng deploy | 🟢 | ✅ *(GitHub Actions: lint+test+build; deploy/host cần chọn hạ tầng)* |
| 19 | Backup database | 🟢 | ✅ *(script backup + mẫu pg_dump)* |
| 20 | Sửa lỗi nhỏ trong seed data | 🟢 | ✅ |

> **Cập nhật ngày 23/06/2026:** Đã hoàn thành **19/20 hạng mục**. Database thật PostgreSQL (Prisma) đã hoạt động, kèm cờ `DB_BACKEND` cho phép chuyển đổi json ⇄ prisma. Lint sạch (0 lỗi), build production thành công, **56/56 test pass trên CẢ HAI backend** (JSON & PostgreSQL), server production khởi động & login JWT + truy vấn dữ liệu hoạt động thực tế trên Postgres.
>
> **Còn lại:** #13 (AI) — giữ package `@google/genai` theo yêu cầu, chưa tích hợp tính năng. Phần deploy/host thực tế của #18 (chọn nơi host, HTTPS, domain) cần quyết định hạ tầng cụ thể.

---

## 5. Tóm lại một câu

> Dự án hiện **chạy được để demo**, nhưng **3 thứ then chốt là DB giả, đăng nhập không an toàn, và phân quyền chưa gắn** khiến nó **chưa thể lên production**. Ưu tiên số 1 là làm **Giai đoạn 1**.
