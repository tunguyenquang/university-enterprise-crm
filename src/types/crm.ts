// Types for CRM Quan hệ Doanh nghiệp Đại học

export enum RoleCode {
  SUPER_ADMIN = "SUPER_ADMIN",
  LEADER = "LEADER", // Ban Giám Hiệu
  QHDN_MANAGER = "QHDN_MANAGER", // Quản trị phòng QHDN
  QHDN_STAFF = "QHDN_STAFF", // Chuyên viên QHDN
  FACULTY_REPRESENTATIVE = "FACULTY_REPRESENTATIVE", // Đại diện Khoa/Viện
  STUDENT_SUPPORT = "STUDENT_SUPPORT", // Trung tâm Hỗ trợ SV/Việc làm
  INNOVATION_CENTER = "INNOVATION_CENTER" // Trung tâm Đổi mới Sáng tạo / Khởi nghiệp
}

export enum DepartmentType {
  KHOA = "KHOA",
  PHONG = "PHONG",
  TRUNG_TAM = "TRUNG_TAM"
}

export enum EnterpriseStatus {
  TIEM_NANG = "TIEM_NANG", // Tiềm năng
  DANG_TIEP_CAN = "DANG_TIEP_CAN", // Đang tiếp cận/liên hệ
  DANG_TRAO_DOI = "DANG_TRAO_DOI", // Đang trao đổi đề xuất
  DA_KY_MOU = "DA_KY_MOU", // Đã ký kết hợp tác (MOU/MOA)
  DANG_TRIEN_KHAI = "DANG_TRIEN_KHAI", // Đang triển khai hoạt động thực tế
  TAM_NGUNG = "TAM_NGUNG", // Tạm ngưng hợp tác
  NGUNG_HOP_TAC = "NGUNG_HOP_TAC" // Ngừng hợp tác hoàn toàn
}

export enum EnterprisePriority {
  CHIEN_LUOC = "CHIEN_LUOC", // Đối tác chiến lược
  QUAN_TRONG = "QUAN_TRONG", // Quan trọng
  TIEM_NANG = "TIEM_NANG", // Tiềm năng trung hạn
  THUONG = "THUONG" // Thông thường
}

export enum InteractionType {
  CALL = "CALL",
  EMAIL = "EMAIL",
  MEETING_OFFLINE = "MEETING_OFFLINE",
  MEETING_ONLINE = "MEETING_ONLINE",
  VISIT = "VISIT", // Tham quan doanh nghiệp / Company Tour
  WORKSHOP = "WORKSHOP", // Seminar, hội nghị phối hợp
  MOU_SIGNING = "MOU_SIGNING", // Ký kết văn bản
  FOLLOW_UP = "FOLLOW_UP", // Liên hệ theo dõi tiếp
  JOB_REQ = "JOB_REQ", // Tiếp nhận nhu cầu tuyển dụng/thực tập
  PROPOSAL = "PROPOSAL" // Gửi/nhận đề xuất hợp tác
}

export enum DocumentType {
  MOU = "MOU", // Memorandum of Understanding
  MOA = "MOA", // Memorandum of Agreement
  CONTRACT = "CONTRACT", // Hợp đồng nguyên tắc, hợp đồng đào tạo
  OTHER = "OTHER"
}

export enum DocumentStatus {
  SOAN_THAO = "SOAN_THAO", // Đang soạn thảo
  TRINH_KY = "TRINH_KY", // Đang trình ký
  DA_KY = "DA_KY", // Đã ký, đang hiệu lực
  HET_HAN = "HET_HAN", // Đã hết hạn
  THANH_LY = "THANH_LY" // Đã thanh lý
}

export enum JobType {
  FULLTIME = "FULLTIME",
  PARTTIME = "PARTTIME",
  INTERN = "INTERN",
  CTV = "CTV" // Cộng tác viên
}

export enum JobStatus {
  NEW = "NEW",
  ACTIVE = "ACTIVE",
  CLOSED = "CLOSED",
  COMPLETED = "COMPLETED"
}

export enum EventType {
  WORKSHOP = "WORKSHOP",
  SEMINAR = "SEMINAR",
  JOB_FAIR = "JOB_FAIR",
  COMPANY_TOUR = "COMPANY_TOUR",
  SPONSORSHIP = "SPONSORSHIP",
  MENTORSHIP = "MENTORSHIP"
}

export enum EventStatus {
  UPCOMING = "UPCOMING",
  ONGOING = "ONGOING",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED"
}

export enum TaskStatus {
  TODO = "TODO",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED"
}

export enum TaskPriority {
  HIGH = "HIGH",
  MEDIUM = "MEDIUM",
  LOW = "LOW"
}

// Model Interfaces
export interface Role {
  id: string;
  name: string;
  code: RoleCode;
  description: string | null;
}

export interface Permission {
  id: string;
  name: string;
  code: string;
  group: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  type: DepartmentType;
  parentId: string | null;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  isActive: boolean;
  roleId: string;
  role?: Role;
  departmentId: string | null;
  department?: Department;
  createdAt: string;
}

export interface Enterprise {
  id: string;
  code: string;
  name: string;
  shortName: string | null;
  taxCode: string | null;
  field: string;
  scale: string;
  type: string;
  address: string;
  city: string;
  website: string | null;
  linkedin: string | null;
  description: string | null;
  status: EnterpriseStatus;
  priority: EnterprisePriority;
  picId: string | null;
  pic?: User;
  internalNotes: string | null;
  facultyIds?: string[];
  majorIds?: string[]; // Simplified lists of relations for swift REST utilization
  tags: string[];
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: string;
  enterpriseId: string;
  name: string;
  position: string;
  department: string | null;
  email: string | null;
  phone: string | null;
  zalo: string | null;
  linkedin: string | null;
  notes: string | null;
  isPrimary: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Interaction {
  id: string;
  enterpriseId: string;
  enterpriseName?: string;
  date: string;
  type: InteractionType;
  content: string;
  result: string | null;
  followUpTasks: string | null;
  followUpDeadline: string | null;
  followUpStatus: "NONE" | "PENDING" | "COMPLETED";
  picId: string | null;
  picName?: string;
  contactIds: string[];
  createdAt: string;
}

export interface PartnershipDocument {
  id: string;
  code: string;
  type: DocumentType;
  enterpriseId: string;
  enterpriseName?: string;
  departmentId: string;
  departmentName?: string;
  signDate: string;
  effectiveDate: string;
  expiryDate: string;
  picId: string | null;
  picName?: string;
  content: string;
  status: DocumentStatus;
  fileUrl: string | null;
  createdAt: string;
}

export interface Job {
  id: string;
  enterpriseId: string;
  enterpriseName?: string;
  title: string;
  type: JobType;
  quantity: number;
  description: string;
  requirements: string | null;
  majors: string; // Ngành tương thích
  location: string | null;
  salary: string;
  dateDeadline: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  status: JobStatus;
  createdAt: string;
}

export interface Event {
  id: string;
  title: string;
  type: EventType;
  date: string;
  location: string;
  description: string | null;
  budget: number | null;
  joinCount: number;
  status: EventStatus;
  enterpriseIds: string[];
  departmentIds: string[];
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  dueDate: string;
  status: TaskStatus;
  priority: TaskPriority;
  enterpriseId: string | null;
  enterpriseName?: string;
  interactionId: string | null;
  assigneeId: string;
  assigneeName?: string;
  creatorId: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  content: string;
  type: "MOU_EXPIRY" | "TASK_DUE" | "INTERACTION_REMINDER" | "SYSTEM";
  isRead: boolean;
  link: string | null;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string | null;
  userName?: string;
  action: string;
  module: string;
  recordId: string | null;
  description: string;
  ipAddress: string | null;
  createdAt: string;
}

export interface DashboardStats {
  totalEnterprises: number;
  activeEnterprises: number;
  newEnterprisesThisMonth: number;
  enterpriseByStatus: { status: EnterpriseStatus; count: number }[];
  enterpriseByField: { field: string; count: number }[];
  currentMous: number;
  expiringMous: number; // Trong 90 ngày tới
  expiredMous: number;
  jobsCount: number;
  eventsCount: number;
  tasksPending: number;
  pipelineStats: { stage: EnterpriseStatus; count: number; percentage: number }[];
  engagementLeaderboard: { departmentName: string; eventCount: number; mouCount: number; totalScore: number }[];
}
