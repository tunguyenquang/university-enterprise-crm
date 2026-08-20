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
