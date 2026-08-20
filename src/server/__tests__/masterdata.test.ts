// Test CRUD Master data (#6) và Upload file MOU (#7).
import { test, before, after, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import { startTestServer, stopTestServer, api, login, SEED } from "./helpers.ts";

let adminToken = "";
let leaderToken = "";
const baseUrlHolder: { url: string } = { url: "" };

before(async () => {
  baseUrlHolder.url = await startTestServer();
  adminToken = await login(SEED.adminEmail);
  leaderToken = await login(SEED.leaderEmail);
});
after(async () => {
  await stopTestServer();
});

describe("CRUD Master data - Departments", () => {
  let deptId = "";

  test("Admin tạo được department mới", async () => {
    const res = await api("POST", "/api/departments", {
      token: adminToken,
      body: { name: "Khoa Cơ khí", code: "K_CK", type: "KHOA" },
    });
    assert.equal(res.status, 201);
    assert.equal(res.body.code, "K_CK");
    deptId = res.body.id;
  });

  test("Không tạo được department trùng mã", async () => {
    const res = await api("POST", "/api/departments", {
      token: adminToken,
      body: { name: "Khoa Cơ khí 2", code: "K_CK", type: "KHOA" },
    });
    assert.equal(res.status, 400);
  });

  test("Cập nhật được tên department", async () => {
    const res = await api("PUT", `/api/departments/${deptId}`, {
      token: adminToken,
      body: { name: "Khoa Cơ khí Chế tạo máy" },
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.name, "Khoa Cơ khí Chế tạo máy");
  });

  test("Lãnh đạo KHÔNG tạo được department (thiếu manage_master_data) => 403", async () => {
    const res = await api("POST", "/api/departments", {
      token: leaderToken,
      body: { name: "Khoa X", code: "K_X", type: "KHOA" },
    });
    assert.equal(res.status, 403);
  });

  test("Xóa được department không bị tham chiếu", async () => {
    const res = await api("DELETE", `/api/departments/${deptId}`, { token: adminToken });
    assert.equal(res.status, 200);
  });

  test("KHÔNG xóa được department đang được sử dụng (d-qhdn có user/MOU)", async () => {
    const res = await api("DELETE", "/api/departments/d-qhdn", { token: adminToken });
    assert.equal(res.status, 400, "department đang dùng phải bị chặn xóa");
  });

  test("Validation: tạo department thiếu code => 400", async () => {
    const res = await api("POST", "/api/departments", {
      token: adminToken,
      body: { name: "Khoa thiếu mã", type: "KHOA" },
    });
    assert.equal(res.status, 400);
  });
});

describe("CRUD Master data - Users", () => {
  let newUserId = "";

  test("Admin tạo được user mới", async () => {
    const res = await api("POST", "/api/users", {
      token: adminToken,
      body: {
        email: "nhanvien.moi@hust.edu.vn",
        fullName: "Nhân Viên Mới",
        roleId: "r-qhdn-staff",
        password: "MatKhauMoi123",
        departmentId: "d-qhdn",
      },
    });
    assert.equal(res.status, 201);
    assert.equal(res.body.email, "nhanvien.moi@hust.edu.vn");
    newUserId = res.body.id;
    // Không được lộ mật khẩu/hash trong response.
    assert.ok(!("password" in res.body), "không trả password");
  });

  test("User mới đăng nhập được với mật khẩu vừa tạo", async () => {
    const res = await api("POST", "/api/auth/login", {
      body: { email: "nhanvien.moi@hust.edu.vn", password: "MatKhauMoi123" },
    });
    assert.equal(res.status, 200);
    assert.ok(res.body.token);
  });

  test("Không tạo user trùng email => 400", async () => {
    const res = await api("POST", "/api/users", {
      token: adminToken,
      body: {
        email: "nhanvien.moi@hust.edu.vn",
        fullName: "Trùng",
        roleId: "r-qhdn-staff",
        password: "MatKhau12345",
      },
    });
    assert.equal(res.status, 400);
  });

  test("Validation: mật khẩu quá ngắn => 400", async () => {
    const res = await api("POST", "/api/users", {
      token: adminToken,
      body: { email: "x@y.com", fullName: "X", roleId: "r-qhdn-staff", password: "123" },
    });
    assert.equal(res.status, 400);
  });

  test("Cập nhật user: đổi vai trò + đặt lại mật khẩu", async () => {
    const res = await api("PUT", `/api/users/${newUserId}`, {
      token: adminToken,
      body: { roleId: "r-qhdn-mgr", password: "MatKhauKhac999" },
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.roleId, "r-qhdn-mgr");

    // Đăng nhập với mật khẩu mới.
    const loginRes = await api("POST", "/api/auth/login", {
      body: { email: "nhanvien.moi@hust.edu.vn", password: "MatKhauKhac999" },
    });
    assert.equal(loginRes.status, 200);
  });

  test("Vô hiệu hóa user => user không đăng nhập được nữa", async () => {
    const del = await api("DELETE", `/api/users/${newUserId}`, { token: adminToken });
    assert.equal(del.status, 200);

    const loginRes = await api("POST", "/api/auth/login", {
      body: { email: "nhanvien.moi@hust.edu.vn", password: "MatKhauKhac999" },
    });
    assert.equal(loginRes.status, 400, "tài khoản bị khóa không đăng nhập được");
  });

  test("Admin KHÔNG tự vô hiệu hóa chính mình => 400", async () => {
    const me = await api("GET", "/api/auth/me", { token: adminToken });
    const res = await api("DELETE", `/api/users/${me.body.id}`, { token: adminToken });
    assert.equal(res.status, 400);
  });

  test("Lãnh đạo KHÔNG tạo được user (thiếu manage_users) => 403", async () => {
    const res = await api("POST", "/api/users", {
      token: leaderToken,
      body: { email: "z@z.com", fullName: "Z", roleId: "r-qhdn-staff", password: "MatKhau12345" },
    });
    assert.equal(res.status, 403);
  });
});

describe("Upload file cho MOU (#7)", () => {
  test("Upload PDF hợp lệ trả về fileUrl + file được lưu", async () => {
    const form = new FormData();
    const pdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]); // "%PDF-"
    form.append("file", new Blob([pdfBytes], { type: "application/pdf" }), "mou-test.pdf");

    const res = await fetch(`${baseUrlHolder.url}/api/mous/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: form,
    });
    const body = await res.json();
    assert.equal(res.status, 201);
    assert.match(body.fileUrl, /^\/files\/mou-/);

    // File thật tồn tại trên đĩa.
    const { UPLOAD_DIR } = await import("../upload.ts");
    const filePath = path.join(UPLOAD_DIR, path.basename(body.fileUrl));
    assert.ok(fs.existsSync(filePath), "file phải được lưu vào uploads/");

    // Phục vụ lại được qua /files.
    const fetchFile = await fetch(`${baseUrlHolder.url}${body.fileUrl}`);
    assert.equal(fetchFile.status, 200);
  });

  test("Upload loại file không cho phép (exe) => 400", async () => {
    const form = new FormData();
    form.append("file", new Blob([new Uint8Array([1, 2, 3])], { type: "application/x-msdownload" }), "virus.exe");

    const res = await fetch(`${baseUrlHolder.url}/api/mous/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: form,
    });
    assert.equal(res.status, 400);
  });

  test("Upload không kèm file => 400", async () => {
    const form = new FormData();
    const res = await fetch(`${baseUrlHolder.url}/api/mous/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: form,
    });
    assert.equal(res.status, 400);
  });

  test("Lãnh đạo KHÔNG upload được (thiếu manage_mou) => 403", async () => {
    const form = new FormData();
    const pdf = new Uint8Array([0x25, 0x50, 0x44, 0x46]);
    form.append("file", new Blob([pdf], { type: "application/pdf" }), "x.pdf");
    const res = await fetch(`${baseUrlHolder.url}/api/mous/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${leaderToken}` },
      body: form,
    });
    assert.equal(res.status, 403);
  });
});
