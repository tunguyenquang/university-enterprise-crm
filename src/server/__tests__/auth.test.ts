// Test xác thực: bcrypt, JWT, đăng nhập, bảo vệ route.
import { test, before, after, describe } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { startTestServer, stopTestServer, api, login, SEED } from "./helpers.ts";

before(async () => {
  await startTestServer();
});
after(async () => {
  await stopTestServer();
});

describe("Đăng nhập & JWT", () => {
  test("Đăng nhập đúng mật khẩu trả về JWT hợp lệ", async () => {
    const res = await api("POST", "/api/auth/login", {
      body: { email: SEED.adminEmail, password: SEED.password },
    });
    assert.equal(res.status, 200);
    assert.ok(res.body.token, "phải có token");
    assert.equal(res.body.user.email, SEED.adminEmail);
    assert.ok(Array.isArray(res.body.user.permissions), "user phải kèm permissions");

    // Token phải là JWT thật (3 phần ngăn cách bởi dấu chấm), không phải "token-<id>-<ts>".
    const parts = res.body.token.split(".");
    assert.equal(parts.length, 3, "JWT phải có 3 phần");
    assert.ok(!res.body.token.startsWith("token-"), "không được là token tự chế cũ");
  });

  test("JWT giải mã ra đúng userId và có hạn (exp)", async () => {
    const token = await login(SEED.adminEmail);
    const decoded = jwt.decode(token) as any;
    assert.ok(decoded.sub, "phải có sub (userId)");
    assert.ok(decoded.exp, "JWT phải có thời điểm hết hạn (exp)");
    assert.ok(decoded.exp > Math.floor(Date.now() / 1000), "exp phải ở tương lai");
  });

  test("Đăng nhập sai mật khẩu bị từ chối", async () => {
    const res = await api("POST", "/api/auth/login", {
      body: { email: SEED.adminEmail, password: "sai-mat-khau" },
    });
    assert.equal(res.status, 400);
  });

  test("Mật khẩu chung 'Password123' (cũ, không có '!') KHÔNG còn dùng được", async () => {
    const res = await api("POST", "/api/auth/login", {
      body: { email: SEED.adminEmail, password: "Password123" },
    });
    assert.equal(res.status, 400, "mật khẩu cũ không khớp bcrypt hash mới");
  });

  test("Email không tồn tại bị từ chối", async () => {
    const res = await api("POST", "/api/auth/login", {
      body: { email: "khongtontai@x.com", password: SEED.password },
    });
    assert.equal(res.status, 400);
  });
});

describe("Bảo vệ route bằng JWT", () => {
  test("Không có token => 401", async () => {
    const res = await api("GET", "/api/enterprises");
    assert.equal(res.status, 401);
  });

  test("Token tự chế kiểu cũ 'token-u-admin-123' bị từ chối (không có chữ ký)", async () => {
    const res = await api("GET", "/api/enterprises", { token: "token-u-admin-123456789" });
    assert.equal(res.status, 401, "token giả mạo phải bị chặn");
  });

  test("Token sai chữ ký bị từ chối", async () => {
    const fakeToken = jwt.sign({ sub: "u-admin" }, "secret-gia-mao", { expiresIn: "1h" });
    const res = await api("GET", "/api/enterprises", { token: fakeToken });
    assert.equal(res.status, 401, "JWT ký bằng secret khác phải bị chặn");
  });

  test("Token hết hạn bị từ chối", async () => {
    const expired = jwt.sign(
      { sub: "u-admin" },
      process.env.JWT_SECRET!,
      { expiresIn: "-1h" }
    );
    const res = await api("GET", "/api/enterprises", { token: expired });
    assert.equal(res.status, 401, "JWT hết hạn phải bị chặn");
  });

  test("Token hợp lệ truy cập được", async () => {
    const token = await login(SEED.adminEmail);
    const res = await api("GET", "/api/enterprises", { token });
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body));
  });

  test("/api/auth/me trả về user hiện tại từ token", async () => {
    const token = await login(SEED.staffEmail);
    const res = await api("GET", "/api/auth/me", { token });
    assert.equal(res.status, 200);
    assert.equal(res.body.email, SEED.staffEmail);
  });
});
