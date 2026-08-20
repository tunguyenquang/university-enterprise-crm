// Test validation đầu vào bằng Zod.
import { test, before, after, describe } from "node:test";
import assert from "node:assert/strict";
import { startTestServer, stopTestServer, api, login, SEED } from "./helpers.ts";

let adminToken = "";

before(async () => {
  await startTestServer();
  adminToken = await login(SEED.adminEmail);
});
after(async () => {
  await stopTestServer();
});

describe("Validation dữ liệu đầu vào", () => {
  test("Login thiếu password => 400 (Zod chặn trước khi vào logic)", async () => {
    const res = await api("POST", "/api/auth/login", { body: { email: SEED.adminEmail } });
    assert.equal(res.status, 400);
  });

  test("Login email sai định dạng => 400", async () => {
    const res = await api("POST", "/api/auth/login", {
      body: { email: "khong-phai-email", password: "x" },
    });
    assert.equal(res.status, 400);
  });

  test("Tạo doanh nghiệp thiếu trường bắt buộc (name) => 400 kèm thông báo", async () => {
    const res = await api("POST", "/api/enterprises", {
      token: adminToken,
      body: { code: "DN-NO-NAME", field: "CNTT" },
    });
    assert.equal(res.status, 400);
    assert.ok(res.body.message, "phải có thông báo lỗi");
  });

  test("Tạo doanh nghiệp với website không hợp lệ => 400", async () => {
    const res = await api("POST", "/api/enterprises", {
      token: adminToken,
      body: { code: "DN-BAD-URL", name: "DN URL Sai", field: "CNTT", website: "không-phải-url" },
    });
    assert.equal(res.status, 400);
  });

  test("Tạo contact với email sai định dạng => 400", async () => {
    const res = await api("POST", "/api/contacts", {
      token: adminToken,
      body: {
        enterpriseId: "e-fpt",
        name: "Người Test",
        position: "Test",
        email: "email-sai",
      },
    });
    assert.equal(res.status, 400);
  });

  test("Tạo sự kiện với ngân sách âm => 400", async () => {
    const res = await api("POST", "/api/events", {
      token: adminToken,
      body: {
        title: "Sự kiện ngân sách âm",
        type: "WORKSHOP",
        date: new Date().toISOString(),
        location: "Hội trường",
        budget: -5000,
      },
    });
    assert.equal(res.status, 400);
  });

  test("Tạo MOU với ngày hết hạn không hợp lệ => 400", async () => {
    const res = await api("POST", "/api/mous", {
      token: adminToken,
      body: {
        code: "MOU-BAD-DATE",
        enterpriseId: "e-fpt",
        departmentId: "d-qhdn",
        expiryDate: "không phải ngày",
      },
    });
    assert.equal(res.status, 400);
  });

  test("Tạo job với enum type không hợp lệ => 400", async () => {
    const res = await api("POST", "/api/jobs", {
      token: adminToken,
      body: {
        title: "Việc test",
        enterpriseId: "e-fpt",
        majors: "CNTT",
        dateDeadline: new Date().toISOString(),
        type: "LOAI_KHONG_TON_TAI",
      },
    });
    assert.equal(res.status, 400);
  });

  test("Dữ liệu hợp lệ được chấp nhận (tạo contact)", async () => {
    const res = await api("POST", "/api/contacts", {
      token: adminToken,
      body: {
        enterpriseId: "e-fpt",
        name: "Người Hợp Lệ",
        position: "Trưởng phòng",
        email: "hople@example.com",
      },
    });
    assert.equal(res.status, 201);
    assert.equal(res.body.name, "Người Hợp Lệ");
  });

  test("Endpoint API không tồn tại => 404 JSON (không phải HTML)", async () => {
    const res = await api("GET", "/api/khong-ton-tai", { token: adminToken });
    assert.equal(res.status, 404);
    assert.ok(res.body.message, "trả về thông báo JSON");
  });
});
