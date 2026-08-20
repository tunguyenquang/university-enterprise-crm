// ==========================================
// VALIDATION - kiểm tra dữ liệu đầu vào bằng Zod
// ==========================================
// Mọi route POST/PUT đều xác thực body trước khi chạm vào DB.
// Dữ liệu rác / sai định dạng bị chặn ngay với HTTP 400 + thông báo rõ ràng.

import { z, ZodSchema } from "zod";
import { Request, Response, NextFunction } from "express";
import {
  EnterpriseStatus,
  EnterprisePriority,
  InteractionType,
  DocumentType,
  DocumentStatus,
  JobType,
  JobStatus,
  EventType,
  EventStatus,
  TaskStatus,
  TaskPriority,
  DepartmentType,
} from "../types/crm.ts";

// Helper: chuỗi bắt buộc, không rỗng sau khi trim.
// Zod v4: dùng { error } thay cho { required_error } để có thông báo tiếng Việt.
const requiredString = (label: string) =>
  z
    .string({ error: `${label} là bắt buộc` })
    .trim()
    .min(1, `${label} không được để trống`);

const optionalString = z.string().trim().optional().nullable();
const optionalEmail = z
  .string()
  .trim()
  .email("Email không đúng định dạng")
  .optional()
  .nullable()
  .or(z.literal(""));
const optionalUrl = z
  .string()
  .trim()
  .url("Đường dẫn (URL) không hợp lệ")
  .optional()
  .nullable()
  .or(z.literal(""));
const isoDate = z
  .string()
  .refine((v) => !Number.isNaN(new Date(v).getTime()), "Ngày tháng không hợp lệ");

// Tạo middleware validate cho một schema. Gắn req.body đã chuẩn hóa nếu hợp lệ.
export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const firstIssue = result.error.issues[0];
      const field = firstIssue?.path?.join(".") || "dữ liệu";
      return res.status(400).json({
        message: firstIssue?.message || `Dữ liệu không hợp lệ ở trường: ${field}`,
        errors: result.error.issues.map((i) => ({
          field: i.path.join("."),
          message: i.message,
        })),
      });
    }
    // Dùng dữ liệu đã được Zod chuẩn hóa (trim, ép kiểu...).
    req.body = result.data;
    next();
  };
}

// --- AUTH ---
export const loginSchema = z.object({
  email: requiredString("Email").email("Email không đúng định dạng"),
  password: requiredString("Mật khẩu"),
});

// --- ENTERPRISE ---
export const enterpriseCreateSchema = z.object({
  code: requiredString("Mã doanh nghiệp"),
  name: requiredString("Tên doanh nghiệp"),
  field: requiredString("Lĩnh vực hoạt động"),
  shortName: optionalString,
  taxCode: optionalString,
  scale: optionalString,
  type: optionalString,
  address: optionalString,
  city: optionalString,
  website: optionalUrl,
  linkedin: optionalUrl,
  description: optionalString,
  status: z.nativeEnum(EnterpriseStatus).optional(),
  priority: z.nativeEnum(EnterprisePriority).optional(),
  picId: optionalString,
  internalNotes: optionalString,
  facultyIds: z.array(z.string()).optional(),
  majorIds: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
});

// Khi cập nhật, các trường đều tùy chọn (cho phép cập nhật một phần).
export const enterpriseUpdateSchema = enterpriseCreateSchema.partial();

// --- CONTACT ---
export const contactCreateSchema = z.object({
  enterpriseId: requiredString("Doanh nghiệp"),
  name: requiredString("Tên người liên hệ"),
  position: requiredString("Chức vụ"),
  department: optionalString,
  email: optionalEmail,
  phone: optionalString,
  zalo: optionalString,
  linkedin: optionalUrl,
  notes: optionalString,
  isPrimary: z.boolean().optional(),
  isActive: z.boolean().optional(),
});
export const contactUpdateSchema = contactCreateSchema.partial().omit({ enterpriseId: true });

// --- INTERACTION ---
export const interactionCreateSchema = z.object({
  enterpriseId: requiredString("ID Doanh nghiệp"),
  type: z.nativeEnum(InteractionType, { error: "Loại tương tác không hợp lệ" }),
  content: requiredString("Nội dung chi tiết"),
  date: isoDate.optional(),
  result: optionalString,
  followUpTasks: optionalString,
  followUpDeadline: isoDate.optional().nullable(),
  followUpStatus: z.enum(["NONE", "PENDING", "COMPLETED"]).optional(),
  picId: optionalString,
  contactIds: z.array(z.string()).optional(),
});
export const interactionUpdateSchema = interactionCreateSchema.partial().omit({ enterpriseId: true });

// --- MOU ---
export const mouCreateSchema = z.object({
  code: requiredString("Số văn bản"),
  enterpriseId: requiredString("Doanh nghiệp"),
  departmentId: requiredString("Khoa/Đơn vị phụ trách"),
  expiryDate: isoDate,
  type: z.nativeEnum(DocumentType).optional(),
  signDate: isoDate.optional(),
  effectiveDate: isoDate.optional(),
  picId: optionalString,
  content: optionalString,
  status: z.nativeEnum(DocumentStatus).optional(),
  fileUrl: optionalString,
});
export const mouUpdateSchema = mouCreateSchema.partial();

// --- JOB ---
export const jobCreateSchema = z.object({
  title: requiredString("Tiêu đề"),
  enterpriseId: requiredString("Doanh nghiệp liên kết"),
  majors: requiredString("Chuyên ngành đào tạo"),
  dateDeadline: isoDate,
  type: z.nativeEnum(JobType).optional(),
  quantity: z.coerce.number().int().min(1, "Số lượng phải >= 1").optional(),
  description: optionalString,
  requirements: optionalString,
  location: optionalString,
  salary: optionalString,
  contactName: optionalString,
  contactEmail: optionalEmail,
  contactPhone: optionalString,
  status: z.nativeEnum(JobStatus).optional(),
});
export const jobUpdateSchema = jobCreateSchema.partial();

// --- EVENT ---
export const eventCreateSchema = z.object({
  title: requiredString("Tiêu đề sự kiện"),
  type: z.nativeEnum(EventType, { error: "Loại sự kiện không hợp lệ" }),
  date: isoDate,
  location: requiredString("Địa điểm"),
  description: optionalString,
  budget: z.coerce.number().min(0, "Ngân sách không được âm").optional().nullable(),
  joinCount: z.coerce.number().int().min(0).optional(),
  status: z.nativeEnum(EventStatus).optional(),
  enterpriseIds: z.array(z.string()).optional(),
  departmentIds: z.array(z.string()).optional(),
});
export const eventUpdateSchema = eventCreateSchema.partial();

// --- TASK ---
export const taskCreateSchema = z.object({
  title: requiredString("Tiêu đề công việc"),
  dueDate: isoDate,
  assigneeId: requiredString("Cán bộ phụ trách"),
  description: optionalString,
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  enterpriseId: optionalString,
  interactionId: optionalString,
});
// Cập nhật task: cho phép cập nhật một phần (vd kéo-thả đổi status trên Kanban).
export const taskUpdateSchema = taskCreateSchema.partial();

// --- MASTER DATA: DEPARTMENT ---
export const departmentCreateSchema = z.object({
  name: requiredString("Tên đơn vị"),
  code: requiredString("Mã đơn vị"),
  type: z.nativeEnum(DepartmentType, { error: "Loại đơn vị không hợp lệ" }),
  parentId: optionalString,
});
export const departmentUpdateSchema = departmentCreateSchema.partial();

// --- MASTER DATA: USER ---
export const userCreateSchema = z.object({
  email: requiredString("Email").email("Email không đúng định dạng"),
  fullName: requiredString("Họ tên"),
  roleId: requiredString("Vai trò"),
  password: requiredString("Mật khẩu").min(8, "Mật khẩu tối thiểu 8 ký tự"),
  phone: optionalString,
  departmentId: optionalString,
  isActive: z.boolean().optional(),
});
export const userUpdateSchema = z.object({
  fullName: z.string().trim().min(1).optional(),
  roleId: z.string().trim().min(1).optional(),
  phone: optionalString,
  departmentId: optionalString,
  isActive: z.boolean().optional(),
  // Cho phép đặt lại mật khẩu (tùy chọn).
  password: z.string().min(8, "Mật khẩu tối thiểu 8 ký tự").optional(),
});
