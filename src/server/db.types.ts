// ==========================================
// INTERFACE CHUNG CHO TẦNG DỮ LIỆU (DB SERVICE)
// ==========================================
// Cả hai backend (JSON file & PostgreSQL/Prisma) đều implement interface async này.
// Nhờ vậy server.ts chỉ cần `await dbService.xxx(...)` mà không quan tâm backend nào.
// Chuyển đổi backend qua biến môi trường DB_BACKEND = "json" | "prisma".

import {
  Role,
  Permission,
  Department,
  User,
  Enterprise,
  Contact,
  Interaction,
  PartnershipDocument,
  Job,
  Event,
  Task,
  Notification,
  AuditLog,
  DashboardStats,
} from "../types/crm.ts";

export interface DbService {
  // RBAC & roles
  getRoles(): Promise<Role[]>;
  getPermissions(): Promise<Permission[]>;
  getPermissionsForRole(roleId: string): string[];

  // Departments
  getDepartments(): Promise<Department[]>;
  getDepartmentById(id: string): Promise<Department | undefined>;
  createDepartment(dept: Omit<Department, "id">): Promise<Department>;
  updateDepartment(id: string, data: Partial<Department>): Promise<Department | null>;
  deleteDepartment(id: string): Promise<boolean>;
  isDepartmentInUse(id: string): Promise<boolean>;

  // Users
  getUsers(): Promise<User[]>;
  getUserById(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: Omit<User, "id" | "createdAt">, passwordPlainText: string): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User | null>;
  deactivateUser(id: string): Promise<boolean>;
  verifyUserPassword(email: string, passwordPlainText: string): Promise<boolean>;
  setUserPassword(email: string, passwordPlainText: string): Promise<void>;

  // Enterprises
  getEnterprises(): Promise<Enterprise[]>;
  getEnterpriseById(id: string): Promise<Enterprise | undefined>;
  createEnterprise(ent: Omit<Enterprise, "id" | "createdAt" | "updatedAt">): Promise<Enterprise>;
  updateEnterprise(id: string, data: Partial<Enterprise>): Promise<Enterprise | null>;
  deleteEnterprise(id: string, userId: string): Promise<boolean>;

  // Contacts
  getContacts(enterpriseId?: string): Promise<Contact[]>;
  getContactById(id: string): Promise<Contact | undefined>;
  createContact(contact: Omit<Contact, "id" | "createdAt" | "updatedAt">): Promise<Contact>;
  updateContact(id: string, data: Partial<Contact>): Promise<Contact | null>;
  deleteContact(id: string): Promise<boolean>;

  // Interactions
  getInteractions(enterpriseId?: string): Promise<Interaction[]>;
  getInteractionById(id: string): Promise<Interaction | undefined>;
  createInteraction(interaction: Omit<Interaction, "id" | "createdAt">): Promise<Interaction>;
  updateInteraction(id: string, data: Partial<Interaction>): Promise<Interaction | null>;
  deleteInteraction(id: string): Promise<boolean>;

  // MOUs / Partnership documents
  getMOUs(enterpriseId?: string): Promise<PartnershipDocument[]>;
  getMOUById(id: string): Promise<PartnershipDocument | undefined>;
  createMOU(mou: Omit<PartnershipDocument, "id" | "createdAt" | "updatedAt">): Promise<PartnershipDocument>;
  updateMOU(id: string, data: Partial<PartnershipDocument>): Promise<PartnershipDocument | null>;
  deleteMOU(id: string): Promise<boolean>;

  // Jobs
  getJobs(enterpriseId?: string): Promise<Job[]>;
  getJobById(id: string): Promise<Job | undefined>;
  createJob(job: Omit<Job, "id" | "createdAt">): Promise<Job>;
  updateJob(id: string, data: Partial<Job>): Promise<Job | null>;
  deleteJob(id: string): Promise<boolean>;

  // Events
  getEvents(): Promise<Event[]>;
  getEventById(id: string): Promise<Event | undefined>;
  createEvent(ev: Omit<Event, "id" | "createdAt">): Promise<Event>;
  updateEvent(id: string, data: Partial<Event>): Promise<Event | null>;
  deleteEvent(id: string): Promise<boolean>;

  // Tasks
  getTasks(assigneeId?: string): Promise<Task[]>;
  getTaskById(id: string): Promise<Task | undefined>;
  createTask(task: Omit<Task, "id" | "createdAt">): Promise<Task>;
  updateTask(id: string, data: Partial<Task>): Promise<Task | null>;
  deleteTask(id: string): Promise<boolean>;

  // Notifications
  getNotifications(userId: string): Promise<Notification[]>;
  createNotification(notif: Omit<Notification, "id" | "isRead" | "createdAt">): Promise<Notification>;
  markNotificationRead(id: string): Promise<void>;

  // Audit logs
  getAuditLogs(): Promise<AuditLog[]>;
  createAuditLog(log: Omit<AuditLog, "id" | "createdAt">): Promise<AuditLog>;

  // Dashboard
  getDashboardStats(currentUserId?: string): Promise<DashboardStats>;
}
