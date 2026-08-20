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

describe("Quyền sở hữu công việc (task)", () => {
  // Hồi quy: PUT/DELETE /api/tasks/:id trước đây chỉ có requireAuth, nên bất kỳ ai
  // đăng nhập biết ID đều sửa/xóa được công việc của người khác (dù GET đã lọc
  // theo assignee). Giờ chỉ assignee / creator / quản lý mới được thao tác.
  //
  // Login MỘT LẦN rồi dùng lại token: route login có rate-limit, gọi lại nhiều lần
  // trong cùng suite sẽ bị chặn 429 và làm test đỏ oan.
  let adminToken = "";
  let leaderToken = "";
  let staffToken = "";
  let staffId = "";

  before(async () => {
    adminToken = await login(SEED.adminEmail);
    leaderToken = await login(SEED.leaderEmail);
    staffToken = await login(SEED.staffEmail);
    const users = await api("GET", "/api/users", { token: adminToken });
    assert.equal(users.status, 200);
    staffId = users.body.find((u: any) => u.email === SEED.staffEmail).id;
    assert.ok(staffId, "phải tìm được chuyên viên trong seed");
  });

  const createTaskForStaff = async (title: string) => {
    const created = await api("POST", "/api/tasks", {
      token: adminToken,
      body: {
        title,
        dueDate: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString(),
        assigneeId: staffId,
      },
    });
    assert.equal(created.status, 201, "tạo công việc phải thành công");
    return created.body.id as string;
  };

  test("Cán bộ khác KHÔNG sửa/xóa được công việc không thuộc mình => 403", async () => {
    const taskId = await createTaskForStaff("Việc riêng của chuyên viên");

    // Lãnh đạo không phải assignee, không phải creator, không có manage_users => 403.
    const forbiddenUpdate = await api("PUT", `/api/tasks/${taskId}`, {
      token: leaderToken,
      body: { status: "COMPLETED" },
    });
    assert.equal(forbiddenUpdate.status, 403, "người ngoài không được sửa");
    assert.match(String(forbiddenUpdate.body.message), /phụ trách|quản lý/i);

    const forbiddenDelete = await api("DELETE", `/api/tasks/${taskId}`, { token: leaderToken });
    assert.equal(forbiddenDelete.status, 403, "người ngoài không được xóa");

    // Việc vẫn còn nguyên sau khi bị chặn.
    const stillThere = await api("GET", "/api/tasks", { token: adminToken });
    assert.ok(stillThere.body.some((t: any) => t.id === taskId), "công việc không được bị xóa");

    await api("DELETE", `/api/tasks/${taskId}`, { token: adminToken });
  });

  test("Cán bộ được gán việc VẪN sửa và xóa được công việc của mình", async () => {
    const taskId = await createTaskForStaff("Việc chuyên viên tự cập nhật");

    const updated = await api("PUT", `/api/tasks/${taskId}`, {
      token: staffToken,
      body: { status: "COMPLETED" },
    });
    assert.equal(updated.status, 200, "assignee phải sửa được việc của mình");
    assert.equal(updated.body.status, "COMPLETED");

    const deleted = await api("DELETE", `/api/tasks/${taskId}`, { token: staffToken });
    assert.equal(deleted.status, 200, "assignee phải xóa được việc của mình");
  });

  test("Assignee KHÔNG tự chuyển việc sang người khác => 403", async () => {
    const taskId = await createTaskForStaff("Việc thử đổi cán bộ phụ trách");

    // Assignee (staff) cố đổi assigneeId sang người khác. Nếu cho phép, chính họ
    // sẽ mất quyền vào task vừa sửa (không còn assignee, không phải creator)
    // và task biến khỏi danh sách của họ - không có đường tự khôi phục.
    const users = await api("GET", "/api/users", { token: adminToken });
    const other = users.body.find((u: any) => u.email === SEED.leaderEmail);
    assert.ok(other, "cần tìm được một user khác");

    const res = await api("PUT", `/api/tasks/${taskId}`, {
      token: staffToken,
      body: { assigneeId: other.id },
    });
    assert.equal(res.status, 403, "assignee không được tự chuyển việc");
    assert.match(String(res.body.message), /người giao việc|quản lý/i);

    // Assignee VẪN sửa được các trường khác của chính task đó.
    const okUpdate = await api("PUT", `/api/tasks/${taskId}`, {
      token: staffToken,
      body: { status: "IN_PROGRESS" },
    });
    assert.equal(okUpdate.status, 200, "assignee vẫn phải cập nhật được tiến độ");
    assert.equal(okUpdate.body.assigneeId, staffId, "cán bộ phụ trách không đổi");

    await api("DELETE", `/api/tasks/${taskId}`, { token: adminToken });
  });

  test("Người giao việc (creator) VẪN chuyển được việc sang người khác", async () => {
    const taskId = await createTaskForStaff("Việc admin chuyển cho người khác");
    const users = await api("GET", "/api/users", { token: adminToken });
    const other = users.body.find((u: any) => u.email === SEED.leaderEmail);

    // adminToken vừa là creator vừa là quản lý -> phải được đổi.
    const res = await api("PUT", `/api/tasks/${taskId}`, {
      token: adminToken,
      body: { assigneeId: other.id },
    });
    assert.equal(res.status, 200, "creator/quản lý phải chuyển việc được");
    assert.equal(res.body.assigneeId, other.id);

    await api("DELETE", `/api/tasks/${taskId}`, { token: adminToken });
  });

  test("Admin (quản lý) sửa được công việc của người khác", async () => {
    const taskId = await createTaskForStaff("Việc admin điều phối");

    const updated = await api("PUT", `/api/tasks/${taskId}`, {
      token: adminToken,
      body: { priority: "HIGH" },
    });
    assert.equal(updated.status, 200, "admin phải điều phối được việc của cán bộ");
    assert.equal(updated.body.priority, "HIGH");

    await api("DELETE", `/api/tasks/${taskId}`, { token: adminToken });
  });
});
