// Test hành vi nghiệp vụ: bcrypt hash, atomic write, cron MOU, CRUD cơ bản.
import { test, before, after, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import { startTestServer, stopTestServer, api, login, SEED } from "./helpers.ts";

let adminToken = "";

before(async () => {
  await startTestServer();
  adminToken = await login(SEED.adminEmail);
});
after(async () => {
  await stopTestServer();
});

describe("Lưu trữ mật khẩu (bcrypt)", () => {
  test("db.json chứa bcrypt hash, KHÔNG chứa mật khẩu thô", async () => {
    const dbFile = path.join(process.env.DB_DIR!, "db.json");
    assert.ok(fs.existsSync(dbFile), "db.json phải tồn tại");
    const raw = fs.readFileSync(dbFile, "utf-8");
    const data = JSON.parse(raw);

    assert.ok(data.credentials, "phải có mục credentials");
    const adminHash = data.credentials[SEED.adminEmail];
    assert.ok(adminHash, "admin phải có hash");
    // bcrypt hash bắt đầu bằng $2a$ / $2b$ / $2y$
    assert.match(adminHash, /^\$2[aby]\$/, "phải là bcrypt hash");
    // Không được lưu mật khẩu thô ở bất kỳ đâu.
    assert.ok(!raw.includes(SEED.password), "không được lưu mật khẩu thô trong DB");
  });

  test("hashPassword tạo hash khác nhau cho cùng mật khẩu (có salt)", async () => {
    const { hashPassword, comparePassword } = await import("../db.ts");
    const h1 = hashPassword("abc123");
    const h2 = hashPassword("abc123");
    assert.notEqual(h1, h2, "salt khiến 2 hash khác nhau");
    assert.ok(comparePassword("abc123", h1), "verify đúng hash 1");
    assert.ok(comparePassword("abc123", h2), "verify đúng hash 2");
    assert.ok(!comparePassword("sai", h1), "mật khẩu sai không khớp");
  });
});

describe("Atomic write", () => {
  test("Sau khi ghi, không còn file tạm .tmp sót lại", async () => {
    // Kích hoạt một lần ghi DB qua tạo enterprise.
    await api("POST", "/api/enterprises", {
      token: adminToken,
      body: { code: "DN-ATOMIC", name: "DN Atomic", field: "CNTT" },
    });
    const files = fs.readdirSync(process.env.DB_DIR!);
    const tmpLeft = files.filter((f) => f.endsWith(".tmp"));
    assert.equal(tmpLeft.length, 0, "không được sót file .tmp sau khi rename");
  });

  test("db.json là JSON hợp lệ sau nhiều lần ghi", async () => {
    for (let i = 0; i < 3; i++) {
      await api("POST", "/api/contacts", {
        token: adminToken,
        body: { enterpriseId: "e-fpt", name: `LH ${i}`, position: "Test" },
      });
    }
    const raw = fs.readFileSync(path.join(process.env.DB_DIR!, "db.json"), "utf-8");
    assert.doesNotThrow(() => JSON.parse(raw), "db.json phải parse được");
  });
});

describe("Cron cảnh báo MOU sắp hết hạn", () => {
  test("checkExpiringMous tạo cảnh báo cho MOU sắp hết hạn (VNG hết hạn 08/2026)", async () => {
    const { checkExpiringMous } = await import("../cron.ts");
    const { dbService } = await import("../db.ts");

    // MOU VNG (mou-vng) hết hạn 2026-08-15. Tùy thời điểm chạy có thể nằm trong 90 ngày.
    // Gọi cron và kiểm tra nó chạy không lỗi + trả về số lượng >= 0.
    const created = await checkExpiringMous();
    assert.ok(created >= 0, "trả về số lượng cảnh báo đã tạo");

    // Kiểm tra: tạo MOU chắc chắn hết hạn trong 30 ngày tới rồi chạy cron.
    const before = (await dbService.getMOUs()).length;
    const u = (await dbService.getUserByEmail(SEED.adminEmail))!;
    await dbService.createMOU({
      code: "MOU-SAP-HET-HAN-TEST",
      type: "MOU" as any,
      enterpriseId: "e-fpt",
      departmentId: "d-qhdn",
      signDate: new Date().toISOString(),
      effectiveDate: new Date().toISOString(),
      expiryDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
      picId: u.id,
      content: "Test cron",
      status: "DA_KY" as any,
      fileUrl: null,
    });
    assert.equal((await dbService.getMOUs()).length, before + 1);

    const createdNow = await checkExpiringMous();
    assert.ok(createdNow >= 1, "phải tạo ít nhất 1 cảnh báo cho MOU sắp hết hạn vừa thêm");

    // Chạy lại không được tạo trùng.
    const createdAgain = await checkExpiringMous();
    assert.equal(createdAgain, 0, "không tạo trùng cảnh báo cho cùng MOU");

    // Người phụ trách nhận được thông báo MOU_EXPIRY.
    const notifs = await dbService.getNotifications(u.id);
    assert.ok(
      notifs.some((n) => n.type === "MOU_EXPIRY" && n.content.includes("MOU-SAP-HET-HAN-TEST")),
      "phải có thông báo MOU_EXPIRY"
    );
  });
});

describe("Sửa lỗi seed data", () => {
  test("Mã department khởi nghiệp đã chuẩn hóa (không còn 'TT_K khởi nghiệp')", async () => {
    const res = await api("GET", "/api/departments", { token: adminToken });
    assert.equal(res.status, 200);
    const startup = res.body.find((d: any) => d.id === "d-startup");
    assert.ok(startup, "phải có department khởi nghiệp");
    assert.ok(
      !startup.code.includes(" "),
      `mã department không được chứa khoảng trắng, nhận: "${startup.code}"`
    );
    assert.equal(startup.code, "TT_DMST_KN");
  });
});

describe("CRUD cơ bản hoạt động end-to-end", () => {
  test("Tạo -> lấy chi tiết -> cập nhật -> xóa doanh nghiệp", async () => {
    // Tạo
    const created = await api("POST", "/api/enterprises", {
      token: adminToken,
      body: { code: "DN-E2E", name: "DN E2E", field: "CNTT" },
    });
    assert.equal(created.status, 201);
    const id = created.body.id;

    // Lấy chi tiết
    const detail = await api("GET", `/api/enterprises/${id}`, { token: adminToken });
    assert.equal(detail.status, 200);
    assert.equal(detail.body.code, "DN-E2E");

    // Cập nhật
    const updated = await api("PUT", `/api/enterprises/${id}`, {
      token: adminToken,
      body: { name: "DN E2E Đã Sửa", field: "CNTT" },
    });
    assert.equal(updated.status, 200);
    assert.equal(updated.body.name, "DN E2E Đã Sửa");

    // Xóa
    const deleted = await api("DELETE", `/api/enterprises/${id}`, { token: adminToken });
    assert.equal(deleted.status, 200);

    // Sau khi xóa mềm, không lấy được nữa.
    const afterDelete = await api("GET", `/api/enterprises/${id}`, { token: adminToken });
    assert.equal(afterDelete.status, 404);
  });

  test("Không tạo được doanh nghiệp trùng mã", async () => {
    await api("POST", "/api/enterprises", {
      token: adminToken,
      body: { code: "DN-DUP", name: "DN Dup 1", field: "CNTT" },
    });
    const dup = await api("POST", "/api/enterprises", {
      token: adminToken,
      body: { code: "DN-DUP", name: "DN Dup 2", field: "CNTT" },
    });
    assert.equal(dup.status, 400, "mã trùng phải bị từ chối");
  });
});

describe("CRUD Job / Event - cột NOT NULL không được nhận null", () => {
  // Hồi quy: PUT /api/jobs/:id từng trả 500 vì updateJob truyền null xuống
  // cột description/salary (schema khai NOT NULL). Lỗi chỉ lộ khi UI có chức năng
  // sửa tin tuyển dụng, nên trước đó không ai chạm tới.
  test("Sửa tin tuyển dụng với description/salary = null vẫn thành công (không 500)", async () => {
    const ents = await api("GET", "/api/enterprises", { token: adminToken });
    assert.equal(ents.status, 200);
    const enterpriseId = ents.body[0].id;

    const created = await api("POST", "/api/jobs", {
      token: adminToken,
      body: {
        enterpriseId,
        title: "Job kiểm thử NOT NULL",
        majors: "Công nghệ thông tin",
        dateDeadline: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
      },
    });
    assert.equal(created.status, 201, "tạo job phải thành công");
    const jobId = created.body.id;

    const updated = await api("PUT", `/api/jobs/${jobId}`, {
      token: adminToken,
      body: {
        title: "Job kiểm thử NOT NULL (đã sửa)",
        description: null,
        salary: null,
        requirements: null,
        location: null,
        contactName: null,
        contactEmail: null,
        contactPhone: null,
      },
    });
    assert.equal(updated.status, 200, `PUT phải trả 200, nhận ${updated.status}: ${JSON.stringify(updated.body).slice(0, 200)}`);
    assert.equal(updated.body.title, "Job kiểm thử NOT NULL (đã sửa)");
    // null được quy về chuỗi rỗng, không phải null.
    assert.notEqual(updated.body.description, null, "description không được là null");
    assert.notEqual(updated.body.salary, null, "salary không được là null");

    const deleted = await api("DELETE", `/api/jobs/${jobId}`, { token: adminToken });
    assert.equal(deleted.status, 200);
  });

  test("Sửa sự kiện: location = null bị Zod chặn 400, không lọt xuống Prisma thành 500", async () => {
    const created = await api("POST", "/api/events", {
      token: adminToken,
      body: {
        title: "Sự kiện kiểm thử NOT NULL",
        type: "WORKSHOP",
        date: new Date(Date.now() + 10 * 24 * 3600 * 1000).toISOString(),
        location: "Hội trường A",
      },
    });
    assert.equal(created.status, 201, "tạo sự kiện phải thành công");
    const eventId = created.body.id;

    // location là trường bắt buộc: gửi null phải nhận 400 kèm thông báo rõ ràng,
    // KHÔNG được là 500 (lỗi Prisma lộ ra ngoài).
    const invalid = await api("PUT", `/api/events/${eventId}`, {
      token: adminToken,
      body: { title: "Sự kiện kiểm thử (sai)", location: null },
    });
    assert.equal(invalid.status, 400, `phải trả 400, nhận ${invalid.status}`);
    assert.match(String(invalid.body.message), /Địa điểm/, "thông báo lỗi phải nói rõ trường sai");

    // Bỏ hẳn location (không gửi) thì hợp lệ vì schema update là partial.
    const updated = await api("PUT", `/api/events/${eventId}`, {
      token: adminToken,
      body: { title: "Sự kiện kiểm thử NOT NULL (đã sửa)", description: null },
    });
    assert.equal(updated.status, 200, `PUT phải trả 200, nhận ${updated.status}`);
    assert.equal(updated.body.title, "Sự kiện kiểm thử NOT NULL (đã sửa)");
    assert.notEqual(updated.body.location, null, "location cũ phải được giữ nguyên");

    const deleted = await api("DELETE", `/api/events/${eventId}`, { token: adminToken });
    assert.equal(deleted.status, 200);
  });
});

describe("Cập nhật một phần (partial update) không được phá dữ liệu sẵn có", () => {
  // Hồi quy: route PUT /api/events/:id từng chuyển `undefined` thành `[]` cho
  // enterpriseIds/departmentIds, nên một lần PUT chỉ đổi status sẽ xoá sạch
  // quan hệ DN/đơn vị đã liên kết. Tương tự budget bị ép về null.
  test("PUT sự kiện chỉ đổi status: giữ nguyên DN, đơn vị và ngân sách", async () => {
    const ents = await api("GET", "/api/enterprises", { token: adminToken });
    const depts = await api("GET", "/api/departments", { token: adminToken });
    assert.equal(ents.status, 200);
    assert.equal(depts.status, 200);

    const created = await api("POST", "/api/events", {
      token: adminToken,
      body: {
        title: "Sự kiện kiểm thử partial update",
        type: "WORKSHOP",
        date: new Date(Date.now() + 20 * 24 * 3600 * 1000).toISOString(),
        location: "Hội trường B",
        budget: 5000000,
        enterpriseIds: [ents.body[0].id],
        departmentIds: [depts.body[0].id],
      },
    });
    assert.equal(created.status, 201);
    assert.equal(created.body.enterpriseIds.length, 1, "tạo phải lưu DN liên kết");
    assert.equal(created.body.budget, 5000000);

    // Chỉ gửi status - KHÔNG gửi enterpriseIds/departmentIds/budget.
    const updated = await api("PUT", `/api/events/${created.body.id}`, {
      token: adminToken,
      body: { status: "ONGOING" },
    });
    assert.equal(updated.status, 200);
    assert.equal(updated.body.status, "ONGOING");
    assert.equal(updated.body.enterpriseIds.length, 1, "DN liên kết KHÔNG được bị xoá");
    assert.equal(updated.body.departmentIds.length, 1, "đơn vị liên kết KHÔNG được bị xoá");
    assert.equal(updated.body.budget, 5000000, "ngân sách KHÔNG được bị xoá về null");

    await api("DELETE", `/api/events/${created.body.id}`, { token: adminToken });
  });

  test("DELETE với id không tồn tại => 404, không báo thành công giả", async () => {
    const job = await api("DELETE", "/api/jobs/khong-ton-tai-xyz", { token: adminToken });
    assert.equal(job.status, 404, "xóa tin không tồn tại phải là 404");

    const ev = await api("DELETE", "/api/events/khong-ton-tai-xyz", { token: adminToken });
    assert.equal(ev.status, 404, "xóa sự kiện không tồn tại phải là 404");
  });
});

describe("Quyền sở hữu thông báo (chống IDOR)", () => {
  // Hồi quy: POST /api/notifications/:id/read trước đây chỉ có requireAuth và
  // update theo id trần, nên bất kỳ ai biết ID đều đánh dấu đã đọc thông báo của
  // người khác => họ mất cảnh báo MOU sắp hết hạn mà không biết.
  test("Không đánh dấu đã đọc được thông báo của người khác => 404", async () => {
    const users = await api("GET", "/api/users", { token: adminToken });
    const other = users.body.find((u: any) => u.email !== SEED.adminEmail && u.isActive);
    assert.ok(other, "cần ít nhất một user khác đang hoạt động");

    // Tạo thông báo thuộc user khác (không phải admin đang gọi).
    const { dbService } = await import("../db.ts");
    const notif = await dbService.createNotification({
      userId: other.id,
      title: "Thông báo riêng của người khác",
      content: "Không ai khác được đánh dấu đã đọc.",
      type: "SYSTEM",
      link: null,
    });

    // Admin (không phải chủ sở hữu) cố đánh dấu đã đọc.
    const res = await api("POST", `/api/notifications/${notif.id}/read`, { token: adminToken });
    assert.equal(res.status, 404, "người không sở hữu phải nhận 404");

    // Kiểm chứng thông báo VẪN chưa đọc.
    const after = await dbService.getNotifications(other.id);
    const found = after.find((n) => n.id === notif.id);
    assert.ok(found, "thông báo phải còn tồn tại");
    assert.equal(found!.isRead, false, "thông báo KHÔNG được bị đánh dấu đã đọc");
  });

  test("Chủ sở hữu VẪN đánh dấu đã đọc được thông báo của mình", async () => {
    const { dbService } = await import("../db.ts");
    const me = await api("GET", "/api/auth/me", { token: adminToken });
    assert.equal(me.status, 200);

    const notif = await dbService.createNotification({
      userId: me.body.id,
      title: "Thông báo của chính mình",
      content: "Chủ sở hữu đánh dấu được.",
      type: "SYSTEM",
      link: null,
    });

    const res = await api("POST", `/api/notifications/${notif.id}/read`, { token: adminToken });
    assert.equal(res.status, 200, "chủ sở hữu phải đánh dấu được");

    const after = await dbService.getNotifications(me.body.id);
    assert.equal(after.find((n) => n.id === notif.id)!.isRead, true);
  });
});
