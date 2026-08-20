// ==========================================
// BACKEND POSTGRESQL (PRISMA) - implement DbService
// ==========================================
// Map giữa schema chuẩn hóa của Prisma (bảng nối: tags, faculties, majors, event links,
// interaction_contacts, role_permissions) và shape PHẲNG mà API/frontend mong đợi
// (enterprise.facultyIds[], event.enterpriseIds[], interaction.contactIds[]...).
// Nhờ giữ đúng shape, server.ts & frontend không cần thay đổi khi đổi backend.

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { config } from "./config.ts";
import { getPermissionsForRole } from "./rbac.ts";
import { DbService } from "./db.types.ts";
import {
  Role,
  Permission,
  Department,
  User,
  Enterprise,
  EnterpriseStatus,
  EnterprisePriority,
  Contact,
  Interaction,
  InteractionType,
  PartnershipDocument,
  DocumentType,
  DocumentStatus,
  Job,
  JobType,
  JobStatus,
  Event,
  EventType,
  EventStatus,
  Task,
  TaskStatus,
  TaskPriority,
  Notification,
  AuditLog,
  DashboardStats,
  DepartmentType,
} from "../types/crm.ts";

const prisma = new PrismaClient();

// ---- Helpers chuyển đổi kiểu ----
const iso = (d: Date | null | undefined): string => (d ? d.toISOString() : "");
const isoOrNull = (d: Date | null | undefined): string | null => (d ? d.toISOString() : null);

// ---- Mapping các bản ghi Prisma -> shape phẳng của ứng dụng ----
function mapRole(r: any): Role {
  return { id: r.id, name: r.name, code: r.code, description: r.description };
}
function mapPermission(p: any): Permission {
  return { id: p.id, name: p.name, code: p.code, group: p.group };
}
function mapDepartment(d: any): Department {
  return { id: d.id, name: d.name, code: d.code, type: d.type as DepartmentType, parentId: d.parentId };
}
function mapUser(u: any): User {
  return {
    id: u.id,
    email: u.email,
    fullName: u.fullName,
    phone: u.phone,
    isActive: u.isActive,
    roleId: u.roleId,
    departmentId: u.departmentId,
    createdAt: iso(u.createdAt),
  };
}
function mapEnterprise(e: any): Enterprise {
  return {
    id: e.id,
    code: e.code,
    name: e.name,
    shortName: e.shortName,
    taxCode: e.taxCode,
    field: e.field,
    scale: e.scale,
    type: e.type,
    address: e.address,
    city: e.city,
    website: e.website,
    linkedin: e.linkedin,
    description: e.description,
    status: e.status as EnterpriseStatus,
    priority: e.priority as EnterprisePriority,
    picId: e.picId,
    internalNotes: e.internalNotes,
    facultyIds: (e.faculties || []).map((f: any) => f.departmentId),
    majorIds: (e.majors || []).map((m: any) => m.departmentId),
    tags: (e.tags || []).map((t: any) => t.name),
    deletedAt: isoOrNull(e.deletedAt) || undefined,
    createdAt: iso(e.createdAt),
    updatedAt: iso(e.updatedAt),
  };
}
function mapContact(c: any): Contact {
  return {
    id: c.id,
    enterpriseId: c.enterpriseId,
    name: c.name,
    position: c.position,
    department: c.department,
    email: c.email,
    phone: c.phone,
    zalo: c.zalo,
    linkedin: c.linkedin,
    notes: c.notes,
    isPrimary: c.isPrimary,
    isActive: c.isActive,
    createdAt: iso(c.createdAt),
    updatedAt: iso(c.updatedAt),
  };
}
function mapInteraction(i: any): Interaction {
  return {
    id: i.id,
    enterpriseId: i.enterpriseId,
    date: iso(i.date),
    type: i.type as InteractionType,
    content: i.content,
    result: i.result,
    followUpTasks: i.followUpTasks,
    followUpDeadline: isoOrNull(i.followUpDeadline),
    followUpStatus: i.followUpStatus as Interaction["followUpStatus"],
    picId: i.picId,
    contactIds: (i.contacts || []).map((c: any) => c.contactId),
    createdAt: iso(i.createdAt),
  };
}
function mapMou(m: any): PartnershipDocument {
  return {
    id: m.id,
    code: m.code,
    type: m.type as DocumentType,
    enterpriseId: m.enterpriseId,
    departmentId: m.departmentId,
    signDate: iso(m.signDate),
    effectiveDate: iso(m.effectiveDate),
    expiryDate: iso(m.expiryDate),
    picId: m.picId,
    content: m.content,
    status: m.status as DocumentStatus,
    fileUrl: m.fileUrl,
    createdAt: iso(m.createdAt),
  };
}
function mapJob(j: any): Job {
  return {
    id: j.id,
    enterpriseId: j.enterpriseId,
    title: j.title,
    type: j.type as JobType,
    quantity: j.quantity,
    description: j.description,
    requirements: j.requirements,
    majors: j.majors,
    location: j.location,
    salary: j.salary,
    dateDeadline: iso(j.dateDeadline),
    contactName: j.contactName,
    contactEmail: j.contactEmail,
    contactPhone: j.contactPhone,
    status: j.status as JobStatus,
    createdAt: iso(j.createdAt),
  };
}
function mapEvent(ev: any): Event {
  return {
    id: ev.id,
    title: ev.title,
    type: ev.type as EventType,
    date: iso(ev.date),
    location: ev.location,
    description: ev.description,
    budget: ev.budget !== null && ev.budget !== undefined ? Number(ev.budget) : null,
    joinCount: ev.joinCount,
    status: ev.status as EventStatus,
    enterpriseIds: (ev.enterprises || []).map((x: any) => x.enterpriseId),
    departmentIds: (ev.departments || []).map((x: any) => x.departmentId),
    createdAt: iso(ev.createdAt),
  };
}
function mapTask(t: any): Task {
  return {
    id: t.id,
    title: t.title,
    description: t.description,
    dueDate: iso(t.dueDate),
    status: t.status as TaskStatus,
    priority: t.priority as TaskPriority,
    enterpriseId: t.enterpriseId,
    interactionId: t.interactionId,
    assigneeId: t.assigneeId,
    creatorId: t.creatorId,
    createdAt: iso(t.createdAt),
  };
}
function mapNotification(n: any): Notification {
  return {
    id: n.id,
    userId: n.userId,
    title: n.title,
    content: n.content,
    type: n.type as Notification["type"],
    isRead: n.isRead,
    link: n.link,
    createdAt: iso(n.createdAt),
  };
}
function mapAuditLog(l: any): AuditLog {
  return {
    id: l.id,
    userId: l.userId,
    action: l.action,
    module: l.module,
    recordId: l.recordId,
    description: l.description,
    ipAddress: l.ipAddress,
    createdAt: iso(l.createdAt),
  };
}

// Include chuẩn để lấy đủ quan hệ phẳng cho enterprise/event/interaction.
const ENT_INCLUDE = { tags: true, faculties: true, majors: true };
const EVENT_INCLUDE = { enterprises: true, departments: true };
const INT_INCLUDE = { contacts: true };

export const prismaDbService: DbService = {
  // ---- Roles & permissions ----
  getRoles: async () => (await prisma.role.findMany()).map(mapRole),
  getPermissions: async () => (await prisma.permission.findMany()).map(mapPermission),
  getPermissionsForRole: (roleId) => getPermissionsForRole(roleId),

  // ---- Departments ----
  getDepartments: async () => (await prisma.department.findMany()).map(mapDepartment),
  getDepartmentById: async (id) => {
    const d = await prisma.department.findUnique({ where: { id } });
    return d ? mapDepartment(d) : undefined;
  },
  createDepartment: async (dept) => {
    const d = await prisma.department.create({
      data: { name: dept.name, code: dept.code, type: dept.type, parentId: dept.parentId || null },
    });
    return mapDepartment(d);
  },
  updateDepartment: async (id, data) => {
    const exists = await prisma.department.findUnique({ where: { id } });
    if (!exists) return null;
    const patch: any = {};
    if (data.name !== undefined) patch.name = data.name;
    if (data.code !== undefined) patch.code = data.code;
    if (data.type !== undefined) patch.type = data.type;
    if (data.parentId !== undefined) patch.parentId = data.parentId;
    const d = await prisma.department.update({ where: { id }, data: patch });
    return mapDepartment(d);
  },
  deleteDepartment: async (id) => {
    try {
      await prisma.department.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  },
  isDepartmentInUse: async (id) => {
    const [u, m, ef, em, ed] = await Promise.all([
      prisma.user.count({ where: { departmentId: id } }),
      prisma.partnershipDocument.count({ where: { departmentId: id } }),
      prisma.enterpriseFaculty.count({ where: { departmentId: id } }),
      prisma.enterpriseMajor.count({ where: { departmentId: id } }),
      prisma.eventDepartment.count({ where: { departmentId: id } }),
    ]);
    return u + m + ef + em + ed > 0;
  },

  // ---- Users ----
  getUsers: async () => (await prisma.user.findMany({ where: { deletedAt: null } })).map(mapUser),
  getUserById: async (id) => {
    const u = await prisma.user.findFirst({ where: { id, deletedAt: null } });
    return u ? mapUser(u) : undefined;
  },
  getUserByEmail: async (email) => {
    const u = await prisma.user.findFirst({ where: { email, deletedAt: null } });
    return u ? mapUser(u) : undefined;
  },
  createUser: async (user, passwordPlainText) => {
    const u = await prisma.user.create({
      data: {
        email: user.email,
        fullName: user.fullName,
        phone: user.phone || null,
        isActive: user.isActive ?? true,
        roleId: user.roleId,
        departmentId: user.departmentId || null,
        passwordHash: bcrypt.hashSync(passwordPlainText, config.bcryptRounds),
      },
    });
    return mapUser(u);
  },
  updateUser: async (id, data) => {
    const exists = await prisma.user.findUnique({ where: { id } });
    if (!exists) return null;
    const patch: any = {};
    if (data.fullName !== undefined) patch.fullName = data.fullName;
    if (data.roleId !== undefined) patch.roleId = data.roleId;
    if (data.phone !== undefined) patch.phone = data.phone;
    if (data.departmentId !== undefined) patch.departmentId = data.departmentId;
    if (data.isActive !== undefined) patch.isActive = data.isActive;
    const u = await prisma.user.update({ where: { id }, data: patch });
    return mapUser(u);
  },
  deactivateUser: async (id) => {
    const exists = await prisma.user.findUnique({ where: { id } });
    if (!exists) return false;
    await prisma.user.update({ where: { id }, data: { isActive: false } });
    return true;
  },
  verifyUserPassword: async (email, passwordPlainText) => {
    const u = await prisma.user.findUnique({ where: { email } });
    if (!u) return false;
    try {
      return bcrypt.compareSync(passwordPlainText, u.passwordHash);
    } catch {
      return false;
    }
  },
  setUserPassword: async (email, passwordPlainText) => {
    await prisma.user.update({
      where: { email },
      data: { passwordHash: bcrypt.hashSync(passwordPlainText, config.bcryptRounds) },
    });
  },

  // ---- Enterprises ----
  getEnterprises: async () =>
    (await prisma.enterprise.findMany({ where: { deletedAt: null }, include: ENT_INCLUDE })).map(
      mapEnterprise
    ),
  getEnterpriseById: async (id) => {
    const e = await prisma.enterprise.findFirst({
      where: { id, deletedAt: null },
      include: ENT_INCLUDE,
    });
    return e ? mapEnterprise(e) : undefined;
  },
  createEnterprise: async (ent) => {
    const e = await prisma.enterprise.create({
      data: {
        code: ent.code,
        name: ent.name,
        shortName: ent.shortName ?? null,
        taxCode: ent.taxCode ?? null,
        field: ent.field,
        scale: ent.scale,
        type: ent.type,
        address: ent.address,
        city: ent.city,
        website: ent.website ?? null,
        linkedin: ent.linkedin ?? null,
        description: ent.description ?? null,
        status: ent.status,
        priority: ent.priority,
        picId: ent.picId ?? null,
        internalNotes: ent.internalNotes ?? null,
        tags: { create: (ent.tags || []).map((name) => ({ name })) },
        faculties: { create: (ent.facultyIds || []).map((departmentId) => ({ departmentId })) },
        majors: { create: (ent.majorIds || []).map((departmentId) => ({ departmentId })) },
      },
      include: ENT_INCLUDE,
    });
    return mapEnterprise(e);
  },
  updateEnterprise: async (id, data) => {
    const exists = await prisma.enterprise.findFirst({ where: { id, deletedAt: null } });
    if (!exists) return null;

    const patch: any = {};
    for (const key of [
      "code", "name", "shortName", "taxCode", "field", "scale", "type", "address",
      "city", "website", "linkedin", "description", "status", "priority", "picId", "internalNotes",
    ] as const) {
      if ((data as any)[key] !== undefined) patch[key] = (data as any)[key];
    }

    // Cập nhật quan hệ phẳng: xóa cũ, tạo lại theo mảng mới (nếu được cung cấp).
    await prisma.$transaction(async (tx) => {
      await tx.enterprise.update({ where: { id }, data: patch });
      if (data.tags !== undefined) {
        await tx.enterpriseTag.deleteMany({ where: { enterpriseId: id } });
        if (data.tags.length)
          await tx.enterpriseTag.createMany({ data: data.tags.map((name) => ({ name, enterpriseId: id })) });
      }
      if (data.facultyIds !== undefined) {
        await tx.enterpriseFaculty.deleteMany({ where: { enterpriseId: id } });
        if (data.facultyIds.length)
          await tx.enterpriseFaculty.createMany({
            data: data.facultyIds.map((departmentId) => ({ departmentId, enterpriseId: id })),
          });
      }
      if (data.majorIds !== undefined) {
        await tx.enterpriseMajor.deleteMany({ where: { enterpriseId: id } });
        if (data.majorIds.length)
          await tx.enterpriseMajor.createMany({
            data: data.majorIds.map((departmentId) => ({ departmentId, enterpriseId: id })),
          });
      }
    });

    const e = await prisma.enterprise.findUnique({ where: { id }, include: ENT_INCLUDE });
    return e ? mapEnterprise(e) : null;
  },
  deleteEnterprise: async (id) => {
    const exists = await prisma.enterprise.findFirst({ where: { id, deletedAt: null } });
    if (!exists) return false;
    await prisma.enterprise.update({ where: { id }, data: { deletedAt: new Date() } });
    return true;
  },

  // ---- Contacts ----
  getContacts: async (enterpriseId) =>
    (await prisma.contact.findMany({ where: enterpriseId ? { enterpriseId } : {} })).map(mapContact),
  getContactById: async (id) => {
    const c = await prisma.contact.findUnique({ where: { id } });
    return c ? mapContact(c) : undefined;
  },
  createContact: async (contact) => {
    // Nếu đặt làm primary, bỏ primary của các contact khác cùng DN.
    if (contact.isPrimary) {
      await prisma.contact.updateMany({
        where: { enterpriseId: contact.enterpriseId },
        data: { isPrimary: false },
      });
    }
    const c = await prisma.contact.create({
      data: {
        enterpriseId: contact.enterpriseId,
        name: contact.name,
        position: contact.position,
        department: contact.department ?? null,
        email: contact.email ?? null,
        phone: contact.phone ?? null,
        zalo: contact.zalo ?? null,
        linkedin: contact.linkedin ?? null,
        notes: contact.notes ?? null,
        isPrimary: !!contact.isPrimary,
        isActive: contact.isActive ?? true,
      },
    });
    return mapContact(c);
  },
  updateContact: async (id, data) => {
    const exists = await prisma.contact.findUnique({ where: { id } });
    if (!exists) return null;
    if (data.isPrimary) {
      await prisma.contact.updateMany({
        where: { enterpriseId: exists.enterpriseId },
        data: { isPrimary: false },
      });
    }
    const patch: any = {};
    for (const key of [
      "name", "position", "department", "email", "phone", "zalo", "linkedin", "notes", "isPrimary", "isActive",
    ] as const) {
      if ((data as any)[key] !== undefined) patch[key] = (data as any)[key];
    }
    const c = await prisma.contact.update({ where: { id }, data: patch });
    return mapContact(c);
  },
  deleteContact: async (id) => {
    try {
      await prisma.contact.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  },

  // ---- Interactions ----
  getInteractions: async (enterpriseId) => {
    const list = await prisma.interaction.findMany({
      where: enterpriseId ? { enterpriseId } : {},
      include: INT_INCLUDE,
      orderBy: { date: "desc" },
    });
    return list.map(mapInteraction);
  },
  getInteractionById: async (id) => {
    const i = await prisma.interaction.findUnique({ where: { id }, include: INT_INCLUDE });
    return i ? mapInteraction(i) : undefined;
  },
  createInteraction: async (interaction) => {
    const i = await prisma.interaction.create({
      data: {
        enterpriseId: interaction.enterpriseId,
        date: interaction.date ? new Date(interaction.date) : new Date(),
        type: interaction.type,
        content: interaction.content,
        result: interaction.result ?? null,
        followUpTasks: interaction.followUpTasks ?? null,
        followUpDeadline: interaction.followUpDeadline ? new Date(interaction.followUpDeadline) : null,
        followUpStatus: interaction.followUpStatus || "NONE",
        picId: interaction.picId ?? null,
        contacts: { create: (interaction.contactIds || []).map((contactId) => ({ contactId })) },
      },
      include: INT_INCLUDE,
    });

    // Tự tạo Task theo dõi nếu có deadline và đang PENDING.
    if (interaction.followUpDeadline && interaction.followUpStatus === "PENDING") {
      const enterprise = await prisma.enterprise.findUnique({ where: { id: interaction.enterpriseId } });
      await prismaDbService.createTask({
        title: `Phân công theo dõi LH DN ${enterprise?.shortName || enterprise?.name || ""}`,
        description: `Bắt buộc tiếp nối tương tác: ${interaction.followUpTasks || interaction.content}`,
        dueDate: interaction.followUpDeadline,
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        enterpriseId: interaction.enterpriseId,
        interactionId: i.id,
        assigneeId: interaction.picId || "u-an",
        creatorId: "u-admin",
      });
    }
    return mapInteraction(i);
  },
  updateInteraction: async (id, data) => {
    const exists = await prisma.interaction.findUnique({ where: { id } });
    if (!exists) return null;
    const patch: any = {};
    if (data.date !== undefined) patch.date = new Date(data.date);
    if (data.type !== undefined) patch.type = data.type;
    if (data.content !== undefined) patch.content = data.content;
    if (data.result !== undefined) patch.result = data.result;
    if (data.followUpTasks !== undefined) patch.followUpTasks = data.followUpTasks;
    if (data.followUpDeadline !== undefined)
      patch.followUpDeadline = data.followUpDeadline ? new Date(data.followUpDeadline) : null;
    if (data.followUpStatus !== undefined) patch.followUpStatus = data.followUpStatus;
    if (data.picId !== undefined) patch.picId = data.picId;

    await prisma.$transaction(async (tx) => {
      await tx.interaction.update({ where: { id }, data: patch });
      if (data.contactIds !== undefined) {
        await tx.interactionContact.deleteMany({ where: { interactionId: id } });
        if (data.contactIds.length)
          await tx.interactionContact.createMany({
            data: data.contactIds.map((contactId) => ({ contactId, interactionId: id })),
          });
      }
    });

    // Đồng bộ trạng thái task liên kết khi follow-up hoàn thành.
    if (data.followUpStatus === "COMPLETED") {
      await prisma.task.updateMany({ where: { interactionId: id }, data: { status: TaskStatus.COMPLETED } });
    }

    const i = await prisma.interaction.findUnique({ where: { id }, include: INT_INCLUDE });
    return i ? mapInteraction(i) : null;
  },
  deleteInteraction: async (id) => {
    try {
      await prisma.interaction.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  },

  // ---- MOUs ----
  getMOUs: async (enterpriseId) =>
    (await prisma.partnershipDocument.findMany({ where: enterpriseId ? { enterpriseId } : {} })).map(mapMou),
  getMOUById: async (id) => {
    const m = await prisma.partnershipDocument.findUnique({ where: { id } });
    return m ? mapMou(m) : undefined;
  },
  createMOU: async (mou) => {
    const m = await prisma.partnershipDocument.create({
      data: {
        code: mou.code,
        type: mou.type,
        enterpriseId: mou.enterpriseId,
        departmentId: mou.departmentId,
        signDate: new Date(mou.signDate),
        effectiveDate: new Date(mou.effectiveDate),
        expiryDate: new Date(mou.expiryDate),
        picId: mou.picId ?? null,
        content: mou.content,
        status: mou.status,
        fileUrl: mou.fileUrl ?? null,
      },
    });
    return mapMou(m);
  },
  updateMOU: async (id, data) => {
    const exists = await prisma.partnershipDocument.findUnique({ where: { id } });
    if (!exists) return null;
    const patch: any = {};
    if (data.code !== undefined) patch.code = data.code;
    if (data.type !== undefined) patch.type = data.type;
    if (data.enterpriseId !== undefined) patch.enterpriseId = data.enterpriseId;
    if (data.departmentId !== undefined) patch.departmentId = data.departmentId;
    if (data.signDate !== undefined) patch.signDate = new Date(data.signDate);
    if (data.effectiveDate !== undefined) patch.effectiveDate = new Date(data.effectiveDate);
    if (data.expiryDate !== undefined) patch.expiryDate = new Date(data.expiryDate);
    if (data.picId !== undefined) patch.picId = data.picId;
    if (data.content !== undefined) patch.content = data.content;
    if (data.status !== undefined) patch.status = data.status;
    if (data.fileUrl !== undefined) patch.fileUrl = data.fileUrl;
    const m = await prisma.partnershipDocument.update({ where: { id }, data: patch });
    return mapMou(m);
  },
  deleteMOU: async (id) => {
    try {
      await prisma.partnershipDocument.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  },

  // ---- Jobs ----
  getJobs: async (enterpriseId) =>
    (await prisma.job.findMany({ where: enterpriseId ? { enterpriseId } : {} })).map(mapJob),
  getJobById: async (id) => {
    const j = await prisma.job.findUnique({ where: { id } });
    return j ? mapJob(j) : undefined;
  },
  createJob: async (job) => {
    const j = await prisma.job.create({
      data: {
        enterpriseId: job.enterpriseId,
        title: job.title,
        type: job.type,
        quantity: job.quantity,
        description: job.description,
        requirements: job.requirements ?? null,
        majors: job.majors,
        location: job.location ?? null,
        salary: job.salary,
        dateDeadline: new Date(job.dateDeadline),
        contactName: job.contactName ?? null,
        contactEmail: job.contactEmail ?? null,
        contactPhone: job.contactPhone ?? null,
        status: job.status,
      },
    });
    return mapJob(j);
  },
  updateJob: async (id, data) => {
    const exists = await prisma.job.findUnique({ where: { id } });
    if (!exists) return null;
    const patch: any = {};
    if (data.title !== undefined) patch.title = data.title;
    if (data.type !== undefined) patch.type = data.type;
    if (data.quantity !== undefined) patch.quantity = data.quantity;
    // description / salary la cot NOT NULL trong schema: quy null ve chuoi rong
    // (dung hanh vi cua createJob) thay vi de Prisma nem loi -> API 500.
    if (data.description !== undefined) patch.description = data.description ?? "";
    if (data.requirements !== undefined) patch.requirements = data.requirements;
    if (data.majors !== undefined) patch.majors = data.majors;
    if (data.location !== undefined) patch.location = data.location;
    if (data.salary !== undefined) patch.salary = data.salary ?? "";
    if (data.dateDeadline !== undefined) patch.dateDeadline = new Date(data.dateDeadline);
    if (data.contactName !== undefined) patch.contactName = data.contactName;
    if (data.contactEmail !== undefined) patch.contactEmail = data.contactEmail;
    if (data.contactPhone !== undefined) patch.contactPhone = data.contactPhone;
    if (data.status !== undefined) patch.status = data.status;
    const j = await prisma.job.update({ where: { id }, data: patch });
    return mapJob(j);
  },
  deleteJob: async (id) => {
    try {
      await prisma.job.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  },

  // ---- Events ----
  getEvents: async () =>
    (await prisma.event.findMany({ include: EVENT_INCLUDE })).map(mapEvent),
  getEventById: async (id) => {
    const ev = await prisma.event.findUnique({ where: { id }, include: EVENT_INCLUDE });
    return ev ? mapEvent(ev) : undefined;
  },
  createEvent: async (ev) => {
    const created = await prisma.event.create({
      data: {
        title: ev.title,
        type: ev.type,
        date: new Date(ev.date),
        location: ev.location,
        description: ev.description ?? null,
        budget: ev.budget ?? null,
        joinCount: ev.joinCount ?? 0,
        status: ev.status,
        enterprises: { create: (ev.enterpriseIds || []).map((enterpriseId) => ({ enterpriseId })) },
        departments: { create: (ev.departmentIds || []).map((departmentId) => ({ departmentId })) },
      },
      include: EVENT_INCLUDE,
    });
    return mapEvent(created);
  },
  updateEvent: async (id, data) => {
    const exists = await prisma.event.findUnique({ where: { id } });
    if (!exists) return null;
    const patch: any = {};
    if (data.title !== undefined) patch.title = data.title;
    if (data.type !== undefined) patch.type = data.type;
    if (data.date !== undefined) patch.date = new Date(data.date);
    // location la cot NOT NULL: khong de null lot xuong Prisma (xem updateJob).
    if (data.location !== undefined) patch.location = data.location ?? "";
    if (data.description !== undefined) patch.description = data.description;
    if (data.budget !== undefined) patch.budget = data.budget;
    if (data.joinCount !== undefined) patch.joinCount = data.joinCount;
    if (data.status !== undefined) patch.status = data.status;

    await prisma.$transaction(async (tx) => {
      await tx.event.update({ where: { id }, data: patch });
      if (data.enterpriseIds !== undefined) {
        await tx.eventEnterprise.deleteMany({ where: { eventId: id } });
        if (data.enterpriseIds.length)
          await tx.eventEnterprise.createMany({
            data: data.enterpriseIds.map((enterpriseId) => ({ enterpriseId, eventId: id })),
          });
      }
      if (data.departmentIds !== undefined) {
        await tx.eventDepartment.deleteMany({ where: { eventId: id } });
        if (data.departmentIds.length)
          await tx.eventDepartment.createMany({
            data: data.departmentIds.map((departmentId) => ({ departmentId, eventId: id })),
          });
      }
    });

    const ev = await prisma.event.findUnique({ where: { id }, include: EVENT_INCLUDE });
    return ev ? mapEvent(ev) : null;
  },
  deleteEvent: async (id) => {
    try {
      await prisma.event.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  },

  // ---- Tasks ----
  getTasks: async (assigneeId) => {
    const list = await prisma.task.findMany({
      where: assigneeId ? { assigneeId } : {},
      orderBy: { dueDate: "asc" },
    });
    return list.map(mapTask);
  },
  getTaskById: async (id) => {
    const t = await prisma.task.findUnique({ where: { id } });
    return t ? mapTask(t) : undefined;
  },
  createTask: async (task) => {
    const t = await prisma.task.create({
      data: {
        title: task.title,
        description: task.description ?? null,
        dueDate: new Date(task.dueDate),
        status: task.status,
        priority: task.priority,
        enterpriseId: task.enterpriseId ?? null,
        interactionId: task.interactionId ?? null,
        assigneeId: task.assigneeId,
        creatorId: task.creatorId,
      },
    });
    // Thông báo cho người được giao việc.
    await prismaDbService.createNotification({
      userId: task.assigneeId,
      title: "Bạn có công việc mới liên quan đến Doanh nghiệp",
      content: `${task.title} - Hạn hoàn thành: ${new Date(task.dueDate).toLocaleDateString("vi-VN")}`,
      type: "TASK_DUE",
      link: `/enterprises/${task.enterpriseId}`,
    });
    return mapTask(t);
  },
  updateTask: async (id, data) => {
    const exists = await prisma.task.findUnique({ where: { id } });
    if (!exists) return null;
    const patch: any = {};
    if (data.title !== undefined) patch.title = data.title;
    if (data.description !== undefined) patch.description = data.description;
    if (data.dueDate !== undefined) patch.dueDate = new Date(data.dueDate);
    if (data.status !== undefined) patch.status = data.status;
    if (data.priority !== undefined) patch.priority = data.priority;
    if (data.enterpriseId !== undefined) patch.enterpriseId = data.enterpriseId;
    if (data.interactionId !== undefined) patch.interactionId = data.interactionId;
    if (data.assigneeId !== undefined) patch.assigneeId = data.assigneeId;
    const t = await prisma.task.update({ where: { id }, data: patch });
    return mapTask(t);
  },
  deleteTask: async (id) => {
    try {
      await prisma.task.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  },

  // ---- Notifications ----
  getNotifications: async (userId) => {
    const list = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return list.map(mapNotification);
  },
  createNotification: async (notif) => {
    const n = await prisma.notification.create({
      data: {
        userId: notif.userId,
        title: notif.title,
        content: notif.content,
        type: notif.type,
        link: notif.link ?? null,
        isRead: false,
      },
    });
    return mapNotification(n);
  },
  markNotificationRead: async (id, userId) => {
    // updateMany + dieu kien userId: ban ghi khong thuoc user nay thi count = 0,
    // khong nem loi va cung khong sua gi. Dung update() theo id tran se cho phep
    // bat ky ai danh dau da doc thong bao cua nguoi khac (IDOR).
    const result = await prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
    return result.count > 0;
  },

  // ---- Audit logs ----
  getAuditLogs: async () =>
    (await prisma.auditLog.findMany({ orderBy: { createdAt: "desc" } })).map(mapAuditLog),
  createAuditLog: async (log) => {
    const l = await prisma.auditLog.create({
      data: {
        userId: log.userId ?? null,
        action: log.action,
        module: log.module,
        recordId: log.recordId ?? null,
        description: log.description,
        ipAddress: log.ipAddress ?? null,
      },
    });
    return mapAuditLog(l);
  },

  // ---- Dashboard ----
  getDashboardStats: async (currentUserId): Promise<DashboardStats> => {
    const [enterprises, mous, jobs, events, tasks, departments] = await Promise.all([
      prismaDbService.getEnterprises(),
      prismaDbService.getMOUs(),
      prismaDbService.getJobs(),
      prismaDbService.getEvents(),
      prismaDbService.getTasks(),
      prismaDbService.getDepartments(),
    ]);

    const activeStatuses = [
      EnterpriseStatus.DANG_TRIEN_KHAI,
      EnterpriseStatus.DA_KY_MOU,
      EnterpriseStatus.DANG_TRAO_DOI,
    ];
    const totalEnterprises = enterprises.length;
    const activeEnterprises = enterprises.filter((e) => activeStatuses.includes(e.status)).length;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const newEnterprisesThisMonth = enterprises.filter((e) => {
      const d = new Date(e.createdAt);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length;

    const enterpriseByStatus = Object.values(EnterpriseStatus).map((st) => ({
      status: st,
      count: enterprises.filter((e) => e.status === st).length,
    }));

    const fields = Array.from(new Set(enterprises.map((e) => e.field)));
    const enterpriseByField = fields.map((f) => ({
      field: f,
      count: enterprises.filter((e) => e.field === f).length,
    }));

    const nowMs = now.getTime();
    const ninetyDays = 90 * 24 * 3600 * 1000;
    const currentMous = mous.filter((m) => {
      const expiry = new Date(m.expiryDate).getTime();
      return m.status === DocumentStatus.DA_KY && expiry > nowMs;
    }).length;
    const expiringMous = mous.filter((m) => {
      const expiry = new Date(m.expiryDate).getTime();
      return m.status === DocumentStatus.DA_KY && expiry - nowMs > 0 && expiry - nowMs <= ninetyDays;
    }).length;
    const expiredMous = mous.filter((m) => {
      const expiry = new Date(m.expiryDate).getTime();
      return m.status === DocumentStatus.HET_HAN || (m.status === DocumentStatus.DA_KY && expiry < nowMs);
    }).length;

    const tasksPending = tasks.filter(
      (t) => t.status !== TaskStatus.COMPLETED && (!currentUserId || t.assigneeId === currentUserId)
    ).length;

    const pipelineStages = [
      EnterpriseStatus.TIEM_NANG,
      EnterpriseStatus.DANG_TIEP_CAN,
      EnterpriseStatus.DANG_TRAO_DOI,
      EnterpriseStatus.DA_KY_MOU,
      EnterpriseStatus.DANG_TRIEN_KHAI,
    ];
    const pipelineStats = pipelineStages.map((stage) => {
      const count = enterprises.filter((e) => e.status === stage).length;
      return {
        stage,
        count,
        percentage: totalEnterprises > 0 ? parseFloat(((count / totalEnterprises) * 100).toFixed(1)) : 0,
      };
    });

    const engagementLeaderboard = departments
      .filter((dept) => dept.type === DepartmentType.KHOA)
      .map((dept) => {
        const matchingEvCount = events.filter((ev) => ev.departmentIds.includes(dept.id)).length;
        const matchingMouCount = mous.filter((m) => m.departmentId === dept.id).length;
        const matchingEnts = enterprises.filter((e) => e.facultyIds?.includes(dept.id)).length;
        const totalScore = matchingMouCount * 10 + matchingEvCount * 5 + matchingEnts * 2;
        return {
          departmentName: dept.name,
          eventCount: matchingEvCount,
          mouCount: matchingMouCount,
          enterpriseCount: matchingEnts,
          totalScore,
        };
      })
      .sort((a, b) => b.totalScore - a.totalScore);

    return {
      totalEnterprises,
      activeEnterprises,
      newEnterprisesThisMonth,
      enterpriseByStatus,
      enterpriseByField,
      currentMous,
      expiringMous,
      expiredMous,
      jobsCount: jobs.length,
      eventsCount: events.length,
      tasksPending,
      pipelineStats,
      engagementLeaderboard,
    };
  },
};
