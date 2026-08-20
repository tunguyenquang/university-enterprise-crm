// ==========================================
// AUTHENTICATION & AUTHORIZATION
// ==========================================
// Thay token tự chế "token-<id>-<ts>" bằng JWT có chữ ký + hạn dùng.
// JWT không thể bị giả mạo nếu không có JWT_SECRET, và tự hết hạn sau thời gian cấu hình.

import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { config } from "./config.ts";
import { dbService } from "./db.ts";
import { RoleCode, User } from "../types/crm.ts";

export interface JwtPayload {
  sub: string; // userId
  email: string;
  roleId: string;
}

// Mở rộng Request để gắn user đã xác thực.
export interface AuthenticatedRequest extends Request {
  user?: User;
}

// Tạo JWT cho user sau khi đăng nhập thành công.
export function signToken(user: User): string {
  const payload: JwtPayload = {
    sub: user.id,
    email: user.email,
    roleId: user.roleId,
  };
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn as jwt.SignOptions["expiresIn"],
  });
}

// Giải mã & xác thực JWT, trả về user nếu hợp lệ và còn active.
export async function verifyToken(authHeader?: string): Promise<User | null> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const raw = authHeader.substring(7).trim();
  if (!raw) return null;

  try {
    const decoded = jwt.verify(raw, config.jwt.secret) as JwtPayload;
    const user = await dbService.getUserById(decoded.sub);
    return user && user.isActive ? user : null;
  } catch {
    // Token sai chữ ký, hết hạn, hoặc hỏng định dạng
    return null;
  }
}

// Middleware: yêu cầu đã đăng nhập (có JWT hợp lệ).
export const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  verifyToken(req.headers.authorization)
    .then((user) => {
      if (!user) {
        return res.status(401).json({ message: "Không có quyền truy cập, vui lòng đăng nhập" });
      }
      req.user = user;
      next();
    })
    .catch(next);
};

// Middleware: yêu cầu một quyền cụ thể (RBAC). Super Admin bỏ qua mọi kiểm tra.
export const requirePermission = (permissionCode: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Vui lòng đăng nhập" });
    }

    dbService
      .getRoles()
      .then((roles) => {
        const role = roles.find((r) => r.id === req.user!.roleId);
        if (role?.code === RoleCode.SUPER_ADMIN) {
          return next();
        }
        const permissions = dbService.getPermissionsForRole(req.user!.roleId);
        if (!permissions.includes(permissionCode)) {
          return res.status(403).json({ message: `Tài khoản không có quyền: ${permissionCode}` });
        }
        next();
      })
      .catch(next);
  };
};
