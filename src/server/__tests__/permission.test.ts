// Test phân quyền (RBAC) đã được gắn vào API.
import { test, before, after, describe } from "node:test";
import assert from "node:assert/strict";
import { startTestServer, stopTestServer, api, login, SEED } from "./helpers.ts";

before(async () => {
  await startTestServer();
});
after(async () => {
  await stopTestServer();
});

describe("Phân quyền được enforce trên API", () => {
  test("Lãnh đạo (chỉ xem) KHÔNG tạo được doanh nghiệp => 403", async () => {
    const token = await login(SEED.leaderEmail);
    const res = await api("POST", "/api/enterprises", {
      token,
      body: { code: "DN-TEST-LEADER", name: "DN Test Leader", field: "CNTT" },
    });
    assert.equal(res.status, 403, "leader không có quyền create_enterprise");
    assert.match(res.body.message, /không có quyền/i);
  });

  test("Lãnh đạo KHÔNG xóa được doanh nghiệp => 403", async () => {
    const token = await login(SEED.leaderEmail);
    const res = await api("DELETE", "/api/enterprises/e-fpt", { token });
    assert.equal(res.status, 403);
  });

  test("Lãnh đạo VẪN xem được danh sách doanh nghiệp (có view_all)", async () => {
    const token = await login(SEED.leaderEmail);
    const res = await api("GET", "/api/enterprises", { token });
    assert.equal(res.status, 200);
  });

  test("Chuyên viên QHDN tạo được doanh nghiệp (có create_enterprise)", async () => {
    const token = await login(SEED.staffEmail);
    const res = await api("POST", "/api/enterprises", {
      token,
      body: { code: "DN-STAFF-1", name: "DN Staff Tạo", field: "CNTT" },
    });
    assert.equal(res.status, 201);
    assert.equal(res.body.code, "DN-STAFF-1");
  });

  test("Chuyên viên QHDN KHÔNG xóa được doanh nghiệp (thiếu delete_enterprise) => 403", async () => {
    const token = await login(SEED.staffEmail);
    const res = await api("DELETE", "/api/enterprises/e-viettel", { token });
    assert.equal(res.status, 403, "staff không có quyền delete_enterprise");
  });

  test("Super Admin xóa được doanh nghiệp (bypass mọi quyền)", async () => {
    const token = await login(SEED.adminEmail);
    // Tạo trước rồi xóa để không phá dữ liệu seed dùng cho test khác.
    const created = await api("POST", "/api/enterprises", {
      token,
      body: { code: "DN-ADMIN-DEL", name: "DN Admin Xóa", field: "CNTT" },
    });
    assert.equal(created.status, 201);
    const res = await api("DELETE", `/api/enterprises/${created.body.id}`, { token });
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
  });

  test("Lãnh đạo KHÔNG tạo được MOU => 403", async () => {
    const token = await login(SEED.leaderEmail);
    const res = await api("POST", "/api/mous", {
      token,
      body: {
        code: "MOU-LEADER-TEST",
        enterpriseId: "e-fpt",
        departmentId: "d-qhdn",
        expiryDate: new Date(Date.now() + 86400000).toISOString(),
      },
    });
    assert.equal(res.status, 403);
  });

  test("Dashboard yêu cầu quyền view_dashboard - admin xem được", async () => {
    const token = await login(SEED.adminEmail);
    const res = await api("GET", "/api/dashboard/stats", { token });
    assert.equal(res.status, 200);
    assert.equal(typeof res.body.totalEnterprises, "number");
  });
});
