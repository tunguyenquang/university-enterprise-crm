import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { config } from "./config.ts";
import { DbService } from "./db.types.ts";
import { getPermissionsForRole } from "./rbac.ts";
import {
  Role,
  RoleCode,
  Permission,
  Department,
  DepartmentType,
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
  DashboardStats
} from "../types/crm.ts";

// Cho phép override thư mục dữ liệu qua biến môi trường DB_DIR (hữu ích cho test cô lập).
const DB_DIR = process.env.DB_DIR
  ? path.resolve(process.env.DB_DIR)
  : path.join(process.cwd(), "data");
const DB_FILE = path.join(DB_DIR, "db.json");

interface DatabaseSchema {
  roles: Role[];
  permissions: Permission[];
  departments: Department[];
  users: User[];
  enterprises: Enterprise[];
  contacts: Contact[];
  interactions: Interaction[];
  partnershipDocuments: PartnershipDocument[];
  jobs: Job[];
  events: Event[];
  tasks: Task[];
  notifications: Notification[];
  auditLogs: AuditLog[];
  // Bản đồ email -> bcrypt hash. Lưu trực tiếp trong DB để không mất khi server restart.
  credentials: Record<string, string>;
}

// Global In-Memory representation
let db: DatabaseSchema = {
  roles: [],
  permissions: [],
  departments: [],
  users: [],
  enterprises: [],
  contacts: [],
  interactions: [],
  partnershipDocuments: [],
  jobs: [],
  events: [],
  tasks: [],
  notifications: [],
  auditLogs: [],
  credentials: {}
};

// Băm mật khẩu bằng bcrypt (an toàn, có salt). Đồng bộ cho đơn giản khi seed/tạo user.
export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, config.bcryptRounds);
}

// So khớp mật khẩu thô với bcrypt hash đã lưu.
export function comparePassword(plain: string, hash: string): boolean {
  if (!hash) return false;
  try {
    return bcrypt.compareSync(plain, hash);
  } catch {
    return false;
  }
}

function initializeSeeds() {
  // 1. Setup Roles
  const roles: Role[] = [
    { id: "r-admin", name: "Super Admin", code: RoleCode.SUPER_ADMIN, description: "Quản trị viên toàn hệ thống và phân quyền" },
    { id: "r-leader", name: "Lãnh đạo / Ban Giám hiệu", code: RoleCode.LEADER, description: "Xem báo cáo, KPIs, giám sát hợp tác" },
    { id: "r-qhdn-mgr", name: "Quản trị phòng QHDN", code: RoleCode.QHDN_MANAGER, description: "Duyệt dữ liệu, điều phối cán bộ phòng QHDN" },
    { id: "r-qhdn-staff", name: "Chuyên viên QHDN", code: RoleCode.QHDN_STAFF, description: "Cập nhật trực tiếp thông tin doanh nghiệp, MOU, liên hệ" },
    { id: "r-faculty", name: "Cán bộ đại diện Khoa", code: RoleCode.FACULTY_REPRESENTATIVE, description: "Quản lý hợp tác liên quan trực tiếp đến khoa" },
    { id: "r-student", name: "Trung tâm Hỗ trợ SV", code: RoleCode.STUDENT_SUPPORT, description: "Quản lý tuyển dụng, thực tập, sự kiện việc làm" },
    { id: "r-startup", name: "Trung tâm Đổi mới Sáng tạo", code: RoleCode.INNOVATION_CENTER, description: "Đồng hành khởi nghiệp, tài trợ đề án" }
  ];

  // 2. Setup Permissions
  const permissions: Permission[] = [
    { id: "p1", name: "Xem tất cả doanh nghiệp", code: "view_all_enterprises", group: "ENTERPRISE" },
    { id: "p2", name: "Xem doanh nghiệp được gán", code: "view_assigned_enterprises", group: "ENTERPRISE" },
    { id: "p3", name: "Tạo doanh nghiệp mới", code: "create_enterprise", group: "ENTERPRISE" },
    { id: "p4", name: "Chỉnh sửa doanh nghiệp", code: "edit_enterprise", group: "ENTERPRISE" },
    { id: "p5", name: "Xóa doanh nghiệp", code: "delete_enterprise", group: "ENTERPRISE" },
    { id: "p6", name: "Quản lý người liên hệ", code: "manage_contacts", group: "CONTACT" },
    { id: "p7", name: "Quản lý nhật ký tương tác", code: "manage_interactions", group: "INTERACTION" },
    { id: "p8", name: "Quản lý thỏa thuận MOU", code: "manage_mou", group: "MOU" },
    { id: "p9", name: "Quản lý tin tuyển dụng", code: "manage_jobs", group: "JOB" },
    { id: "p10", name: "Quản lý sự kiện hợp tác", code: "manage_events", group: "EVENT" },
    { id: "p11", name: "Xem Dashboard tổng quan", code: "view_dashboard", group: "DASHBOARD" },
    { id: "p12", name: "Quản lý người dùng hệ thống", code: "manage_users", group: "ADMIN" },
    { id: "p13", name: "Quản lý danh mục chung", code: "manage_master_data", group: "ADMIN" }
  ];

  // 3. Departments
  const departments: Department[] = [
    { id: "d-qhdn", name: "Phòng Quan hệ Doanh nghiệp", code: "P_QHDN", type: DepartmentType.PHONG, parentId: null },
    { id: "d-support", name: "Trung tâm Hỗ trợ Sinh viên & Việc làm", code: "TT_HTSV", type: DepartmentType.TRUNG_TAM, parentId: null },
    { id: "d-startup", name: "Trung tâm Đổi mới Sáng tạo & Khởi nghiệp", code: "TT_DMST_KN", type: DepartmentType.TRUNG_TAM, parentId: null },
    { id: "d-cntt", name: "Khoa Công nghệ thông tin", code: "K_CNTT", type: DepartmentType.KHOA, parentId: null },
    { id: "d-dtvt", name: "Khoa Điện tử Viễn thông", code: "K_DTVT", type: DepartmentType.KHOA, parentId: null },
    { id: "d-ktql", name: "Khoa Kinh tế & Quản lý", code: "K_KTQL", type: DepartmentType.KHOA, parentId: null }
  ];

  // 4. Mapped Users
  const users: User[] = [
    {
      id: "u-admin",
      email: "admin@hust.edu.vn",
      fullName: "Nguyễn Văn Admin",
      phone: "0901234567",
      isActive: true,
      roleId: "r-admin",
      departmentId: "d-qhdn",
      createdAt: new Date().toISOString()
    },
    {
      id: "u-leader",
      email: "bgh.hai@hust.edu.vn",
      fullName: "PGS. TS. Trần Đức Hải",
      phone: "0987654321",
      isActive: true,
      roleId: "r-leader",
      departmentId: null,
      createdAt: new Date().toISOString()
    },
    {
      id: "u-dung",
      email: "qhdn.dung@hust.edu.vn",
      fullName: "ThS. Hoàng Trung Dũng",
      phone: "0912345678",
      isActive: true,
      roleId: "r-qhdn-mgr",
      departmentId: "d-qhdn",
      createdAt: new Date().toISOString()
    },
    {
      id: "u-an",
      email: "qhdn.an@hust.edu.vn",
      fullName: "CN. Lê Hoài An",
      phone: "0934567890",
      isActive: true,
      roleId: "r-qhdn-staff",
      departmentId: "d-qhdn",
      createdAt: new Date().toISOString()
    },
    {
      id: "u-minh",
      email: "cntt.minh@hust.edu.vn",
      fullName: "TS. Nguyễn Khánh Minh",
      phone: "0945678901",
      isActive: true,
      roleId: "r-faculty",
      departmentId: "d-cntt",
      createdAt: new Date().toISOString()
    }
  ];

  // Băm mật khẩu mặc định cho từng user seed (lấy từ cấu hình, không viết cứng).
  const credentials: Record<string, string> = {};
  users.forEach(user => {
    credentials[user.email] = hashPassword(config.seedDefaultPassword);
  });

  // 5. Enterprises
  const enterprises: Enterprise[] = [
    {
      id: "e-fpt",
      code: "DN-FSOFT",
      name: "Công ty Cổ phần Phần mềm FPT (FPT Software)",
      shortName: "FPT Software",
      taxCode: "0101248141",
      field: "Công nghệ thông tin & Viễn thông",
      scale: "Trên 500 nhân sự",
      type: "Tư nhân Việt Nam",
      address: "Tòa nhà FPT, Phố Duy Tân, Dịch Vọng Hậu",
      city: "Hà Nội",
      website: "https://fptsoftware.com",
      linkedin: "https://linkedin.com/company/fpt-software",
      description: "Doanh nghiệp xuất khẩu phần mềm lớn nhất Việt Nam, đối tác tuyển dụng hàng đầu cho sinh viên block CNTT, Điện tử.",
      status: EnterpriseStatus.DANG_TRIEN_KHAI,
      priority: EnterprisePriority.CHIEN_LUOC,
      picId: "u-an",
      internalNotes: "Được hỗ trợ tài trợ thiết bị phòng Lab hàng năm. Đang có chiến dịch tài trợ 50 suất học bổng thực tập tài năng.",
      facultyIds: ["d-cntt", "d-dtvt"],
      majorIds: ["d-cntt"],
      tags: ["Lab Thiết Bị", "Học Bổng", "Internship", "Chiến Lược"],
      createdAt: new Date(Date.now() - 360 * 24 * 3600 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "e-viettel",
      code: "DN-VIETTEL",
      name: "Tập đoàn Công nghiệp - Viễn thông Quân đội Viettel",
      shortName: "Viettel Group",
      taxCode: "0100109106",
      field: "Viễn thông, An ninh mạng & Công nghệ cao",
      scale: "Trên 500 nhân sự",
      type: "Doanh nghiệp Nhà nước",
      address: "Lô D26, Khu đô thị mới Cầu Giấy",
      city: "Hà Nội",
      website: "https://viettel.com.vn",
      linkedin: "https://linkedin.com/company/viettel-group",
      description: "Tập đoàn công nghệ, viễn thông hàng đầu Việt Nam hoạt động tại 11 quốc gia. Thế mạnh hợp tác nghiên cứu phát triển hàng không vũ trụ.",
      status: EnterpriseStatus.DA_KY_MOU,
      priority: EnterprisePriority.CHIEN_LUOC,
      picId: "u-an",
      internalNotes: "Vừa ký lại biên bản thỏa thuận MOU năm nay, do Thầy Hiệu trưởng trực tiếp chủ biên.",
      facultyIds: ["d-cntt", "d-dtvt"],
      majorIds: ["d-dtvt"],
      tags: ["Nghiên Cứu", "Security", "Quốc Phòng", "Viễn Thông"],
      createdAt: new Date(Date.now() - 120 * 24 * 3600 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "e-vng",
      code: "DN-VNG",
      name: "Công ty Cổ phần VNG (VNG Corporation)",
      shortName: "VNG Corp",
      taxCode: "0303491621",
      field: "Công nghệ thông tin & Game & Fintech",
      scale: "Trên 500 nhân sự",
      type: "Tư nhân Việt Nam",
      address: "Z06 Đường số 13, Tân Thuận Đông, Quận 7",
      city: "TP. Hồ Chí Minh",
      website: "https://vng.com.vn",
      linkedin: "https://linkedin.com/company/vng",
      description: "Kỳ lân công nghệ đầu tiên của Việt Nam nổi bật với Zalo, ZaloPay và mảng dịch vụ đám mây, game.",
      status: EnterpriseStatus.DANG_TRAO_DOI,
      priority: EnterprisePriority.QUAN_TRONG,
      picId: "u-an",
      internalNotes: "Đang bàn thảo hợp tác xây dựng hệ thống Server Cloud thử nghiệm cho nhà trường.",
      facultyIds: ["d-cntt"],
      majorIds: ["d-cntt"],
      tags: ["Fintech", "ZaloPay", "Cloud-Lab"],
      createdAt: new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "e-tcb",
      code: "DN-TCB",
      name: "Ngân hàng Thương mại Cổ phần Kỹ thương Việt Nam (Techcombank)",
      shortName: "Techcombank",
      taxCode: "0100230800",
      field: "Tài chính & Ngân hàng",
      scale: "Trên 500 nhân sự",
      type: "Tư nhân Việt Nam",
      address: "Số 6 Phố Quang Trung, Trần Hưng Đạo, Hoàn Kiếm",
      city: "Hà Nội",
      website: "https://techcombank.com",
      linkedin: "https://linkedin.com/company/techcombank",
      description: "Ngân hàng TMCP hàng đầu có định hướng số hóa mạnh mẽ, thường xuyên tuyển dụng sinh viên khối ngành Kinh tế và CNTT.",
      status: EnterpriseStatus.TIEM_NANG,
      priority: EnterprisePriority.TIEM_NANG,
      picId: "u-dung",
      internalNotes: "Khoa KTQL đề xuất chuẩn bị tiếp cận để xin quỹ học bổng phát triển kỹ năng số cho sinh viên.",
      facultyIds: ["d-ktql", "d-cntt"],
      majorIds: ["d-ktql"],
      tags: ["Tài Trợ", "Học Bổng", "Ngân Hàng Số"],
      createdAt: new Date(Date.now() - 45 * 24 * 3600 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  // 6. Enterprise Contacts
  const contacts: Contact[] = [
    {
      id: "c-fpt-1",
      enterpriseId: "e-fpt",
      name: "Bà Nguyễn Thị Hoàng Yến",
      position: "Trưởng phòng Thu hút tài năng trẻ (Hanoi Regional)",
      department: "Phòng Tuyển dụng FSOFT",
      email: "yen_n_hoang@fsoft.com.vn",
      phone: "0904555888",
      zalo: "0904555888",
      linkedin: "https://linkedin.com/in/yen-hoang-fpt",
      notes: "Đầu mối tiếp nhận chính về quyền lợi thực tập và đề xuất tham quan doanh nghiệp (Company tour).",
      isPrimary: true,
      isActive: true,
      createdAt: new Date(Date.now() - 300 * 24 * 3600 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "c-fpt-2",
      enterpriseId: "e-fpt",
      name: "Ông Lương Minh Hữu",
      position: "Giám đốc Nhân sự (CHRO)",
      department: "Ban Giám đốc Nhân sự",
      email: "huu_l_minh@fpt.com",
      phone: "0912111222",
      zalo: null,
      linkedin: null,
      notes: "Thường tham gia các sự kiện ký kết trọng đại cùng PGS. TS. Trần Đức Hải.",
      isPrimary: false,
      isActive: true,
      createdAt: new Date(Date.now() - 300 * 24 * 3600 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "c-viettel-1",
      enterpriseId: "e-viettel",
      name: "Thiếu tá Trần Quang Hưng",
      position: "Giám đốc Hợp tác Giáo dục & Tuyển dụng",
      department: "Ban Nhân sự Tập đoàn",
      email: "hungtq_viettel@viettel.com.vn",
      phone: "0982333777",
      zalo: "0982333777",
      linkedin: null,
      notes: "Rất nhiệt tình, sẵn sàng chủ động tham gia các talkshow về IoT & 5G do nhà trường tổ chức.",
      isPrimary: true,
      isActive: true,
      createdAt: new Date(Date.now() - 100 * 24 * 3600 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  // 7. Interactions
  const interactions: Interaction[] = [
    {
      id: "int-fpt-1",
      enterpriseId: "e-fpt",
      date: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
      type: InteractionType.MEETING_OFFLINE,
      content: "Họp trực tiếp tại văn phòng Phòng QHDN thống nhất chương trình tài trợ Lab công nghệ IoT.",
      result: "FPT Software đồng ý ký văn bản liên kết hỗ trợ 10 bộ kit thực hành IoT tổng trị giá 150 triệu đồng.",
      followUpTasks: "Soạn dự thảo biên bàn tiếp nhận tài trợ gửi Phó phòng QHDN duyệt.",
      followUpDeadline: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString(),
      followUpStatus: "COMPLETED",
      picId: "u-an",
      contactIds: ["c-fpt-1"],
      createdAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: "int-viettel-1",
      enterpriseId: "e-viettel",
      date: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
      type: InteractionType.CALL,
      content: "Gọi điện mời Chuyên gia Viettel tham gia phiên chuyên môn phản biện cải cách chương trình đào tạo khoa Điện tử viễn thông năm 2026.",
      result: "Thiếu tá Hưng xác nhận cử 2 Thạc sĩ dày dặn kinh nghiệm vô thiết kế giáo trình.",
      followUpTasks: "Gửi thư mời chính thức kèm Slide dự kiến chương trình qua email anh Hưng.",
      followUpDeadline: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString(),
      followUpStatus: "PENDING",
      picId: "u-an",
      contactIds: ["c-viettel-1"],
      createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString()
    }
  ];

  // 8. MOUs (Partnership Documents)
  const partnershipDocuments: PartnershipDocument[] = [
    {
      id: "mou-fpt",
      code: "12/2025/MOU-HUST-FPT",
      type: DocumentType.MOU,
      enterpriseId: "e-fpt",
      departmentId: "d-qhdn",
      signDate: new Date("2025-05-10").toISOString(),
      effectiveDate: new Date("2025-05-10").toISOString(),
      expiryDate: new Date("2027-05-10").toISOString(), // Hiệu lực 2 năm
      picId: "u-an",
      content: "Hợp tác chiến lược đào tạo thực hành xuất sắc, tiếp nhận cam kết tối thiểu 150 thực tập sinh mỗi năm học, tài trợ cơ sở vật chất phòng Lab CNTT.",
      status: DocumentStatus.DA_KY,
      fileUrl: "/files/mou_hust_fpt_signed.pdf",
      createdAt: new Date("2025-05-10").toISOString()
    },
    {
      id: "mou-viettel",
      code: "09/2026/MOU-HUST-VIETTEL",
      type: DocumentType.MOU,
      enterpriseId: "e-viettel",
      departmentId: "d-qhdn",
      signDate: new Date("2026-03-01").toISOString(),
      effectiveDate: new Date("2026-03-01").toISOString(),
      expiryDate: new Date("2029-03-01").toISOString(), // Hiệu lực 3 năm
      picId: "u-an",
      content: "Nghiên cứu chung các ứng dụng AI & Mạng di động viễn thông băng thông siêu rộng, phối hợp trao giải cuộc thi Sáng tạo trẻ, trao học bổng hỗ trợ sinh viên nghèo vượt khó.",
      status: DocumentStatus.DA_KY,
      fileUrl: "/files/mou_hust_viettel_signed.pdf",
      createdAt: new Date("2026-03-01").toISOString()
    },
    {
      id: "mou-vng",
      code: "15/MOU-HUST-VNG",
      type: DocumentType.MOU,
      enterpriseId: "e-vng",
      departmentId: "d-qhdn",
      signDate: new Date("2024-08-15").toISOString(),
      effectiveDate: new Date("2024-08-15").toISOString(),
      expiryDate: new Date("2026-08-15").toISOString(), // Hết hạn vào tháng 8 năm 2026, tức cực kì gần so với mốc hiện tại tháng 6-2026
      picId: "u-dung",
      content: "Cung cấp hạ tầng số thử nghiệm, hỗ trợ CLB sinh viên khởi nghiệp, đào tạo các mảng AI, Software, Cloud computing.",
      status: DocumentStatus.DA_KY,
      fileUrl: null,
      createdAt: new Date("2024-08-15").toISOString()
    }
  ];

  // 9. Jobs
  const jobs: Job[] = [
    {
      id: "j-fpt-1",
      enterpriseId: "e-fpt",
      title: "Thực tập sinh Lập trình Web Full stack (React & Node.js)",
      type: JobType.INTERN,
      quantity: 30,
      description: "Tham gia đào tạo bài bản 2 tháng đầu có trợ cấp, sau đó gia nhập dự án thực tế nước ngoài cùng các chuyên gia hàng đầu.",
      requirements: "Nắm vững cấu trúc dữ liệu, giải thuật, có kiến thức cơ bản về Javascript/HTML/CSS, ưu tiên sinh viên năm 3, năm 4 trường HUST ngành CNTT.",
      majors: "Công nghệ thông tin, Hệ thống thông tin",
      location: "FPT Software Tower, Hà Nội",
      salary: "3,000,000đ - 6,000,000đ học việc",
      dateDeadline: new Date(Date.now() + 25 * 24 * 3600 * 1000).toISOString(),
      contactName: "Nguyễn Thị Hoàng Yến",
      contactEmail: "yen_n_hoang@fsoft.com.vn",
      contactPhone: "0904555888",
      status: JobStatus.ACTIVE,
      createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: "j-vng-1",
      enterpriseId: "e-vng",
      title: "Kỹ sư Phát triển Trí tuệ Nhân tạo di dộng (AI Mobile Dev)",
      type: JobType.FULLTIME,
      quantity: 5,
      description: "Nghiên cứu tích hợp các mô hình NLP và Generative AI lên ứng dụng Zalo cài đặt trên iOS/Android.",
      requirements: "Có kinh nghiệm chạy Python, thư viện PyTorch, TensorFlow. Ưu tiên sinh viên tốt nghiệp xuất sắc hoặc có bài báo khoa học.",
      majors: "Khoa học máy tính, Trí tuệ nhân tạo",
      location: "VNG Campus, TP.HCM",
      salary: "18,000,000đ - 25,000,000đ khởi điểm",
      dateDeadline: new Date(Date.now() + 45 * 24 * 3600 * 1000).toISOString(),
      contactName: "HR VNG Career",
      contactEmail: "cv@vng.com.vn",
      contactPhone: null,
      status: JobStatus.ACTIVE,
      createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString()
    }
  ];

  // 10. Events
  const events: Event[] = [
    {
      id: "ev-fpt-1",
      title: "FPT Software Day 2026 - Cơ hội kiến tập và hướng nghiệp sớm",
      type: EventType.COMPANY_TOUR,
      date: new Date(Date.now() + 10 * 24 * 3600 * 1000).toISOString(),
      location: "FPT Software Campus, Hòa Lạc, Hà Nội",
      description: "Chương trình tham quan doanh nghiệp thực tế, trải nghiệm văn hóa công nghệ, giao lưu chuyên viên R&D, đăng ký phỏng vấn thực tập.",
      budget: 15000000,
      joinCount: 120,
      status: EventStatus.UPCOMING,
      enterpriseIds: ["e-fpt"],
      departmentIds: ["d-qhdn", "d-cntt"],
      createdAt: new Date().toISOString()
    },
    {
      id: "ev-work-1",
      title: "Seminar: Trí tuệ Nhân tạo ứng dụng trong Đổi mới sáng tạo năm 2026",
      type: EventType.WORKSHOP,
      date: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString(),
      location: "Hội trường Thư viện Tạ Quang Bửu, HUST",
      description: "Workshop định hướng nghiên cứu AI và ươm tạo start-up công nghệ cho sinh viên bách khoa. Đồng tài trợ bởi VNG & Viettel.",
      budget: 35000000,
      joinCount: 450,
      status: EventStatus.COMPLETED,
      enterpriseIds: ["e-vng", "e-viettel"],
      departmentIds: ["d-startup", "d-cntt"],
      createdAt: new Date().toISOString()
    }
  ];

  // 11. Tasks
  const tasks: Task[] = [
    {
      id: "t-1",
      title: "Lời mời anh Hưng họp góp ý CTĐT Điện tử",
      description: "Gọi kết nối anh Hưng (Viettel) hẹn lịch họp trực tiếp tại khoa DTVT để rà soát chương trình học.",
      dueDate: new Date(Date.now() + 1 * 24 * 3600 * 1000).toISOString(), // Ngày mai hết hạn
      status: TaskStatus.TODO,
      priority: TaskPriority.HIGH,
      enterpriseId: "e-viettel",
      interactionId: "int-viettel-1",
      assigneeId: "u-an",
      creatorId: "u-dung",
      createdAt: new Date().toISOString()
    },
    {
      id: "t-2",
      title: "Dự thảo biên bản tiếp nhận tìa trợ KIT IoT",
      description: "Soạn gửi ThS. Dũng kiểm tra phê duyệt bản thảo nhận Kit tài trợ thực hành của FPT Software.",
      dueDate: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString(),
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.MEDIUM,
      enterpriseId: "e-fpt",
      interactionId: "int-fpt-1",
      assigneeId: "u-an",
      creatorId: "u-dung",
      createdAt: new Date().toISOString()
    },
    {
      id: "t-3",
      title: "Theo dõi gia hạn văn bản MOU với VNG",
      description: "MOU này hiệu lực đến 15/08/2026, sắp hết hạn trong khoảng 60 ngày tới. Liên hệ chị HR VNG hẹn lịch trao đổi tái ký gia hạn.",
      dueDate: new Date(Date.now() + 15 * 24 * 3600 * 1000).toISOString(),
      status: TaskStatus.TODO,
      priority: TaskPriority.HIGH,
      enterpriseId: "e-vng",
      interactionId: null,
      assigneeId: "u-dung",
      creatorId: "u-dung",
      createdAt: new Date().toISOString()
    }
  ];

  // 12. Audit Logs
  const auditLogs: AuditLog[] = [
    {
      id: "log-1",
      userId: "u-admin",
      action: "INITIAL_SEED",
      module: "SYSTEM",
      recordId: null,
      description: "Khởi tạo dữ liệu mẫu thành công cho hệ thống University Enterprise CRM.",
      ipAddress: "127.0.0.1",
      createdAt: new Date().toISOString()
    }
  ];

  db = {
    roles,
    permissions,
    departments,
    users,
    enterprises,
    contacts,
    interactions,
    partnershipDocuments,
    jobs,
    events,
    tasks,
    notifications: [],
    auditLogs,
    credentials
  };
}

export function loadDatabase(): DatabaseSchema {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      const fileContent = fs.readFileSync(DB_FILE, "utf-8");
      db = JSON.parse(fileContent);
      // Ensure all arrays are initialized
      db.roles = db.roles || [];
      db.permissions = db.permissions || [];
      db.departments = db.departments || [];
      db.users = db.users || [];
      db.enterprises = db.enterprises || [];
      db.contacts = db.contacts || [];
      db.interactions = db.interactions || [];
      db.partnershipDocuments = db.partnershipDocuments || [];
      db.jobs = db.jobs || [];
      db.events = db.events || [];
      db.tasks = db.tasks || [];
      db.notifications = db.notifications || [];
      db.auditLogs = db.auditLogs || [];
      db.credentials = db.credentials || {};

      // Tương thích ngược: nếu DB cũ chưa có credentials, sinh hash mặc định cho user hiện có.
      if (Object.keys(db.credentials).length === 0 && db.users.length > 0) {
        db.users.forEach(u => {
          db.credentials[u.email] = hashPassword(config.seedDefaultPassword);
        });
        saveDatabase();
      }
    } else {
      initializeSeeds();
      saveDatabase();
    }
  } catch (error) {
    console.error("Lỗi khi tải cơ sở dữ liệu: ", error);
    initializeSeeds();
  }
  return db;
}

// Ghi DB theo kiểu "atomic": ghi vào file tạm rồi đổi tên đè lên file thật.
// Nhờ vậy nếu tiến trình bị ngắt giữa chừng, db.json cũ vẫn nguyên vẹn (không hỏng/cụt).
export function saveDatabase(): void {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    const tmpFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(db, null, 2), "utf-8");
    fs.renameSync(tmpFile, DB_FILE); // rename là thao tác nguyên tử trên cùng ổ đĩa
  } catch (error) {
    console.error("Lỗi khi ghi cơ sở dữ liệu: ", error);
  }
}

// Global invocation on load
loadDatabase();

// Relational Repository utilities (CRUD simulators) - logic ĐỒNG BỘ trên file JSON.
// Object `sync` này được bọc thành dbService bất đồng bộ ở cuối file.
const sync = {
  getRoles: () => db.roles,
  getPermissions: () => db.permissions,
  getDepartments: () => db.departments,

  // Trả về danh sách mã quyền của một vai trò (dùng cho RBAC ở middleware & frontend).
  getPermissionsForRole,

  // --- Master data: Departments (CRUD) ---
  getDepartmentById: (id: string) => db.departments.find((d) => d.id === id),
  createDepartment: (dept: Omit<Department, "id">) => {
    const id = "d-" + Math.random().toString(36).substr(2, 9);
    const newDept: Department = { ...dept, id };
    db.departments.push(newDept);
    saveDatabase();
    return newDept;
  },
  updateDepartment: (id: string, data: Partial<Department>) => {
    const index = db.departments.findIndex((d) => d.id === id);
    if (index === -1) return null;
    // Chỉ ghi đè field được cung cấp (bỏ undefined), giữ id cố định.
    const safe: Partial<Department> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && key !== "id") (safe as Record<string, unknown>)[key] = value;
    }
    db.departments[index] = { ...db.departments[index], ...safe, id };
    saveDatabase();
    return db.departments[index];
  },
  deleteDepartment: (id: string) => {
    const index = db.departments.findIndex((d) => d.id === id);
    if (index === -1) return false;
    db.departments.splice(index, 1);
    saveDatabase();
    return true;
  },
  // Kiểm tra department có đang được tham chiếu không (chặn xóa nếu còn ràng buộc).
  isDepartmentInUse: (id: string): boolean => {
    const byUser = db.users.some((u) => u.departmentId === id);
    const byMou = db.partnershipDocuments.some((m) => m.departmentId === id);
    const byEnt = db.enterprises.some(
      (e) => e.facultyIds?.includes(id) || e.majorIds?.includes(id)
    );
    const byEvent = db.events.some((ev) => ev.departmentIds.includes(id));
    return byUser || byMou || byEnt || byEvent;
  },

  // --- Master data: Users (update/delete; create đã có ở trên) ---
  updateUser: (id: string, data: Partial<User>) => {
    const index = db.users.findIndex((u) => u.id === id);
    if (index === -1) return null;
    // Không cho đổi id/createdAt qua update.
    const { id: _ignoreId, createdAt: _ignoreCreated, ...rest } = data;
    // Chỉ ghi đè các field thực sự được cung cấp (bỏ qua undefined) để không xóa nhầm dữ liệu cũ.
    const safe: Partial<User> = {};
    for (const [key, value] of Object.entries(rest)) {
      if (value !== undefined) (safe as Record<string, unknown>)[key] = value;
    }
    db.users[index] = { ...db.users[index], ...safe };
    saveDatabase();
    return db.users[index];
  },
  // Vô hiệu hóa user (soft) thay vì xóa cứng để giữ toàn vẹn audit/log.
  deactivateUser: (id: string) => {
    const user = db.users.find((u) => u.id === id);
    if (!user) return false;
    user.isActive = false;
    saveDatabase();
    return true;
  },
  
  // Users
  getUsers: () => db.users,
  getUserById: (id: string) => db.users.find(u => u.id === id),
  getUserByEmail: (email: string) => db.users.find(u => u.email === email),
  createUser: (user: Omit<User, "id" | "createdAt">, passwordPlainText: string) => {
    const id = "u-" + Math.random().toString(36).substr(2, 9);
    const newUser: User = {
      ...user,
      id,
      isActive: true,
      createdAt: new Date().toISOString()
    };
    db.users.push(newUser);
    db.credentials[user.email] = hashPassword(passwordPlainText);
    saveDatabase();
    return newUser;
  },
  verifyUserPassword: (email: string, passwordPlainText: string): boolean => {
    const hash = db.credentials[email];
    return comparePassword(passwordPlainText, hash);
  },
  setUserPassword: (email: string, passwordPlainText: string): void => {
    db.credentials[email] = hashPassword(passwordPlainText);
    saveDatabase();
  },

  // Enterprises
  getEnterprises: () => db.enterprises.filter(e => !e.deletedAt),
  getEnterpriseById: (id: string) => db.enterprises.find(e => e.id === id && !e.deletedAt),
  createEnterprise: (ent: Omit<Enterprise, "id" | "createdAt" | "updatedAt">) => {
    const id = "e-" + Math.random().toString(36).substr(2, 9);
    const newEnt: Enterprise = {
      ...ent,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.enterprises.push(newEnt);
    saveDatabase();
    return newEnt;
  },
  updateEnterprise: (id: string, entData: Partial<Enterprise>) => {
    const index = db.enterprises.findIndex(e => e.id === id);
    if (index === -1) return null;
    db.enterprises[index] = {
      ...db.enterprises[index],
      ...entData,
      updatedAt: new Date().toISOString()
    };
    saveDatabase();
    return db.enterprises[index];
  },
  deleteEnterprise: (id: string, userId: string) => {
    const enterprise = db.enterprises.find(e => e.id === id);
    if (!enterprise) return false;
    enterprise.deletedAt = new Date().toISOString();
    saveDatabase();
    return true;
  },

  // Contacts
  getContacts: (enterpriseId?: string) => {
    if (enterpriseId) {
      return db.contacts.filter(c => c.enterpriseId === enterpriseId);
    }
    return db.contacts;
  },
  getContactById: (id: string) => db.contacts.find(c => c.id === id),
  createContact: (contact: Omit<Contact, "id" | "createdAt" | "updatedAt">) => {
    const id = "c-" + Math.random().toString(36).substr(2, 9);
    // If marking as primary, unmark other primary contacts for this enterprise
    if (contact.isPrimary) {
      db.contacts.forEach(c => {
        if (c.enterpriseId === contact.enterpriseId) {
          c.isPrimary = false;
        }
      });
    }
    const newContact: Contact = {
      ...contact,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    db.contacts.push(newContact);
    saveDatabase();
    return newContact;
  },
  updateContact: (id: string, contactData: Partial<Contact>) => {
    const index = db.contacts.findIndex(c => c.id === id);
    if (index === -1) return null;
    
    if (contactData.isPrimary) {
      const entId = db.contacts[index].enterpriseId;
      db.contacts.forEach(c => {
        if (c.enterpriseId === entId) {
          c.isPrimary = false;
        }
      });
    }

    db.contacts[index] = {
      ...db.contacts[index],
      ...contactData,
      updatedAt: new Date().toISOString()
    };
    saveDatabase();
    return db.contacts[index];
  },
  deleteContact: (id: string) => {
    const index = db.contacts.findIndex(c => c.id === id);
    if (index === -1) return false;
    db.contacts.splice(index, 1);
    saveDatabase();
    return true;
  },

  // Interactions (Activity / Communication logs)
  getInteractions: (enterpriseId?: string) => {
    let list = [...db.interactions];
    if (enterpriseId) {
      list = list.filter(i => i.enterpriseId === enterpriseId);
    }
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },
  getInteractionById: (id: string) => db.interactions.find(i => i.id === id),
  createInteraction: (interaction: Omit<Interaction, "id" | "createdAt">) => {
    const id = "int-" + Math.random().toString(36).substr(2, 9);
    const newInt: Interaction = {
      ...interaction,
      id,
      createdAt: new Date().toISOString()
    };
    db.interactions.push(newInt);

    // If follow-up deadline and follow-up is pending, create corresponding Task automatically!
    if (interaction.followUpDeadline && interaction.followUpStatus === "PENDING") {
      const enterprise = db.enterprises.find(e => e.id === interaction.enterpriseId);
      sync.createTask({
        title: `Phân công theo dõi LH DN ${enterprise?.shortName || enterprise?.name || ""}`,
        description: `Bắt buộc tiếp nối tương tác: ${interaction.followUpTasks || interaction.content}`,
        dueDate: interaction.followUpDeadline,
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        enterpriseId: interaction.enterpriseId,
        interactionId: id,
        assigneeId: interaction.picId || "u-an",
        creatorId: "u-admin"
      });
    }

    saveDatabase();
    return newInt;
  },
  updateInteraction: (id: string, intData: Partial<Interaction>) => {
    const index = db.interactions.findIndex(i => i.id === id);
    if (index === -1) return null;
    db.interactions[index] = {
      ...db.interactions[index],
      ...intData
    };
    // Sync task status if follow-up marked as completed
    if (intData.followUpStatus === "COMPLETED") {
      const linkedTask = db.tasks.find(t => t.interactionId === id);
      if (linkedTask) {
        linkedTask.status = TaskStatus.COMPLETED;
      }
    }
    saveDatabase();
    return db.interactions[index];
  },
  deleteInteraction: (id: string) => {
    const index = db.interactions.findIndex(i => i.id === id);
    if (index === -1) return false;
    db.interactions.splice(index, 1);
    saveDatabase();
    return true;
  },

  // MOUs / Agreements
  getMOUs: (enterpriseId?: string) => {
    if (enterpriseId) {
      return db.partnershipDocuments.filter(doc => doc.enterpriseId === enterpriseId);
    }
    return db.partnershipDocuments;
  },
  getMOUById: (id: string) => db.partnershipDocuments.find(doc => doc.id === id),
  createMOU: (mou: Omit<PartnershipDocument, "id" | "createdAt" | "updatedAt">) => {
    const id = "mou-" + Math.random().toString(36).substr(2, 9);
    const newMOU: PartnershipDocument = {
      ...mou,
      id,
      createdAt: new Date().toISOString()
    };
    db.partnershipDocuments.push(newMOU);
    saveDatabase();
    return newMOU;
  },
  updateMOU: (id: string, mouData: Partial<PartnershipDocument>) => {
    const index = db.partnershipDocuments.findIndex(doc => doc.id === id);
    if (index === -1) return null;
    db.partnershipDocuments[index] = {
      ...db.partnershipDocuments[index],
      ...mouData
    };
    saveDatabase();
    return db.partnershipDocuments[index];
  },
  deleteMOU: (id: string) => {
    const index = db.partnershipDocuments.findIndex(doc => doc.id === id);
    if (index === -1) return false;
    db.partnershipDocuments.splice(index, 1);
    saveDatabase();
    return true;
  },

  // Jobs
  getJobs: (enterpriseId?: string) => {
    if (enterpriseId) {
      return db.jobs.filter(j => j.enterpriseId === enterpriseId);
    }
    return db.jobs;
  },
  getJobById: (id: string) => db.jobs.find(j => j.id === id),
  createJob: (job: Omit<Job, "id" | "createdAt">) => {
    const id = "j-" + Math.random().toString(36).substr(2, 9);
    const newJob: Job = {
      ...job,
      id,
      createdAt: new Date().toISOString()
    };
    db.jobs.push(newJob);
    saveDatabase();
    return newJob;
  },
  updateJob: (id: string, jobData: Partial<Job>) => {
    const index = db.jobs.findIndex(j => j.id === id);
    if (index === -1) return null;
    db.jobs[index] = {
      ...db.jobs[index],
      ...jobData
    };
    saveDatabase();
    return db.jobs[index];
  },
  deleteJob: (id: string) => {
    const index = db.jobs.findIndex(j => j.id === id);
    if (index === -1) return false;
    db.jobs.splice(index, 1);
    saveDatabase();
    return true;
  },

  // Events
  getEvents: () => db.events,
  getEventById: (id: string) => db.events.find(e => e.id === id),
  createEvent: (ev: Omit<Event, "id" | "createdAt">) => {
    const id = "ev-" + Math.random().toString(36).substr(2, 9);
    const newEvent: Event = {
      ...ev,
      id,
      createdAt: new Date().toISOString()
    };
    db.events.push(newEvent);
    saveDatabase();
    return newEvent;
  },
  updateEvent: (id: string, evData: Partial<Event>) => {
    const index = db.events.findIndex(e => e.id === id);
    if (index === -1) return null;
    db.events[index] = {
      ...db.events[index],
      ...evData
    };
    saveDatabase();
    return db.events[index];
  },
  deleteEvent: (id: string) => {
    const index = db.events.findIndex(e => e.id === id);
    if (index === -1) return false;
    db.events.splice(index, 1);
    saveDatabase();
    return true;
  },

  // Tasks
  getTasks: (assigneeId?: string) => {
    let list = [...db.tasks];
    if (assigneeId) {
      list = list.filter(t => t.assigneeId === assigneeId);
    }
    return list.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  },
  getTaskById: (id: string) => db.tasks.find(t => t.id === id),
  createTask: (task: Omit<Task, "id" | "createdAt">) => {
    const id = "t-" + Math.random().toString(36).substr(2, 9);
    const newTask: Task = {
      ...task,
      id,
      createdAt: new Date().toISOString()
    };
    db.tasks.push(newTask);
    saveDatabase();

    // Trigger Notification for the assignee
    sync.createNotification({
      userId: task.assigneeId,
      title: "Bạn có công việc mới liên quan đến Doanh nghiệp",
      content: `${task.title} - Hạn hoàn thành: ${new Date(task.dueDate).toLocaleDateString("vi-VN")}`,
      type: "TASK_DUE",
      link: `/enterprises/${task.enterpriseId}`
    });

    return newTask;
  },
  updateTask: (id: string, tData: Partial<Task>) => {
    const index = db.tasks.findIndex(t => t.id === id);
    if (index === -1) return null;
    db.tasks[index] = {
      ...db.tasks[index],
      ...tData
    };
    saveDatabase();
    return db.tasks[index];
  },
  deleteTask: (id: string) => {
    const index = db.tasks.findIndex(t => t.id === id);
    if (index === -1) return false;
    db.tasks.splice(index, 1);
    saveDatabase();
    return true;
  },

  // Notifications
  getNotifications: (userId: string) => {
    return db.notifications
      .filter(n => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  createNotification: (notif: Omit<Notification, "id" | "isRead" | "createdAt">) => {
    const id = "notif-" + Math.random().toString(36).substr(2, 9);
    const newNotif: Notification = {
      ...notif,
      id,
      isRead: false,
      createdAt: new Date().toISOString()
    };
    db.notifications.push(newNotif);
    saveDatabase();
    return newNotif;
  },
  markNotificationRead: (id: string) => {
    const notif = db.notifications.find(n => n.id === id);
    if (notif) {
      notif.isRead = true;
      saveDatabase();
    }
  },

  // Audit Logs
  getAuditLogs: () => db.auditLogs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
  createAuditLog: (log: Omit<AuditLog, "id" | "createdAt">) => {
    const id = "log-" + Math.random().toString(36).substr(2, 9);
    const newLog: AuditLog = {
      ...log,
      id,
      createdAt: new Date().toISOString()
    };
    db.auditLogs.push(newLog);
    
    // Cap log list size to prevent infinite log growth
    if (db.auditLogs.length > 500) {
      db.auditLogs = db.auditLogs.slice(-500);
    }
    saveDatabase();
    return newLog;
  },

  // KPI Analytical System Dashboard Engine
  getDashboardStats: (currentUserId?: string): DashboardStats => {
    const enterprises = sync.getEnterprises();
    const mous = sync.getMOUs();
    const jobs = sync.getJobs();
    const events = sync.getEvents();
    const tasks = sync.getTasks();

    const activeStatuses = [EnterpriseStatus.DANG_TRIEN_KHAI, EnterpriseStatus.DA_KY_MOU, EnterpriseStatus.DANG_TRAO_DOI];
    const totalEnterprises = enterprises.length;
    const activeEnterprises = enterprises.filter(e => activeStatuses.includes(e.status)).length;
    
    // Month filters
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const newEnterprisesThisMonth = enterprises.filter(e => {
      const d = new Date(e.createdAt);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length;

    // Status aggregation
    const enterpriseByStatus = Object.values(EnterpriseStatus).map(st => {
      return {
        status: st,
        count: enterprises.filter(e => e.status === st).length
      };
    });

    // Field aggregation
    const fields = Array.from(new Set(enterprises.map(e => e.field)));
    const enterpriseByField = fields.map(f => {
      return {
        field: f,
        count: enterprises.filter(e => e.field === f).length
      };
    });

    // MOU aggregation
    const now = new Date().getTime();
    const ninetyDays = 90 * 24 * 3600 * 1000;
    
    const currentMous = mous.filter(m => {
      const expiry = new Date(m.expiryDate).getTime();
      return m.status === DocumentStatus.DA_KY && expiry > now;
    }).length;

    const expiringMous = mous.filter(m => {
      const expiry = new Date(m.expiryDate).getTime();
      return m.status === DocumentStatus.DA_KY && (expiry - now > 0) && (expiry - now <= ninetyDays);
    }).length;

    const expiredMous = mous.filter(m => {
      const expiry = new Date(m.expiryDate).getTime();
      return m.status === DocumentStatus.HET_HAN || (m.status === DocumentStatus.DA_KY && expiry < now);
    }).length;

    // Tasks check
    const tasksPending = tasks.filter(t => t.status !== TaskStatus.COMPLETED && (!currentUserId || t.assigneeId === currentUserId)).length;

    // Pipeline percentages
    const pipelineStages = [
      EnterpriseStatus.TIEM_NANG,
      EnterpriseStatus.DANG_TIEP_CAN,
      EnterpriseStatus.DANG_TRAO_DOI,
      EnterpriseStatus.DA_KY_MOU,
      EnterpriseStatus.DANG_TRIEN_KHAI
    ];

    const pipelineStats = pipelineStages.map(stage => {
      const count = enterprises.filter(e => e.status === stage).length;
      return {
        stage,
        count,
        percentage: totalEnterprises > 0 ? parseFloat(((count / totalEnterprises) * 100).toFixed(1)) : 0
      };
    });

    // Engagement score leaderboard per department in Uni
    const engagementLeaderboard = db.departments
      .filter(dept => dept.type === DepartmentType.KHOA)
      .map(dept => {
        const matchingEvCount = events.filter(ev => ev.departmentIds.includes(dept.id)).length;
        const matchingMouCount = mous.filter(m => m.departmentId === dept.id).length;
        const matchingEnts = enterprises.filter(e => e.facultyIds?.includes(dept.id)).length;
        
        // Multiplier formula: 1 MOU = 10 pts, 1 Event = 5 pts, 1 Linked Enterprise = 2 pts
        const totalScore = (matchingMouCount * 10) + (matchingEvCount * 5) + (matchingEnts * 2);
        
        return {
          departmentName: dept.name,
          eventCount: matchingEvCount,
          mouCount: matchingMouCount,
          enterpriseCount: matchingEnts,
          totalScore
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
      engagementLeaderboard
    };
  }
};

// ==========================================
// BỌC ASYNC: đưa logic đồng bộ trên về interface DbService (Promise-based).
// server.ts dùng `await dbService.xxx()` thống nhất cho cả JSON & Prisma.
// `getPermissionsForRole` giữ đồng bộ vì chỉ tra cứu hằng số (theo interface).
// ==========================================
export const jsonDbService: DbService = {
  getRoles: async () => sync.getRoles(),
  getPermissions: async () => sync.getPermissions(),
  getPermissionsForRole: (roleId: string) => sync.getPermissionsForRole(roleId),

  getDepartments: async () => sync.getDepartments(),
  getDepartmentById: async (id) => sync.getDepartmentById(id),
  createDepartment: async (dept) => sync.createDepartment(dept),
  updateDepartment: async (id, data) => sync.updateDepartment(id, data),
  deleteDepartment: async (id) => sync.deleteDepartment(id),
  isDepartmentInUse: async (id) => sync.isDepartmentInUse(id),

  getUsers: async () => sync.getUsers(),
  getUserById: async (id) => sync.getUserById(id),
  getUserByEmail: async (email) => sync.getUserByEmail(email),
  createUser: async (user, pw) => sync.createUser(user, pw),
  updateUser: async (id, data) => sync.updateUser(id, data),
  deactivateUser: async (id) => sync.deactivateUser(id),
  verifyUserPassword: async (email, pw) => sync.verifyUserPassword(email, pw),
  setUserPassword: async (email, pw) => {
    sync.setUserPassword(email, pw);
  },

  getEnterprises: async () => sync.getEnterprises(),
  getEnterpriseById: async (id) => sync.getEnterpriseById(id),
  createEnterprise: async (ent) => sync.createEnterprise(ent),
  updateEnterprise: async (id, data) => sync.updateEnterprise(id, data),
  deleteEnterprise: async (id, userId) => sync.deleteEnterprise(id, userId),

  getContacts: async (enterpriseId) => sync.getContacts(enterpriseId),
  getContactById: async (id) => sync.getContactById(id),
  createContact: async (contact) => sync.createContact(contact),
  updateContact: async (id, data) => sync.updateContact(id, data),
  deleteContact: async (id) => sync.deleteContact(id),

  getInteractions: async (enterpriseId) => sync.getInteractions(enterpriseId),
  getInteractionById: async (id) => sync.getInteractionById(id),
  createInteraction: async (interaction) => sync.createInteraction(interaction),
  updateInteraction: async (id, data) => sync.updateInteraction(id, data),
  deleteInteraction: async (id) => sync.deleteInteraction(id),

  getMOUs: async (enterpriseId) => sync.getMOUs(enterpriseId),
  getMOUById: async (id) => sync.getMOUById(id),
  createMOU: async (mou) => sync.createMOU(mou),
  updateMOU: async (id, data) => sync.updateMOU(id, data),
  deleteMOU: async (id) => sync.deleteMOU(id),

  getJobs: async (enterpriseId) => sync.getJobs(enterpriseId),
  getJobById: async (id) => sync.getJobById(id),
  createJob: async (job) => sync.createJob(job),
  updateJob: async (id, data) => sync.updateJob(id, data),
  deleteJob: async (id) => sync.deleteJob(id),

  getEvents: async () => sync.getEvents(),
  getEventById: async (id) => sync.getEventById(id),
  createEvent: async (ev) => sync.createEvent(ev),
  updateEvent: async (id, data) => sync.updateEvent(id, data),
  deleteEvent: async (id) => sync.deleteEvent(id),

  getTasks: async (assigneeId) => sync.getTasks(assigneeId),
  getTaskById: async (id) => sync.getTaskById(id),
  createTask: async (task) => sync.createTask(task),
  updateTask: async (id, data) => sync.updateTask(id, data),
  deleteTask: async (id) => sync.deleteTask(id),

  getNotifications: async (userId) => sync.getNotifications(userId),
  createNotification: async (notif) => sync.createNotification(notif),
  markNotificationRead: async (id) => {
    sync.markNotificationRead(id);
  },

  getAuditLogs: async () => sync.getAuditLogs(),
  createAuditLog: async (log) => sync.createAuditLog(log),

  getDashboardStats: async (currentUserId) => sync.getDashboardStats(currentUserId),
};
