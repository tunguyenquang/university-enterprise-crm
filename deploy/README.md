# Deploy — University Enterprise CRM

Thư mục này chứa **script và cấu hình để đưa hệ thống lên môi trường thật**. Bản build
(`dist/`) không được commit vì sinh lại được bằng `npm run build`; script sẽ tự build rồi đẩy lên.

| File | Việc nó làm |
|---|---|
| [`deploy-to-174.ps1`](deploy-to-174.ps1) | Build + đẩy code lên VPS `.174`, cấu hình Windows Service (NSSM) và IIS site `hustcrm.jvs.com.vn` |
| [`backup-db.ps1`](backup-db.ps1) | Sao lưu PostgreSQL bằng `pg_dump` (DB local hoặc DB trên `.174`) |
| [`web.config`](web.config) | Cấu hình IIS reverse proxy cho site `hustcrm.jvs.com.vn` |
| [`setup-github-runner.ps1`](setup-github-runner.ps1) | Cài GitHub Actions self-hosted runner trên `.174` để bật CD tự động |
| [`../.github/workflows/cd.yml`](../.github/workflows/cd.yml) | Workflow CD: push vào `main` + CI xanh → tự deploy |

---

## 1. Kiến trúc khi chạy thật

Node.js **không** chạy trực tiếp dưới IIS. Cách bố trí (theo đúng khuôn mẫu site
`zalocrm.jvs.com.vn` đã chạy ổn định trên cùng máy):

```
Người dùng
    │  https://hustcrm.jvs.com.vn
    ▼
IIS site "hustcrm.jvs.com.vn"        ← chỉ chứa web.config, KHÔNG chứa code
    │  reverse proxy (ARR + URL Rewrite)
    ▼
http://127.0.0.1:3090                 ← app chỉ nghe localhost, không mở ra ngoài
    │
Windows Service "hustcrm" (NSSM)     ← node dist/server.cjs, tự khởi động lại khi lỗi
    │
    ▼
PostgreSQL 18 trên chính .174 → database "university_crm"
```

**Vì sao tách như vậy:** IIS lo HTTPS/cert/domain, Node lo ứng dụng. App nghe `127.0.0.1`
nên không thể bị truy cập trực tiếp từ ngoài, bắt buộc đi qua IIS.

---

## 2. Thông số môi trường `.174`

| Hạng mục | Giá trị |
|---|---|
| SSH alias | `jvsadm-174` (IP thật `192.168.59.174`) |
| Domain | `hustcrm.jvs.com.vn` |
| Cổng nội bộ của app | **3090** (3080 đã là của `zalocrm`) |
| Windows Service | `hustcrm` |
| Code | `C:\apps\hustcrm` |
| Log | `C:\apps\hustcrm-logs\app.out.log` / `app.err.log` |
| IIS site dir | `C:\inetpub\wwwroot\hustcrm.jvs.com.vn` (chỉ có `web.config`) |
| NSSM | `C:\apps\tools\nssm.exe` (không có trong PATH) |
| Node | `C:\Program Files\nodejs\node.exe` (v20) |
| PostgreSQL | 18, port 5432, database `university_crm` |
| Cert HTTPS | Cloudflare Origin Certificate dùng chung cho `*.jvs.com.vn`, thumbprint `484E5CDD48CF9DA40D026BB1C5570400A501A150`, nằm ở store **`WebHosting`** (không phải `My`), hạn 2041 |

---

## 3. Cách deploy

**Trước khi chạy, bắt buộc đặt 2 biến môi trường** (script không chứa mật khẩu — file này nằm trong git):

```powershell
$env:PG174_PASSWORD    = '<mật khẩu user postgres trên .174>'
$env:CRM_SEED_PASSWORD = '<mật khẩu khởi tạo cho tài khoản seed>'
```

```powershell
# Xem trước kế hoạch, không thay đổi gì
powershell -NoProfile -File deploy/deploy-to-174.ps1 -DryRun

# Deploy (build + đẩy code + migrate + service + IIS) — KHÔNG seed
powershell -NoProfile -File deploy/deploy-to-174.ps1

# Lần khởi tạo đầu tiên: kèm nạp dữ liệu mẫu
powershell -NoProfile -File deploy/deploy-to-174.ps1 -Seed

# Chỉ cập nhật code (đã có DB + IIS từ trước) — nhanh nhất cho lần deploy sau
powershell -NoProfile -File deploy/deploy-to-174.ps1 -AppOnly
```

> ⚠️ **`-Seed` ghi đè dữ liệu mẫu.** Seed dùng `upsert` theo id cố định nên sẽ ghi đè
> tên/vai trò/đơn vị của 5 user seed và **kích hoạt lại tài khoản đã bị vô hiệu hoá**,
> đồng thời ghi đè nội dung DN/MOU/task nếu đã được sửa trên môi trường thật.
> Mật khẩu **không** bị đổi (chỉ nằm trong nhánh `create`). Vì vậy `-Seed` không bật mặc định.

Script chạy tuần tự: lint → build → kiểm tiền đề trên server → tạo DB (nếu chưa có) →
dừng service → đẩy `dist/` + `prisma/` + `package.json` → tạo `.env` (nếu chưa có) →
`npm install --omit=dev` + `prisma generate` → `prisma migrate deploy` (+ seed nếu có `-Seed`) →
cấu hình NSSM → **kiểm app trả HTTP 200 trên `127.0.0.1:3090`** → tạo IIS site + binding cert.

Nếu bước kiểm sức khỏe thất bại, script **dừng và in 20 dòng cuối của `app.err.log`**
thay vì báo thành công giả.

---

## 4. Nguyên tắc an toàn đã cài trong script

Máy `.174` đang chạy ~18 site thật, nên script được viết để **chỉ thêm mới, không sửa cái đang phục vụ**:

- ✅ Chỉ tạo service/site/DB **mang tên riêng** của app này.
- ✅ **Dừng ngay** nếu port 3090 đang bị tiến trình khác chiếm (không đạp vào app khác).
- ✅ **Không** `iisreset`, không restart IIS toàn cục — chỉ `Start-Website` cho site mới.
- ✅ **Không** tạo cert mới, chỉ gắn lại cert wildcard đã có.
- ✅ `.env` trên server **chỉ tạo khi chưa tồn tại** — deploy lại không ghi đè `JWT_SECRET`
  (ghi đè sẽ làm mọi phiên đăng nhập hiện tại bị vô hiệu).
- ✅ **Code nằm trong `wwwroot` nhưng không bị lộ.** Site trỏ vào `…\hustcrm.jvs.com.vn`,
  code nằm trong thư mục con `app\`. Hai lớp chặn: (1) rule rewrite bắt **mọi** request
  `(.*)` chuyển sang Node nên không request nào chạm tới file trên đĩa; (2) `requestFiltering`
  chặn tường minh `hiddenSegments` (`app`, `node_modules`, `logs`, `prisma`) và
  `fileExtensions` (`.env`, `.map`, `.ps1`, `.cjs`), kèm `directoryBrowse enabled="false"`.
  Đã kiểm chứng thực tế: `/app/.env`, `/app/dist/server.cjs`, `/app/package.json`,
  `/logs/app.err.log`, `/web.config` đều trả **404 rỗng**.
- ⛔ **KHÔNG dùng `<serverVariables>` trong `web.config`.** `allowedServerVariables` ở
  server level đang trống; thêm vào đó **ảnh hưởng mọi site khác** trên máy. URL công khai
  lấy từ biến môi trường `APP_URL` nên không cần `X-Forwarded-Proto`.

---

## 5. Backup database

```powershell
# Backup DB local (đọc DATABASE_URL từ .env)
powershell -NoProfile -File deploy/backup-db.ps1

# Backup DB trên .174 (chạy pg_dump tại chỗ rồi kéo file về local)
# Cần $env:PG174_PASSWORD như phần deploy.
powershell -NoProfile -File deploy/backup-db.ps1 -Target remote

# Chọn nơi lưu và số ngày giữ lại
powershell -NoProfile -File deploy/backup-db.ps1 -Target remote -OutDir D:\backup -KeepDays 14
```

File lưu vào `backups/`. Bản remote được **đối chiếu kích thước** giữa server và local
trước khi xoá file tạm trên server.

> ⚠️ **Theo yêu cầu, `backups/` được commit vào repo.** File dump chứa dữ liệu thật
> (email cán bộ, bcrypt hash mật khẩu, thông tin đối tác) và **tồn tại vĩnh viễn trong
> lịch sử git** kể cả khi xoá file sau này. Vì vậy:
> - **Đổi mật khẩu mọi tài khoản seed** sau khi commit (hash trong dump ứng với mật khẩu cũ).
> - Cân nhắc chuyển repo sang **private** nếu chưa.
> - Muốn quay lại cách an toàn: thêm `backups/` vào `.gitignore` và chỉ commit script này.

**Khôi phục:** tạo database mới rồi restore vào đó, tuyệt đối không restore đè lên DB đang phục vụ:

```powershell
psql -U postgres -h 127.0.0.1 -p 5432 -d university_crm_restore -f backups/university_crm-174-<stamp>.sql
```

---

## 6. Vận hành thường ngày

```bash
# Trạng thái + log
ssh jvsadm-174 "powershell -Command \"Get-Service hustcrm | Select-Object Name,Status\""
ssh jvsadm-174 "powershell -Command \"Get-Content C:\apps\hustcrm-logs\app.err.log -Tail 40\""

# Khởi động lại app (chỉ ảnh hưởng app này)
ssh jvsadm-174 "C:\apps\tools\nssm.exe restart hustcrm"
```

**Chẩn đoán nhanh khi site lỗi:**

| Hiện tượng | Nguyên nhân thường gặp |
|---|---|
| IIS trả 502 | service `hustcrm` đã dừng → xem `app.err.log`, `nssm start hustcrm` |
| Lỗi kết nối DB trong log | service `postgresql-x64-18` chưa chạy, hoặc `DATABASE_URL` sai |
| Đăng nhập được rồi bị đăng xuất ngay | `JWT_SECRET` vừa bị đổi → token cũ không còn hợp lệ (bình thường, đăng nhập lại) |
| Trang trắng, API 404 | thiếu `dist/assets` → deploy lại, không dùng `-SkipBuild` |

---

## 7. Sau khi deploy lần đầu — BẮT BUỘC

1. Đăng nhập `admin@hust.edu.vn` với mật khẩu đã đặt ở `$env:CRM_SEED_PASSWORD`.
2. **Đổi ngay mật khẩu** của mọi tài khoản seed (màn *Cán bộ & Phân quyền*).
3. Kiểm nhanh: Dashboard, Hồ sơ DN, Pipeline, MOU, Việc làm, Sự kiện, Nhắc việc, Cán bộ.

---

## 8. CI/CD — tự động deploy khi push

### 8.1. Luồng hoạt động

```
git push origin main
      │
      ▼
CI (.github/workflows/ci.yml)          ← chạy trên runner cloud của GitHub
   npm ci → lint → test → build
      │  chỉ khi XANH
      ▼
CD (.github/workflows/cd.yml)          ← chạy trên self-hosted runner tại .174
   build → dừng service → cập nhật code → npm install --omit=dev
   → prisma generate → khởi động service → kiểm HTTP 200
```

**Vì sao cần self-hosted runner:** `.174` chỉ có IP nội bộ `192.168.59.174`, GitHub
Actions trên cloud **không SSH vào được**. Runner cài tại chỗ tự *kéo* job về qua HTTPS
outbound — không phải mở port, không phải cấp IP public, **không lưu SSH key trên GitHub**.

### 8.2. Bật CD (làm một lần)

```powershell
# 1. Lấy token đăng ký runner (hết hạn sau 1 giờ):
#    https://github.com/tunguyenquang/university-enterprise-crm/settings/actions/runners/new
#    → chọn Windows x64 → copy giá trị sau `--token`

$env:GH_RUNNER_TOKEN = '<token vừa copy>'
powershell -NoProfile -File deploy/setup-github-runner.ps1

# 2. Kiểm tra: runner "hustcrm-174" hiện trạng thái Idle ở trang Runners
```

Script tự kiểm tiền đề (Node, thư mục app đã dựng), tải runner, đăng ký với repo và
cài làm **Windows Service** để tự khởi động cùng máy. Gỡ: thêm cờ `-Uninstall`.

### 8.3. Phạm vi của CD — CHỈ cập nhật code

CD **không** chạy `prisma migrate deploy`, **không** seed. Đây là quyết định vận hành có
chủ đích: một lần push không được phép tự động thay đổi cấu trúc hay dữ liệu của database
đang phục vụ. Khi bản phát hành có migration mới, chạy tay:

```bash
ssh jvsadm-174 "powershell -Command \"Set-Location 'C:\inetpub\wwwroot\hustcrm.jvs.com.vnpp'; npx prisma migrate deploy\""
```

Hoặc dùng script deploy đầy đủ từ máy local (`deploy-to-174.ps1`, có migrate; thêm
`-Seed` nếu thực sự muốn nạp lại dữ liệu mẫu).

### 8.4. Cơ chế an toàn trong CD

- **Chỉ deploy khi CI xanh** (`workflow_run` + kiểm `conclusion == 'success'`) → không đẩy code lỗi lên server.
- **`concurrency` group** → hai lần deploy không chạy song song ghi đè nhau.
- **Dừng service trước khi ghi file** → Windows khoá file đang dùng, không dừng thì copy sẽ lỗi.
- **Xoá `dist` cũ** → không còn sót file js/css của bản build trước (tên có hash).
- **Kiểm HTTP 200 với 6 lần thử**; nếu thất bại thì **in 30 dòng cuối `app.err.log` và fail job** — không báo thành công trên một app đã chết.
- Có thể **bấm deploy tay** từ tab Actions (`workflow_dispatch`) khi cần.
