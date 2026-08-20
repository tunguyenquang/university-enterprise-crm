// ==========================================
// NHÃN & MÀU SẮC DÙNG CHUNG (tiếng Việt)
// ==========================================
// Gom các bảng nhãn/màu trạng thái về một nơi để các component không lặp lại
// (trước đây bị trùng ở App.tsx, CrmDashboard, PipelineKanban, EnterpriseDetails).

import {
  EnterpriseStatus,
  EnterprisePriority,
  DocumentStatus,
  DocumentType,
  InteractionType,
  JobType,
  JobStatus,
  EventType,
  EventStatus,
  DepartmentType,
  TaskStatus,
  TaskPriority,
} from "../types/crm.ts";

export const ENTERPRISE_STATUS_LABELS: Record<EnterpriseStatus, string> = {
  [EnterpriseStatus.TIEM_NANG]: "Tiềm năng",
  [EnterpriseStatus.DANG_TIEP_CAN]: "Đang tiếp cận",
  [EnterpriseStatus.DANG_TRAO_DOI]: "Đang trao đổi",
  [EnterpriseStatus.DA_KY_MOU]: "Đã ký MOU",
  [EnterpriseStatus.DANG_TRIEN_KHAI]: "Đang triển khai",
  [EnterpriseStatus.TAM_NGUNG]: "Tạm ngưng",
  [EnterpriseStatus.NGUNG_HOP_TAC]: "Ngừng hợp tác",
};

export const ENTERPRISE_STATUS_COLORS: Record<EnterpriseStatus, string> = {
  [EnterpriseStatus.TIEM_NANG]: "bg-gray-100 text-gray-800 border-gray-200",
  [EnterpriseStatus.DANG_TIEP_CAN]: "bg-blue-50 text-blue-800 border-blue-200",
  [EnterpriseStatus.DANG_TRAO_DOI]: "bg-orange-50 text-orange-800 border-orange-200",
  [EnterpriseStatus.DA_KY_MOU]: "bg-blue-50 text-blue-800 border-blue-200",
  [EnterpriseStatus.DANG_TRIEN_KHAI]: "bg-emerald-50 text-emerald-800 border-emerald-200",
  [EnterpriseStatus.TAM_NGUNG]: "bg-amber-100 text-amber-800 border-amber-200",
  [EnterpriseStatus.NGUNG_HOP_TAC]: "bg-red-50 text-red-800 border-red-200",
};

export const ENTERPRISE_PRIORITY_LABELS: Record<EnterprisePriority, string> = {
  [EnterprisePriority.CHIEN_LUOC]: "Đối tác chiến lược",
  [EnterprisePriority.QUAN_TRONG]: "Quan trọng",
  [EnterprisePriority.TIEM_NANG]: "Tiềm năng trung hạn",
  [EnterprisePriority.THUONG]: "Thông thường",
};

export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  [DocumentStatus.SOAN_THAO]: "Đang soạn thảo",
  [DocumentStatus.TRINH_KY]: "Đang trình ký",
  [DocumentStatus.DA_KY]: "Đã ký, đang hiệu lực",
  [DocumentStatus.HET_HAN]: "Đã hết hạn",
  [DocumentStatus.THANH_LY]: "Đã thanh lý",
};

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  [JobStatus.NEW]: "Mới",
  [JobStatus.ACTIVE]: "Đang tuyển",
  [JobStatus.CLOSED]: "Đã đóng",
  [JobStatus.COMPLETED]: "Hoàn thành",
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  [TaskStatus.TODO]: "Cần làm",
  [TaskStatus.IN_PROGRESS]: "Đang làm",
  [TaskStatus.COMPLETED]: "Hoàn thành",
};

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  [TaskPriority.HIGH]: "Cao",
  [TaskPriority.MEDIUM]: "Trung bình",
  [TaskPriority.LOW]: "Thấp",
};

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  [DocumentType.MOU]: "MOU - Biên bản ghi nhớ",
  [DocumentType.MOA]: "MOA - Thỏa thuận hợp tác",
  [DocumentType.CONTRACT]: "Hợp đồng khung",
  [DocumentType.OTHER]: "Văn bản khác",
};

export const INTERACTION_TYPE_LABELS: Record<InteractionType, string> = {
  [InteractionType.CALL]: "Gọi điện thoại",
  [InteractionType.EMAIL]: "Trao đổi qua email",
  [InteractionType.MEETING_OFFLINE]: "Họp trực tiếp",
  [InteractionType.MEETING_ONLINE]: "Họp trực tuyến",
  [InteractionType.VISIT]: "Tham quan doanh nghiệp",
  [InteractionType.WORKSHOP]: "Seminar / Hội thảo",
  [InteractionType.MOU_SIGNING]: "Ký kết văn bản",
  [InteractionType.FOLLOW_UP]: "Liên hệ theo dõi",
  [InteractionType.JOB_REQ]: "Tiếp nhận nhu cầu tuyển dụng",
  [InteractionType.PROPOSAL]: "Đề xuất hợp tác",
};

export const JOB_TYPE_LABELS: Record<JobType, string> = {
  [JobType.FULLTIME]: "Toàn thời gian",
  [JobType.PARTTIME]: "Bán thời gian",
  [JobType.INTERN]: "Thực tập",
  [JobType.CTV]: "Cộng tác viên",
};

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  [EventType.WORKSHOP]: "Workshop",
  [EventType.SEMINAR]: "Seminar / Hội thảo",
  [EventType.JOB_FAIR]: "Ngày hội việc làm",
  [EventType.COMPANY_TOUR]: "Tham quan doanh nghiệp",
  [EventType.SPONSORSHIP]: "Tài trợ",
  [EventType.MENTORSHIP]: "Cố vấn / Mentorship",
};

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  [EventStatus.UPCOMING]: "Sắp diễn ra",
  [EventStatus.ONGOING]: "Đang diễn ra",
  [EventStatus.COMPLETED]: "Đã hoàn thành",
  [EventStatus.CANCELLED]: "Đã hủy",
};

export const DEPARTMENT_TYPE_LABELS: Record<DepartmentType, string> = {
  [DepartmentType.KHOA]: "Khoa",
  [DepartmentType.PHONG]: "Phòng",
  [DepartmentType.TRUNG_TAM]: "Trung tâm",
};

// Màu badge theo trạng thái, dùng chung cho mọi màn danh sách.
export const DOCUMENT_STATUS_COLORS: Record<DocumentStatus, string> = {
  [DocumentStatus.SOAN_THAO]: "bg-gray-100 text-gray-700 border-gray-200",
  [DocumentStatus.TRINH_KY]: "bg-amber-50 text-amber-800 border-amber-200",
  [DocumentStatus.DA_KY]: "bg-emerald-50 text-emerald-800 border-emerald-200",
  [DocumentStatus.HET_HAN]: "bg-red-50 text-red-800 border-red-200",
  [DocumentStatus.THANH_LY]: "bg-slate-100 text-slate-600 border-slate-200",
};

export const JOB_STATUS_COLORS: Record<JobStatus, string> = {
  [JobStatus.NEW]: "bg-blue-50 text-blue-800 border-blue-200",
  [JobStatus.ACTIVE]: "bg-emerald-50 text-emerald-800 border-emerald-200",
  [JobStatus.CLOSED]: "bg-slate-100 text-slate-600 border-slate-200",
  [JobStatus.COMPLETED]: "bg-indigo-50 text-indigo-800 border-indigo-200",
};

export const EVENT_STATUS_COLORS: Record<EventStatus, string> = {
  [EventStatus.UPCOMING]: "bg-amber-50 text-amber-800 border-amber-200",
  [EventStatus.ONGOING]: "bg-blue-50 text-blue-800 border-blue-200",
  [EventStatus.COMPLETED]: "bg-emerald-50 text-emerald-800 border-emerald-200",
  [EventStatus.CANCELLED]: "bg-red-50 text-red-800 border-red-200",
};

export const TASK_PRIORITY_COLORS: Record<TaskPriority, string> = {
  [TaskPriority.HIGH]: "bg-red-50 text-red-700 border-red-200",
  [TaskPriority.MEDIUM]: "bg-amber-50 text-amber-700 border-amber-200",
  [TaskPriority.LOW]: "bg-slate-100 text-slate-600 border-slate-200",
};

export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  [TaskStatus.TODO]: "bg-slate-100 text-slate-700 border-slate-200",
  [TaskStatus.IN_PROGRESS]: "bg-blue-50 text-blue-800 border-blue-200",
  [TaskStatus.COMPLETED]: "bg-emerald-50 text-emerald-800 border-emerald-200",
};

// Tra nhãn an toàn: giá trị lạ (dữ liệu cũ, enum mới chưa khai nhãn) vẫn hiển thị được
// thay vì để lộ chuỗi enum thô hoặc "undefined" ra giao diện.
export function labelOf<T extends string>(
  labels: Record<string, string>,
  value: T | null | undefined,
  fallback = "—",
): string {
  if (!value) return fallback;
  return labels[value] ?? String(value);
}

// Viết tắt tên người cho avatar: lấy chữ đầu của họ và của tên (vd "Lê Hoài An" -> "LA").
// Trước đây dùng fullName.slice(-2) nên ra những mảnh vô nghĩa như "ng", "ài", "ơi".
export function initialsOf(fullName?: string | null): string {
  const parts = (fullName || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Định dạng ngày tháng kiểu Việt Nam, an toàn với giá trị rỗng.
export function formatDateVi(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("vi-VN");
}
