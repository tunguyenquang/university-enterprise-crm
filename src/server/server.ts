import express, { Request, Response, NextFunction } from "express";
import path from "path";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { createServer as createViteServer } from "vite";
import { config } from "./config.ts";
import { logger } from "./logger.ts";
import { dbService } from "./db.ts";
import { signToken, requireAuth, requirePermission, AuthenticatedRequest } from "./auth.ts";
import { startMouExpiryCron } from "./cron.ts";
import { mouUpload, UPLOAD_DIR, deleteUploadedFile } from "./upload.ts";
import {
  validateBody,
  loginSchema,
  enterpriseCreateSchema,
  enterpriseUpdateSchema,
  contactCreateSchema,
  contactUpdateSchema,
  interactionCreateSchema,
  interactionUpdateSchema,
  mouCreateSchema,
  mouUpdateSchema,
  jobCreateSchema,
  jobUpdateSchema,
  eventCreateSchema,
  eventUpdateSchema,
  taskCreateSchema,
  taskUpdateSchema,
  departmentCreateSchema,
  departmentUpdateSchema,
  userCreateSchema,
  userUpdateSchema,
} from "./validation.ts";
import {
  EnterpriseStatus,
  EnterprisePriority,
  InteractionType,
  DocumentStatus,
  DocumentType,
  JobType,
  JobStatus,
  EventStatus,
  TaskStatus,
  TaskPriority,
} from "../types/crm.ts";

const app = express();
const PORT = config.port;

// ==========================================
// SECURITY & GLOBAL MIDDLEWARE
// ==========================================

// Helmet: thêm các HTTP header bảo mật (chống clickjacking, sniffing...).
// Tắt CSP ở dev vì Vite cần inline script cho HMR; production có thể bật chặt hơn.
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

// CORS: chỉ cho phép các origin được cấu hình. Rỗng = same-origin (không gắn CORS).
if (config.corsOrigins.length > 0) {
  app.use(cors({ origin: config.corsOrigins, credentials: true }));
}

app.use(express.json({ limit: "1mb" }));

// Phục vụ file đã upload (vd bản scan MOU) qua đường dẫn /files/<tên-file>.
app.use("/files", express.static(UPLOAD_DIR));

// Rate limit cho toàn bộ API: chặn lạm dụng / dò quét.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 1000, // mỗi IP tối đa 1000 request / 15 phút
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Bạn đã gửi quá nhiều yêu cầu, vui lòng thử lại sau." },
});
app.use("/api", apiLimiter);

// Rate limit chặt hơn cho đăng nhập: chống dò mật khẩu (brute-force).
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // tối đa 10 lần thử / 15 phút / IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Quá nhiều lần đăng nhập thất bại, vui lòng thử lại sau 15 phút." },
});

// Helper: lấy IP client an toàn cho audit log.
const clientIp = (req: Request) => req.ip || req.socket.remoteAddress || "127.0.0.1";

// Bọc handler async để mọi lỗi văng ra đều rơi vào error handler tập trung.
type AsyncHandler = (req: AuthenticatedRequest, res: Response, next: NextFunction) => unknown;
const wrap = (fn: AsyncHandler) => (req: Request, res: Response, next: NextFunction) =>
  Promise.resolve(fn(req as AuthenticatedRequest, res, next)).catch(next);

// ==========================================
// REST API ROUTER & ENDPOINTS
// ==========================================

// --- AUTHENTICATION ---
app.post("/api/auth/login", loginLimiter, validateBody(loginSchema), wrap(async (req, res) => {
  const { email, password } = req.body;

  const user = await dbService.getUserByEmail(email);
  if (!user || !user.isActive || !(await dbService.verifyUserPassword(email, password))) {
    return res.status(400).json({ message: "Email hoặc mật khẩu không chính xác" });
  }

  const roles = await dbService.getRoles();
  const departments = await dbService.getDepartments();
  const userRole = roles.find((r) => r.id === user.roleId);
  const userDept = departments.find((d) => d.id === user.departmentId);

  const token = signToken(user);
  const userPermissions = dbService.getPermissionsForRole(user.roleId);

  await dbService.createAuditLog({
    userId: user.id,
    action: "LOGIN",
    module: "AUTH",
    recordId: user.id,
    description: `Người dùng ${user.fullName} đăng nhập thành công.`,
    ipAddress: clientIp(req),
  });

  res.json({
    token,
    user: { ...user, role: userRole, department: userDept, permissions: userPermissions },
  });
}));

app.get("/api/auth/me", requireAuth, wrap(async (req, res) => {
  const user = req.user!;
  const roles = await dbService.getRoles();
  const departments = await dbService.getDepartments();
  const userRole = roles.find((r) => r.id === user.roleId);
  const userDept = departments.find((d) => d.id === user.departmentId);
  const userPermissions = dbService.getPermissionsForRole(user.roleId);

  res.json({ ...user, role: userRole, department: userDept, permissions: userPermissions });
}));

// --- ENTERPRISES DIRECTORY ---
app.get("/api/enterprises", requireAuth, wrap(async (req, res) => {
  const user = req.user!;
  const { search, status, priority, field, city } = req.query;

  let list = await dbService.getEnterprises();

  const userPermissions = dbService.getPermissionsForRole(user.roleId);
  const canViewAll = userPermissions.includes("view_all_enterprises");
  const canViewAssigned = userPermissions.includes("view_assigned_enterprises");

  if (!canViewAll && canViewAssigned) {
    if (user.departmentId) {
      list = list.filter((e) => e.picId === user.id || e.facultyIds?.includes(user.departmentId!));
    } else {
      list = list.filter((e) => e.picId === user.id);
    }
  }

  if (search) {
    const s = String(search).toLowerCase();
    list = list.filter(
      (e) =>
        e.name.toLowerCase().includes(s) ||
        e.code.toLowerCase().includes(s) ||
        e.shortName?.toLowerCase().includes(s) ||
        e.taxCode?.includes(s) ||
        e.tags.some((t) => t.toLowerCase().includes(s))
    );
  }

  if (status) list = list.filter((e) => e.status === status);
  if (priority) list = list.filter((e) => e.priority === priority);
  if (field) list = list.filter((e) => e.field.toLowerCase().includes(String(field).toLowerCase()));
  if (city) list = list.filter((e) => e.city === city);

  const users = await dbService.getUsers();
  const reps = list.map((e) => ({ ...e, pic: users.find((u) => u.id === e.picId) }));

  res.json(reps);
}));

app.get("/api/enterprises/:id", requireAuth, wrap(async (req, res) => {
  const ent = await dbService.getEnterpriseById(req.params.id);
  if (!ent) {
    return res.status(404).json({ message: "Không tìm thấy doanh nghiệp" });
  }

  const users = await dbService.getUsers();
  const contacts = await dbService.getContacts(ent.id);
  const interactions = await dbService.getInteractions(ent.id);
  const mous = await dbService.getMOUs(ent.id);
  const jobs = await dbService.getJobs(ent.id);
  const depts = await dbService.getDepartments();
  const events = (await dbService.getEvents()).filter((ev) => ev.enterpriseIds.includes(ent.id));

  res.json({
    ...ent,
    pic: users.find((u) => u.id === ent.picId),
    contacts,
    interactions: interactions.map((i) => ({
      ...i,
      picName: users.find((u) => u.id === i.picId)?.fullName || "N/A",
    })),
    mous: mous.map((m) => ({
      ...m,
      picName: users.find((u) => u.id === m.picId)?.fullName || "N/A",
      departmentName: depts.find((d) => d.id === m.departmentId)?.name || "N/A",
    })),
    jobs,
    events,
  });
}));

app.post(
  "/api/enterprises",
  requireAuth,
  requirePermission("create_enterprise"),
  validateBody(enterpriseCreateSchema),
  wrap(async (req, res) => {
    const data = req.body;

    const exist = (await dbService
      .getEnterprises())
      .find((e) => e.code.toUpperCase() === data.code.toUpperCase());
    if (exist) {
      return res.status(400).json({ message: `Mã doanh nghiệp '${data.code}' đã tồn tại` });
    }

    const createdBy = req.user!;
    const newEnt = await dbService.createEnterprise({
      code: data.code.toUpperCase(),
      name: data.name,
      shortName: data.shortName || null,
      taxCode: data.taxCode || null,
      field: data.field,
      scale: data.scale || "Dưới 50 nhân sự",
      type: data.type || "Tư nhân Việt Nam",
      address: data.address || "",
      city: data.city || "Hà Nội",
      website: data.website || null,
      linkedin: data.linkedin || null,
      description: data.description || null,
      status: data.status || EnterpriseStatus.TIEM_NANG,
      priority: data.priority || EnterprisePriority.THUONG,
      picId: data.picId || createdBy.id,
      internalNotes: data.internalNotes || null,
      facultyIds: data.facultyIds || [],
      majorIds: data.majorIds || [],
      tags: data.tags || [],
    });

    await dbService.createAuditLog({
      userId: createdBy.id,
      action: "CREATE_ENTERPRISE",
      module: "ENTERPRISE",
      recordId: newEnt.id,
      description: `Tạo mới hồ sơ doanh nghiệp: ${newEnt.name} (${newEnt.code}).`,
      ipAddress: clientIp(req),
    });

    res.status(201).json(newEnt);
  })
);

app.put(
  "/api/enterprises/:id",
  requireAuth,
  requirePermission("edit_enterprise"),
  validateBody(enterpriseUpdateSchema),
  wrap(async (req, res) => {
    const { id } = req.params;
    const currentEnt = await dbService.getEnterpriseById(id);
    if (!currentEnt) {
      return res.status(404).json({ message: "Không tìm thấy doanh nghiệp" });
    }

    const data = req.body;
    const updated = await dbService.updateEnterprise(id, {
      name: data.name,
      shortName: data.shortName,
      taxCode: data.taxCode,
      field: data.field,
      scale: data.scale,
      type: data.type,
      address: data.address,
      city: data.city,
      website: data.website,
      linkedin: data.linkedin,
      description: data.description,
      status: data.status,
      priority: data.priority,
      picId: data.picId,
      internalNotes: data.internalNotes,
      facultyIds: data.facultyIds || [],
      majorIds: data.majorIds || [],
      tags: data.tags || [],
    });

    if (data.status && currentEnt.status !== data.status) {
      await dbService.createInteraction({
        enterpriseId: id,
        date: new Date().toISOString(),
        type: InteractionType.FOLLOW_UP,
        content: `Hệ thống ghi nhận sự cải thiện/thay đổi tiến trình hợp tác của doanh nghiệp từ [${currentEnt.status}] thành [${data.status}].`,
        result: "Cập nhật hệ thống tự động",
        followUpTasks: null,
        followUpDeadline: null,
        followUpStatus: "NONE",
        picId: req.user!.id,
        contactIds: [],
      });
    }

    await dbService.createAuditLog({
      userId: req.user!.id,
      action: "UPDATE_ENTERPRISE",
      module: "ENTERPRISE",
      recordId: id,
      description: `Cập nhật hồ sơ doanh nghiệp ${currentEnt.name}.`,
      ipAddress: clientIp(req),
    });

    res.json(updated);
  })
);

app.delete(
  "/api/enterprises/:id",
  requireAuth,
  requirePermission("delete_enterprise"),
  wrap(async (req, res) => {
    const { id } = req.params;
    const target = await dbService.getEnterpriseById(id);
    if (!target) {
      return res.status(404).json({ message: "Không tìm thấy doanh nghiệp" });
    }

    await dbService.deleteEnterprise(id, req.user!.id);

    await dbService.createAuditLog({
      userId: req.user!.id,
      action: "DELETE_ENTERPRISE",
      module: "ENTERPRISE",
      recordId: id,
      description: `Xóa mềm hồ sơ doanh nghiệp ${target.name}.`,
      ipAddress: clientIp(req),
    });

    res.json({ success: true, message: "Xóa hồ sơ doanh nghiệp thành công" });
  })
);

// --- CONTACTS DIRECTORY ---
app.get("/api/contacts", requireAuth, wrap(async (req, res) => {
  const { enterpriseId } = req.query;
  const list = await dbService.getContacts(enterpriseId ? String(enterpriseId) : undefined);
  res.json(list);
}));

app.post(
  "/api/contacts",
  requireAuth,
  requirePermission("manage_contacts"),
  validateBody(contactCreateSchema),
  wrap(async (req, res) => {
    const data = req.body;
    const contact = await dbService.createContact({
      enterpriseId: data.enterpriseId,
      name: data.name,
      position: data.position,
      department: data.department || null,
      email: data.email || null,
      phone: data.phone || null,
      zalo: data.zalo || null,
      linkedin: data.linkedin || null,
      notes: data.notes || null,
      isPrimary: !!data.isPrimary,
      isActive: data.isActive !== false,
    });

    await dbService.createAuditLog({
      userId: req.user!.id,
      action: "CREATE_CONTACT",
      module: "CONTACT",
      recordId: contact.id,
      description: `Thêm đầu mối liên hệ: ${contact.name} (${contact.position}) thuộc doanh nghiệp.`,
      ipAddress: clientIp(req),
    });

    res.status(201).json(contact);
  })
);

app.put(
  "/api/contacts/:id",
  requireAuth,
  requirePermission("manage_contacts"),
  validateBody(contactUpdateSchema),
  wrap(async (req, res) => {
    const { id } = req.params;
    const current = await dbService.getContactById(id);
    if (!current) {
      return res.status(404).json({ message: "Không tìm thấy người liên hệ" });
    }

    const data = req.body;
    const updated = await dbService.updateContact(id, {
      name: data.name,
      position: data.position,
      department: data.department,
      email: data.email,
      phone: data.phone,
      zalo: data.zalo,
      linkedin: data.linkedin,
      notes: data.notes,
      isPrimary: !!data.isPrimary,
      isActive: data.isActive !== false,
    });

    await dbService.createAuditLog({
      userId: req.user!.id,
      action: "UPDATE_CONTACT",
      module: "CONTACT",
      recordId: id,
      description: `Cập nhật đầu mối liên hệ ${current.name}.`,
      ipAddress: clientIp(req),
    });

    res.json(updated);
  })
);

app.delete(
  "/api/contacts/:id",
  requireAuth,
  requirePermission("manage_contacts"),
  wrap(async (req, res) => {
    const { id } = req.params;
    const target = await dbService.getContactById(id);
    if (!target) {
      return res.status(404).json({ message: "Không tìm thấy người liên hệ" });
    }

    await dbService.deleteContact(id);

    await dbService.createAuditLog({
      userId: req.user!.id,
      action: "DELETE_CONTACT",
      module: "CONTACT",
      recordId: id,
      description: `Xóa liên hệ doanh nghiệp ${target.name}.`,
      ipAddress: clientIp(req),
    });

    res.json({ success: true, message: "Xóa thành công" });
  })
);

// --- INTERACTIONS (ACTIVITY LOGS) ---
app.get("/api/interactions", requireAuth, wrap(async (req, res) => {
  const { enterpriseId } = req.query;
  const list = await dbService.getInteractions(enterpriseId ? String(enterpriseId) : undefined);
  const users = await dbService.getUsers();
  const ents = await dbService.getEnterprises();

  const enriched = list.map((i) => ({
    ...i,
    picName: users.find((u) => u.id === i.picId)?.fullName || "N/A",
    enterpriseName: ents.find((e) => e.id === i.enterpriseId)?.name || "DN N/A",
  }));

  res.json(enriched);
}));

app.post(
  "/api/interactions",
  requireAuth,
  requirePermission("manage_interactions"),
  validateBody(interactionCreateSchema),
  wrap(async (req, res) => {
    const data = req.body;
    const createdBy = req.user!;
    const newInt = await dbService.createInteraction({
      enterpriseId: data.enterpriseId,
      date: data.date || new Date().toISOString(),
      type: data.type,
      content: data.content,
      result: data.result || null,
      followUpTasks: data.followUpTasks || null,
      followUpDeadline: data.followUpDeadline || null,
      followUpStatus: data.followUpStatus || "NONE",
      picId: data.picId || createdBy.id,
      contactIds: data.contactIds || [],
    });

    await dbService.createAuditLog({
      userId: createdBy.id,
      action: "CREATE_INTERACTION",
      module: "INTERACTION",
      recordId: newInt.id,
      description: `Ghi nhận nhật ký tương tác với doanh nghiệp: ${newInt.type}`,
      ipAddress: clientIp(req),
    });

    res.status(201).json(newInt);
  })
);

app.put(
  "/api/interactions/:id",
  requireAuth,
  requirePermission("manage_interactions"),
  validateBody(interactionUpdateSchema),
  wrap(async (req, res) => {
    const { id } = req.params;
    const current = await dbService.getInteractionById(id);
    if (!current) {
      return res.status(404).json({ message: "Không tìm thấy nhật ký tương tác" });
    }

    const data = req.body;
    const updated = await dbService.updateInteraction(id, {
      date: data.date,
      type: data.type,
      content: data.content,
      result: data.result,
      followUpTasks: data.followUpTasks,
      followUpDeadline: data.followUpDeadline,
      followUpStatus: data.followUpStatus,
      picId: data.picId,
      contactIds: data.contactIds || [],
    });

    await dbService.createAuditLog({
      userId: req.user!.id,
      action: "UPDATE_INTERACTION",
      module: "INTERACTION",
      recordId: id,
      description: `Cập nhật nhật ký tương tác ID: ${id}`,
      ipAddress: clientIp(req),
    });

    res.json(updated);
  })
);

app.delete(
  "/api/interactions/:id",
  requireAuth,
  requirePermission("manage_interactions"),
  wrap(async (req, res) => {
    const { id } = req.params;
    const target = await dbService.getInteractionById(id);
    if (!target) {
      return res.status(404).json({ message: "Không tìm thấy nhật ký tương tác" });
    }

    await dbService.deleteInteraction(id);

    await dbService.createAuditLog({
      userId: req.user!.id,
      action: "DELETE_INTERACTION",
      module: "INTERACTION",
      recordId: id,
      description: `Xóa nhật ký tương tác ngày ${new Date(target.date).toLocaleDateString("vi-VN")}`,
      ipAddress: clientIp(req),
    });

    res.json({ success: true, message: "Xóa nhật ký tương tác thành công" });
  })
);

// --- MOU / MOA / PARTNERSHIP DOCUMENTS ---
app.get("/api/mous", requireAuth, wrap(async (req, res) => {
  const { enterpriseId } = req.query;
  const list = await dbService.getMOUs(enterpriseId ? String(enterpriseId) : undefined);
  const ents = await dbService.getEnterprises();
  const depts = await dbService.getDepartments();
  const users = await dbService.getUsers();

  const enriched = list.map((m) => ({
    ...m,
    enterpriseName: ents.find((e) => e.id === m.enterpriseId)?.name || "N/A",
    departmentName: depts.find((d) => d.id === m.departmentId)?.name || "N/A",
    picName: users.find((u) => u.id === m.picId)?.fullName || "N/A",
  }));

  res.json(enriched);
}));

app.post(
  "/api/mous",
  requireAuth,
  requirePermission("manage_mou"),
  validateBody(mouCreateSchema),
  wrap(async (req, res) => {
    const data = req.body;

    const exist = (await dbService.getMOUs()).find((m) => m.code.toUpperCase() === data.code.toUpperCase());
    if (exist) {
      return res.status(400).json({ message: `Số văn bản thỏa thuận '${data.code}' đã tồn tại` });
    }

    const newMOU = await dbService.createMOU({
      code: data.code.toUpperCase(),
      type: data.type || DocumentType.MOU,
      enterpriseId: data.enterpriseId,
      departmentId: data.departmentId,
      signDate: data.signDate || new Date().toISOString(),
      effectiveDate: data.effectiveDate || new Date().toISOString(),
      expiryDate: data.expiryDate,
      picId: data.picId || req.user!.id,
      content: data.content || "",
      status: data.status || DocumentStatus.DA_KY,
      fileUrl: data.fileUrl || null,
    });

    await dbService.createAuditLog({
      userId: req.user!.id,
      action: "CREATE_MOU",
      module: "MOU",
      recordId: newMOU.id,
      description: `Lập văn bản thỏa thuận MOU mang số ${newMOU.code} với DN.`,
      ipAddress: clientIp(req),
    });

    res.status(201).json(newMOU);
  })
);

app.put(
  "/api/mous/:id",
  requireAuth,
  requirePermission("manage_mou"),
  validateBody(mouUpdateSchema),
  wrap(async (req, res) => {
    const { id } = req.params;
    const current = await dbService.getMOUById(id);
    if (!current) {
      return res.status(404).json({ message: "Không tìm thấy thỏa thuận ký kết" });
    }

    const data = req.body;
    const updated = await dbService.updateMOU(id, {
      code: data.code,
      type: data.type,
      enterpriseId: data.enterpriseId,
      departmentId: data.departmentId,
      signDate: data.signDate,
      effectiveDate: data.effectiveDate,
      expiryDate: data.expiryDate,
      picId: data.picId,
      content: data.content,
      status: data.status,
      fileUrl: data.fileUrl,
    });

    await dbService.createAuditLog({
      userId: req.user!.id,
      action: "UPDATE_MOU",
      module: "MOU",
      recordId: id,
      description: `Cập nhật văn bản thỏa thuận ${current.code}.`,
      ipAddress: clientIp(req),
    });

    res.json(updated);
  })
);

app.delete(
  "/api/mous/:id",
  requireAuth,
  requirePermission("manage_mou"),
  wrap(async (req, res) => {
    const { id } = req.params;
    const target = await dbService.getMOUById(id);
    if (!target) {
      return res.status(404).json({ message: "Không tìm thấy thỏa thuận" });
    }

    // Xóa luôn file đính kèm trên ổ đĩa (nếu có) để không rác dữ liệu.
    deleteUploadedFile(target.fileUrl);
    await dbService.deleteMOU(id);

    await dbService.createAuditLog({
      userId: req.user!.id,
      action: "DELETE_MOU",
      module: "MOU",
      recordId: id,
      description: `Hủy bỏ văn bản hợp tác ký kết ${target.code}.`,
      ipAddress: clientIp(req),
    });

    res.json({ success: true, message: "Xóa thỏa thuận thành công" });
  })
);

// --- UPLOAD FILE CHO MOU ---
// Nhận 1 file ở field "file", trả về URL công khai để gắn vào MOU.fileUrl.
app.post(
  "/api/mous/upload",
  requireAuth,
  requirePermission("manage_mou"),
  (req: Request, res: Response, next: NextFunction) => {
    mouUpload.single("file")(req, res, async (err: unknown) => {
      if (err) {
        // Lỗi multer (file quá lớn, sai loại...) => 400 với thông báo rõ ràng.
        return res.status(400).json({ message: (err as Error).message || "Tải file thất bại" });
      }
      const file = (req as Request & { file?: Express.Multer.File }).file;
      if (!file) {
        return res.status(400).json({ message: "Không có file nào được tải lên" });
      }
      const fileUrl = `/files/${file.filename}`;
      await dbService.createAuditLog({
        userId: (req as AuthenticatedRequest).user!.id,
        action: "UPLOAD_FILE",
        module: "MOU",
        recordId: null,
        description: `Tải lên file đính kèm MOU: ${file.originalname} (${Math.round(file.size / 1024)} KB).`,
        ipAddress: clientIp(req),
      });
      res.status(201).json({ fileUrl, originalName: file.originalname, size: file.size });
    });
  }
);

// --- JOBS DEMANDS ---
app.get("/api/jobs", requireAuth, wrap(async (req, res) => {
  const { enterpriseId } = req.query;
  const list = await dbService.getJobs(enterpriseId ? String(enterpriseId) : undefined);
  const ents = await dbService.getEnterprises();

  const enriched = list.map((j) => ({
    ...j,
    enterpriseName: ents.find((e) => e.id === j.enterpriseId)?.name || "N/A",
  }));

  res.json(enriched);
}));

app.post(
  "/api/jobs",
  requireAuth,
  requirePermission("manage_jobs"),
  validateBody(jobCreateSchema),
  wrap(async (req, res) => {
    const data = req.body;
    const job = await dbService.createJob({
      enterpriseId: data.enterpriseId,
      title: data.title,
      type: data.type || JobType.INTERN,
      quantity: Number(data.quantity) || 1,
      description: data.description || "",
      requirements: data.requirements || null,
      majors: data.majors,
      location: data.location || null,
      salary: data.salary || "Thỏa thuận",
      dateDeadline: data.dateDeadline,
      contactName: data.contactName || null,
      contactEmail: data.contactEmail || null,
      contactPhone: data.contactPhone || null,
      status: data.status || JobStatus.NEW,
    });

    await dbService.createAuditLog({
      userId: req.user!.id,
      action: "CREATE_JOB",
      module: "JOB",
      recordId: job.id,
      description: `Đăng tải nhu cầu tuyển dụng: ${job.title} tại DN.`,
      ipAddress: clientIp(req),
    });

    res.status(201).json(job);
  })
);

app.put(
  "/api/jobs/:id",
  requireAuth,
  requirePermission("manage_jobs"),
  validateBody(jobUpdateSchema),
  wrap(async (req, res) => {
    const { id } = req.params;
    const current = await dbService.getJobById(id);
    if (!current) {
      return res.status(404).json({ message: "Không tìm thấy thông tin tin việc" });
    }

    const data = req.body;
    const updated = await dbService.updateJob(id, {
      title: data.title,
      type: data.type,
      quantity: data.quantity !== undefined ? Number(data.quantity) : undefined,
      description: data.description,
      requirements: data.requirements,
      majors: data.majors,
      location: data.location,
      salary: data.salary,
      dateDeadline: data.dateDeadline,
      contactName: data.contactName,
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone,
      status: data.status,
    });

    res.json(updated);
  })
);

app.delete(
  "/api/jobs/:id",
  requireAuth,
  requirePermission("manage_jobs"),
  wrap(async (req, res) => {
    await dbService.deleteJob(req.params.id);
    res.json({ success: true, message: "Xóa thành công" });
  })
);

// --- COOPERATIVE EVENTS ---
app.get("/api/events", requireAuth, wrap(async (req, res) => {
  const list = await dbService.getEvents();
  const ents = await dbService.getEnterprises();
  const depts = await dbService.getDepartments();

  const enriched = list.map((ev) => ({
    ...ev,
    enterprises: ev.enterpriseIds.map((eid) => ents.find((e) => e.id === eid)).filter(Boolean),
    departments: ev.departmentIds.map((did) => depts.find((d) => d.id === did)).filter(Boolean),
  }));

  res.json(enriched);
}));

app.post(
  "/api/events",
  requireAuth,
  requirePermission("manage_events"),
  validateBody(eventCreateSchema),
  wrap(async (req, res) => {
    const data = req.body;
    const event = await dbService.createEvent({
      title: data.title,
      type: data.type,
      date: data.date,
      location: data.location,
      description: data.description || null,
      budget: data.budget !== undefined && data.budget !== null ? Number(data.budget) : null,
      joinCount: Number(data.joinCount) || 0,
      status: data.status || EventStatus.UPCOMING,
      enterpriseIds: data.enterpriseIds || [],
      departmentIds: data.departmentIds || [],
    });

    await dbService.createAuditLog({
      userId: req.user!.id,
      action: "CREATE_EVENT",
      module: "EVENT",
      recordId: event.id,
      description: `Tạo sự kiện liên kết doanh nghiệp: ${event.title}`,
      ipAddress: clientIp(req),
    });

    res.status(201).json(event);
  })
);

app.put(
  "/api/events/:id",
  requireAuth,
  requirePermission("manage_events"),
  validateBody(eventUpdateSchema),
  wrap(async (req, res) => {
    const { id } = req.params;
    const data = req.body;
    const updated = await dbService.updateEvent(id, {
      title: data.title,
      type: data.type,
      date: data.date,
      location: data.location,
      description: data.description,
      budget: data.budget !== undefined && data.budget !== null ? Number(data.budget) : null,
      joinCount: data.joinCount !== undefined ? Number(data.joinCount) : undefined,
      status: data.status,
      enterpriseIds: data.enterpriseIds || [],
      departmentIds: data.departmentIds || [],
    });
    res.json(updated);
  })
);

app.delete(
  "/api/events/:id",
  requireAuth,
  requirePermission("manage_events"),
  wrap(async (req, res) => {
    await dbService.deleteEvent(req.params.id);
    res.json({ success: true });
  })
);

// --- TASKS MGR ---
app.get("/api/tasks", requireAuth, wrap(async (req, res) => {
  const list = await dbService.getTasks(req.user!.roleId !== "r-admin" ? req.user!.id : undefined);
  const ents = await dbService.getEnterprises();
  const users = await dbService.getUsers();

  const enriched = list.map((t) => ({
    ...t,
    enterpriseName:
      ents.find((e) => e.id === t.enterpriseId)?.shortName ||
      ents.find((e) => e.id === t.enterpriseId)?.name ||
      "N/A",
    assigneeName: users.find((u) => u.id === t.assigneeId)?.fullName || "N/A",
  }));

  res.json(enriched);
}));

app.post(
  "/api/tasks",
  requireAuth,
  validateBody(taskCreateSchema),
  wrap(async (req, res) => {
    const data = req.body;
    const creatorId = req.user!.id;
    const task = await dbService.createTask({
      title: data.title,
      description: data.description || null,
      dueDate: data.dueDate,
      status: data.status || TaskStatus.TODO,
      priority: data.priority || TaskPriority.MEDIUM,
      enterpriseId: data.enterpriseId || null,
      interactionId: data.interactionId || null,
      assigneeId: data.assigneeId,
      creatorId,
    });

    res.status(201).json(task);
  })
);

app.put(
  "/api/tasks/:id",
  requireAuth,
  validateBody(taskUpdateSchema),
  wrap(async (req, res) => {
    const updated = await dbService.updateTask(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ message: "Không tìm thấy công việc" });
    }
    res.json(updated);
  })
);

app.delete("/api/tasks/:id", requireAuth, wrap(async (req, res) => {
  await dbService.deleteTask(req.params.id);
  res.json({ success: true });
}));

// --- ALERTS & NOTIFICATIONS ---
app.get("/api/notifications", requireAuth, wrap(async (req, res) => {
  // Cảnh báo MOU sắp hết hạn được sinh bởi cron job nền (cron.ts).
  // Route này chỉ trả về danh sách thông báo hiện có của user.
  const list = await dbService.getNotifications(req.user!.id);
  res.json(list);
}));

app.post("/api/notifications/:id/read", requireAuth, wrap(async (req, res) => {
  await dbService.markNotificationRead(req.params.id);
  res.json({ success: true });
}));

// --- KPI ANALYTICAL REPORTS ---
app.get(
  "/api/dashboard/stats",
  requireAuth,
  requirePermission("view_dashboard"),
  wrap(async (req, res) => {
    const stats = await dbService.getDashboardStats(req.user!.id);
    res.json(stats);
  })
);

// --- MASTER CODE DATA UTILS ---
app.get("/api/roles", requireAuth, wrap(async (_req, res) => {
  res.json(await dbService.getRoles());
}));

// --- DEPARTMENTS (CRUD master data) ---
app.get("/api/departments", requireAuth, wrap(async (_req, res) => {
  res.json(await dbService.getDepartments());
}));

app.post(
  "/api/departments",
  requireAuth,
  requirePermission("manage_master_data"),
  validateBody(departmentCreateSchema),
  wrap(async (req, res) => {
    const data = req.body;
    const exist = (await dbService
      .getDepartments())
      .find((d) => d.code.toUpperCase() === data.code.toUpperCase());
    if (exist) {
      return res.status(400).json({ message: `Mã đơn vị '${data.code}' đã tồn tại` });
    }
    const dept = await dbService.createDepartment({
      name: data.name,
      code: data.code,
      type: data.type,
      parentId: data.parentId || null,
    });
    await dbService.createAuditLog({
      userId: req.user!.id,
      action: "CREATE_DEPARTMENT",
      module: "MASTER_DATA",
      recordId: dept.id,
      description: `Tạo đơn vị: ${dept.name} (${dept.code}).`,
      ipAddress: clientIp(req),
    });
    res.status(201).json(dept);
  })
);

app.put(
  "/api/departments/:id",
  requireAuth,
  requirePermission("manage_master_data"),
  validateBody(departmentUpdateSchema),
  wrap(async (req, res) => {
    const { id } = req.params;
    const current = await dbService.getDepartmentById(id);
    if (!current) {
      return res.status(404).json({ message: "Không tìm thấy đơn vị" });
    }
    const updated = await dbService.updateDepartment(id, req.body);
    await dbService.createAuditLog({
      userId: req.user!.id,
      action: "UPDATE_DEPARTMENT",
      module: "MASTER_DATA",
      recordId: id,
      description: `Cập nhật đơn vị ${current.name}.`,
      ipAddress: clientIp(req),
    });
    res.json(updated);
  })
);

app.delete(
  "/api/departments/:id",
  requireAuth,
  requirePermission("manage_master_data"),
  wrap(async (req, res) => {
    const { id } = req.params;
    const current = await dbService.getDepartmentById(id);
    if (!current) {
      return res.status(404).json({ message: "Không tìm thấy đơn vị" });
    }
    // Chặn xóa nếu đơn vị còn được tham chiếu (user, MOU, DN, sự kiện).
    if (await dbService.isDepartmentInUse(id)) {
      return res
        .status(400)
        .json({ message: "Không thể xóa: đơn vị đang được sử dụng bởi người dùng/MOU/doanh nghiệp/sự kiện." });
    }
    await dbService.deleteDepartment(id);
    await dbService.createAuditLog({
      userId: req.user!.id,
      action: "DELETE_DEPARTMENT",
      module: "MASTER_DATA",
      recordId: id,
      description: `Xóa đơn vị ${current.name}.`,
      ipAddress: clientIp(req),
    });
    res.json({ success: true, message: "Xóa đơn vị thành công" });
  })
);

// --- USERS (CRUD master data) ---
app.get("/api/users", requireAuth, wrap(async (_req, res) => {
  const users = await dbService.getUsers();
  const roles = await dbService.getRoles();
  const depts = await dbService.getDepartments();

  const populated = users.map((u) => ({
    ...u,
    role: roles.find((r) => r.id === u.roleId),
    department: depts.find((d) => d.id === u.departmentId),
  }));
  res.json(populated);
}));

app.post(
  "/api/users",
  requireAuth,
  requirePermission("manage_users"),
  validateBody(userCreateSchema),
  wrap(async (req, res) => {
    const data = req.body;
    const exist = await dbService.getUserByEmail(data.email);
    if (exist) {
      return res.status(400).json({ message: `Email '${data.email}' đã được sử dụng` });
    }
    if (!(await dbService.getRoles()).find((r) => r.id === data.roleId)) {
      return res.status(400).json({ message: "Vai trò không hợp lệ" });
    }
    const newUser = await dbService.createUser(
      {
        email: data.email,
        fullName: data.fullName,
        phone: data.phone || null,
        isActive: data.isActive !== false,
        roleId: data.roleId,
        departmentId: data.departmentId || null,
      },
      data.password
    );
    await dbService.createAuditLog({
      userId: req.user!.id,
      action: "CREATE_USER",
      module: "ADMIN",
      recordId: newUser.id,
      description: `Tạo tài khoản người dùng: ${newUser.fullName} (${newUser.email}).`,
      ipAddress: clientIp(req),
    });
    // Không trả mật khẩu/hash về client.
    res.status(201).json(newUser);
  })
);

app.put(
  "/api/users/:id",
  requireAuth,
  requirePermission("manage_users"),
  validateBody(userUpdateSchema),
  wrap(async (req, res) => {
    const { id } = req.params;
    const current = await dbService.getUserById(id);
    if (!current) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }
    const data = req.body;
    if (data.roleId && !(await dbService.getRoles()).find((r) => r.id === data.roleId)) {
      return res.status(400).json({ message: "Vai trò không hợp lệ" });
    }
    const updated = await dbService.updateUser(id, {
      fullName: data.fullName,
      roleId: data.roleId,
      phone: data.phone,
      departmentId: data.departmentId,
      isActive: data.isActive,
    });
    // Đặt lại mật khẩu nếu có yêu cầu.
    if (data.password) {
      await dbService.setUserPassword(current.email, data.password);
    }
    await dbService.createAuditLog({
      userId: req.user!.id,
      action: "UPDATE_USER",
      module: "ADMIN",
      recordId: id,
      description: `Cập nhật tài khoản ${current.fullName}.`,
      ipAddress: clientIp(req),
    });
    res.json(updated);
  })
);

app.delete(
  "/api/users/:id",
  requireAuth,
  requirePermission("manage_users"),
  wrap(async (req, res) => {
    const { id } = req.params;
    const current = await dbService.getUserById(id);
    if (!current) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }
    // Không cho tự vô hiệu hóa chính mình.
    if (id === req.user!.id) {
      return res.status(400).json({ message: "Không thể tự vô hiệu hóa tài khoản của chính bạn." });
    }
    await dbService.deactivateUser(id);
    await dbService.createAuditLog({
      userId: req.user!.id,
      action: "DEACTIVATE_USER",
      module: "ADMIN",
      recordId: id,
      description: `Vô hiệu hóa tài khoản ${current.fullName}.`,
      ipAddress: clientIp(req),
    });
    res.json({ success: true, message: "Đã vô hiệu hóa tài khoản" });
  })
);

// ==========================================
// CENTRALIZED ERROR HANDLING
// ==========================================

// 404 cho các route API không tồn tại.
app.use("/api", (req, res) => {
  res.status(404).json({ message: "Không tìm thấy endpoint API yêu cầu" });
});

// Middleware bắt lỗi chung: log đầy đủ phía server, trả thông báo an toàn cho client
// (không lộ stack trace / chi tiết nội bộ).
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  logger.error("Lỗi xử lý request", {
    method: req.method,
    url: req.originalUrl,
    message: err.message,
    stack: config.isProduction ? undefined : err.stack,
  });

  if (res.headersSent) return;
  res.status(500).json({
    message: config.isProduction
      ? "Có lỗi xảy ra phía máy chủ. Vui lòng thử lại sau."
      : `Lỗi máy chủ: ${err.message}`,
  });
});

// ==========================================
// STATIC FILES & SERVER BOOTSTRAP
// ==========================================
export async function startServer() {
  if (!config.isProduction) {
    logger.info("Khởi động Express cùng Vite Dev Server (development)...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    logger.info("Khởi động Express môi trường Production...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Khởi động cron job cảnh báo MOU sắp hết hạn (chạy nền định kỳ).
  startMouExpiryCron();

  return new Promise<void>((resolve) => {
    app.listen(PORT, "0.0.0.0", () => {
      logger.info(`[UniEnterprise CRM] Hệ thống chạy thành công trên cổng ${PORT}`);
      resolve();
    });
  });
}

// Chỉ tự khởi động khi chạy trực tiếp (không khởi động khi bị import bởi test).
const isMainModule =
  process.argv[1] &&
  (process.argv[1].endsWith("server.ts") || process.argv[1].endsWith("server.cjs"));

if (isMainModule) {
  startServer().catch((err) => {
    logger.error("Lỗi khởi chạy server", { message: (err as Error).message });
    process.exit(1);
  });
}

export { app };
