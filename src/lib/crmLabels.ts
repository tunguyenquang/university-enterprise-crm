// ==========================================
// NHÃN & MÀU SẮC DÙNG CHUNG (tiếng Việt)
// ==========================================
// Gom các bảng nhãn/màu trạng thái về một nơi để các component không lặp lại
// (trước đây bị trùng ở App.tsx, CrmDashboard, PipelineKanban, EnterpriseDetails).

import {
  EnterpriseStatus,
  EnterprisePriority,
  DocumentStatus,
  JobStatus,
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

// Định dạng ngày tháng kiểu Việt Nam, an toàn với giá trị rỗng.
export function formatDateVi(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("vi-VN");
}
