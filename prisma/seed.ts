// ==========================================
// SEED DỮ LIỆU CHO POSTGRESQL (Prisma)
// ==========================================
// Tạo dữ liệu mẫu giống bản JSON: roles, permissions, departments, users (bcrypt),
// enterprises (kèm tags/faculties/majors), contacts, interactions, mous, jobs, events, tasks.
// Chạy: npx prisma db seed   (hoặc)   npx tsx prisma/seed.ts
//
// Idempotent: dùng upsert theo id cố định nên chạy nhiều lần không nhân đôi dữ liệu.

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();
const ROUNDS = Number(process.env.BCRYPT_ROUNDS || 10);
const DEFAULT_PASSWORD = process.env.SEED_DEFAULT_PASSWORD || "Password123!";
const hash = (pw: string) => bcrypt.hashSync(pw, ROUNDS);
const daysFromNow = (n: number) => new Date(Date.now() + n * 24 * 3600 * 1000);

async function main() {
  console.log("[seed] Bắt đầu seed dữ liệu PostgreSQL...");

  // 1. Roles
  const roles = [
    { id: "r-admin", name: "Super Admin", code: "SUPER_ADMIN", description: "Quản trị viên toàn hệ thống và phân quyền" },
    { id: "r-leader", name: "Lãnh đạo / Ban Giám hiệu", code: "LEADER", description: "Xem báo cáo, KPIs, giám sát hợp tác" },
    { id: "r-qhdn-mgr", name: "Quản trị phòng QHDN", code: "QHDN_MANAGER", description: "Duyệt dữ liệu, điều phối cán bộ phòng QHDN" },
    { id: "r-qhdn-staff", name: "Chuyên viên QHDN", code: "QHDN_STAFF", description: "Cập nhật trực tiếp thông tin doanh nghiệp, MOU, liên hệ" },
    { id: "r-faculty", name: "Cán bộ đại diện Khoa", code: "FACULTY_REPRESENTATIVE", description: "Quản lý hợp tác liên quan trực tiếp đến khoa" },
    { id: "r-student", name: "Trung tâm Hỗ trợ SV", code: "STUDENT_SUPPORT", description: "Quản lý tuyển dụng, thực tập, sự kiện việc làm" },
    { id: "r-startup", name: "Trung tâm Đổi mới Sáng tạo", code: "INNOVATION_CENTER", description: "Đồng hành khởi nghiệp, tài trợ đề án" },
  ];
  for (const r of roles) {
    await prisma.role.upsert({ where: { id: r.id }, update: r, create: r });
  }

  // 2. Permissions
  const permissions = [
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
    { id: "p13", name: "Quản lý danh mục chung", code: "manage_master_data", group: "ADMIN" },
  ];
  for (const p of permissions) {
    await prisma.permission.upsert({ where: { id: p.id }, update: p, create: p });
  }

  // 3. Departments
  const departments = [
    { id: "d-qhdn", name: "Phòng Quan hệ Doanh nghiệp", code: "P_QHDN", type: "PHONG", parentId: null },
    { id: "d-support", name: "Trung tâm Hỗ trợ Sinh viên & Việc làm", code: "TT_HTSV", type: "TRUNG_TAM", parentId: null },
    { id: "d-startup", name: "Trung tâm Đổi mới Sáng tạo & Khởi nghiệp", code: "TT_DMST_KN", type: "TRUNG_TAM", parentId: null },
    { id: "d-cntt", name: "Khoa Công nghệ thông tin", code: "K_CNTT", type: "KHOA", parentId: null },
    { id: "d-dtvt", name: "Khoa Điện tử Viễn thông", code: "K_DTVT", type: "KHOA", parentId: null },
    { id: "d-ktql", name: "Khoa Kinh tế & Quản lý", code: "K_KTQL", type: "KHOA", parentId: null },
  ];
  for (const d of departments) {
    await prisma.department.upsert({ where: { id: d.id }, update: d, create: d });
  }

  // 4. Users (mật khẩu bcrypt)
  const users = [
    { id: "u-admin", email: "admin@hust.edu.vn", fullName: "Nguyễn Văn Admin", phone: "0901234567", roleId: "r-admin", departmentId: "d-qhdn" },
    { id: "u-leader", email: "bgh.hai@hust.edu.vn", fullName: "PGS. TS. Trần Đức Hải", phone: "0987654321", roleId: "r-leader", departmentId: null },
    { id: "u-dung", email: "qhdn.dung@hust.edu.vn", fullName: "ThS. Hoàng Trung Dũng", phone: "0912345678", roleId: "r-qhdn-mgr", departmentId: "d-qhdn" },
    { id: "u-an", email: "qhdn.an@hust.edu.vn", fullName: "CN. Lê Hoài An", phone: "0934567890", roleId: "r-qhdn-staff", departmentId: "d-qhdn" },
    { id: "u-minh", email: "cntt.minh@hust.edu.vn", fullName: "TS. Nguyễn Khánh Minh", phone: "0945678901", roleId: "r-faculty", departmentId: "d-cntt" },
  ];
  for (const u of users) {
    const data = { ...u, isActive: true, passwordHash: hash(DEFAULT_PASSWORD) };
    await prisma.user.upsert({ where: { id: u.id }, update: { ...u, isActive: true }, create: data });
  }

  // 5. Enterprises (kèm tags, faculties, majors)
  const enterprises = [
    {
      id: "e-fpt", code: "DN-FSOFT", name: "Công ty Cổ phần Phần mềm FPT (FPT Software)", shortName: "FPT Software",
      taxCode: "0101248141", field: "Công nghệ thông tin & Viễn thông", scale: "Trên 500 nhân sự", type: "Tư nhân Việt Nam",
      address: "Tòa nhà FPT, Phố Duy Tân, Dịch Vọng Hậu", city: "Hà Nội", website: "https://fptsoftware.com",
      linkedin: "https://linkedin.com/company/fpt-software", description: "Doanh nghiệp xuất khẩu phần mềm lớn nhất Việt Nam.",
      status: "DANG_TRIEN_KHAI", priority: "CHIEN_LUOC", picId: "u-an",
      internalNotes: "Tài trợ thiết bị phòng Lab hàng năm.", tags: ["Lab Thiết Bị", "Học Bổng", "Internship", "Chiến Lược"],
      faculties: ["d-cntt", "d-dtvt"], majors: ["d-cntt"],
    },
    {
      id: "e-viettel", code: "DN-VIETTEL", name: "Tập đoàn Công nghiệp - Viễn thông Quân đội Viettel", shortName: "Viettel Group",
      taxCode: "0100109106", field: "Viễn thông, An ninh mạng & Công nghệ cao", scale: "Trên 500 nhân sự", type: "Doanh nghiệp Nhà nước",
      address: "Lô D26, Khu đô thị mới Cầu Giấy", city: "Hà Nội", website: "https://viettel.com.vn",
      linkedin: "https://linkedin.com/company/viettel-group", description: "Tập đoàn công nghệ, viễn thông hàng đầu Việt Nam.",
      status: "DA_KY_MOU", priority: "CHIEN_LUOC", picId: "u-an",
      internalNotes: "Vừa ký lại MOU năm nay.", tags: ["Nghiên Cứu", "Security", "Quốc Phòng", "Viễn Thông"],
      faculties: ["d-cntt", "d-dtvt"], majors: ["d-dtvt"],
    },
    {
      id: "e-vng", code: "DN-VNG", name: "Công ty Cổ phần VNG (VNG Corporation)", shortName: "VNG Corp",
      taxCode: "0303491621", field: "Công nghệ thông tin & Game & Fintech", scale: "Trên 500 nhân sự", type: "Tư nhân Việt Nam",
      address: "Z06 Đường số 13, Tân Thuận Đông, Quận 7", city: "TP. Hồ Chí Minh", website: "https://vng.com.vn",
      linkedin: "https://linkedin.com/company/vng", description: "Kỳ lân công nghệ đầu tiên của Việt Nam.",
      status: "DANG_TRAO_DOI", priority: "QUAN_TRONG", picId: "u-an",
      internalNotes: "Đang bàn hợp tác Server Cloud.", tags: ["Fintech", "ZaloPay", "Cloud-Lab"],
      faculties: ["d-cntt"], majors: ["d-cntt"],
    },
    {
      id: "e-tcb", code: "DN-TCB", name: "Ngân hàng TMCP Kỹ thương Việt Nam (Techcombank)", shortName: "Techcombank",
      taxCode: "0100230800", field: "Tài chính & Ngân hàng", scale: "Trên 500 nhân sự", type: "Tư nhân Việt Nam",
      address: "Số 6 Phố Quang Trung, Hoàn Kiếm", city: "Hà Nội", website: "https://techcombank.com",
      linkedin: "https://linkedin.com/company/techcombank", description: "Ngân hàng TMCP hàng đầu định hướng số hóa.",
      status: "TIEM_NANG", priority: "TIEM_NANG", picId: "u-dung",
      internalNotes: "Khoa KTQL đề xuất tiếp cận xin quỹ học bổng.", tags: ["Tài Trợ", "Học Bổng", "Ngân Hàng Số"],
      faculties: ["d-ktql", "d-cntt"], majors: ["d-ktql"],
    },
  ];
  for (const e of enterprises) {
    const { tags, faculties, majors, ...base } = e;
    await prisma.enterprise.upsert({
      where: { id: e.id },
      update: base,
      create: {
        ...base,
        tags: { create: tags.map((name) => ({ name })) },
        faculties: { create: faculties.map((departmentId) => ({ departmentId })) },
        majors: { create: majors.map((departmentId) => ({ departmentId })) },
      },
    });
  }

  // 6. Contacts
  const contacts = [
    { id: "c-fpt-1", enterpriseId: "e-fpt", name: "Bà Nguyễn Thị Hoàng Yến", position: "Trưởng phòng Thu hút tài năng trẻ", department: "Phòng Tuyển dụng FSOFT", email: "yen_n_hoang@fsoft.com.vn", phone: "0904555888", zalo: "0904555888", linkedin: null, notes: "Đầu mối chính về thực tập.", isPrimary: true, isActive: true },
    { id: "c-fpt-2", enterpriseId: "e-fpt", name: "Ông Lương Minh Hữu", position: "Giám đốc Nhân sự (CHRO)", department: "Ban Giám đốc Nhân sự", email: "huu_l_minh@fpt.com", phone: "0912111222", zalo: null, linkedin: null, notes: "Tham gia các sự kiện ký kết.", isPrimary: false, isActive: true },
    { id: "c-viettel-1", enterpriseId: "e-viettel", name: "Thiếu tá Trần Quang Hưng", position: "Giám đốc Hợp tác Giáo dục & Tuyển dụng", department: "Ban Nhân sự Tập đoàn", email: "hungtq_viettel@viettel.com.vn", phone: "0982333777", zalo: "0982333777", linkedin: null, notes: "Nhiệt tình tham gia talkshow IoT & 5G.", isPrimary: true, isActive: true },
  ];
  for (const c of contacts) {
    await prisma.contact.upsert({ where: { id: c.id }, update: c, create: c });
  }

  // 7. MOUs
  const mous = [
    { id: "mou-fpt", code: "12/2025/MOU-HUST-FPT", type: "MOU", enterpriseId: "e-fpt", departmentId: "d-qhdn", signDate: new Date("2025-05-10"), effectiveDate: new Date("2025-05-10"), expiryDate: new Date("2027-05-10"), picId: "u-an", content: "Hợp tác đào tạo thực hành, tiếp nhận 150 thực tập sinh/năm.", status: "DA_KY", fileUrl: "/files/mou_hust_fpt_signed.pdf" },
    { id: "mou-viettel", code: "09/2026/MOU-HUST-VIETTEL", type: "MOU", enterpriseId: "e-viettel", departmentId: "d-qhdn", signDate: new Date("2026-03-01"), effectiveDate: new Date("2026-03-01"), expiryDate: new Date("2029-03-01"), picId: "u-an", content: "Nghiên cứu chung AI & Mạng viễn thông, trao học bổng.", status: "DA_KY", fileUrl: "/files/mou_hust_viettel_signed.pdf" },
    { id: "mou-vng", code: "15/MOU-HUST-VNG", type: "MOU", enterpriseId: "e-vng", departmentId: "d-qhdn", signDate: new Date("2024-08-15"), effectiveDate: new Date("2024-08-15"), expiryDate: new Date("2026-08-15"), picId: "u-dung", content: "Cung cấp hạ tầng số thử nghiệm, đào tạo AI/Cloud.", status: "DA_KY", fileUrl: null },
  ];
  for (const m of mous) {
    await prisma.partnershipDocument.upsert({ where: { id: m.id }, update: m, create: m });
  }

  // 8. Jobs
  const jobs = [
    { id: "j-fpt-1", enterpriseId: "e-fpt", title: "Thực tập sinh Lập trình Web Full stack (React & Node.js)", type: "INTERN", quantity: 30, description: "Đào tạo 2 tháng có trợ cấp, tham gia dự án thực tế.", requirements: "Nắm vững CTDL, giải thuật, JS/HTML/CSS.", majors: "Công nghệ thông tin, Hệ thống thông tin", location: "FPT Software Tower, Hà Nội", salary: "3,000,000đ - 6,000,000đ", dateDeadline: daysFromNow(25), contactName: "Nguyễn Thị Hoàng Yến", contactEmail: "yen_n_hoang@fsoft.com.vn", contactPhone: "0904555888", status: "ACTIVE" },
    { id: "j-vng-1", enterpriseId: "e-vng", title: "Kỹ sư Phát triển Trí tuệ Nhân tạo di động", type: "FULLTIME", quantity: 5, description: "Tích hợp NLP và Generative AI lên Zalo.", requirements: "Python, PyTorch, TensorFlow.", majors: "Khoa học máy tính, Trí tuệ nhân tạo", location: "VNG Campus, TP.HCM", salary: "18,000,000đ - 25,000,000đ", dateDeadline: daysFromNow(45), contactName: "HR VNG Career", contactEmail: "cv@vng.com.vn", contactPhone: null, status: "ACTIVE" },
  ];
  for (const j of jobs) {
    await prisma.job.upsert({ where: { id: j.id }, update: j, create: j });
  }

  // 9. Events (kèm enterprises & departments)
  const events = [
    { id: "ev-fpt-1", title: "FPT Software Day 2026", type: "COMPANY_TOUR", date: daysFromNow(10), location: "FPT Software Campus, Hòa Lạc", description: "Tham quan doanh nghiệp, đăng ký phỏng vấn thực tập.", budget: 15000000, joinCount: 120, status: "UPCOMING", enterprises: ["e-fpt"], departments: ["d-qhdn", "d-cntt"] },
    { id: "ev-work-1", title: "Seminar: AI ứng dụng trong Đổi mới sáng tạo 2026", type: "WORKSHOP", date: daysFromNow(-8), location: "Hội trường Thư viện Tạ Quang Bửu", description: "Workshop định hướng AI và ươm tạo start-up.", budget: 35000000, joinCount: 450, status: "COMPLETED", enterprises: ["e-vng", "e-viettel"], departments: ["d-startup", "d-cntt"] },
  ];
  for (const ev of events) {
    const { enterprises: ents, departments: depts, ...base } = ev;
    await prisma.event.upsert({
      where: { id: ev.id },
      update: base,
      create: {
        ...base,
        enterprises: { create: ents.map((enterpriseId) => ({ enterpriseId })) },
        departments: { create: depts.map((departmentId) => ({ departmentId })) },
      },
    });
  }

  // 10. Tasks
  const tasks = [
    { id: "t-1", title: "Lời mời anh Hưng họp góp ý CTĐT Điện tử", description: "Hẹn lịch họp tại khoa DTVT.", dueDate: daysFromNow(1), status: "TODO", priority: "HIGH", enterpriseId: "e-viettel", interactionId: null, assigneeId: "u-an", creatorId: "u-dung" },
    { id: "t-3", title: "Theo dõi gia hạn văn bản MOU với VNG", description: "MOU hết hạn 15/08/2026, liên hệ tái ký.", dueDate: daysFromNow(15), status: "TODO", priority: "HIGH", enterpriseId: "e-vng", interactionId: null, assigneeId: "u-dung", creatorId: "u-dung" },
  ];
  for (const t of tasks) {
    await prisma.task.upsert({ where: { id: t.id }, update: t, create: t });
  }

  console.log("[seed] Hoàn tất seed PostgreSQL.");
}

main()
  .catch((e) => {
    console.error("[seed] Lỗi:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
