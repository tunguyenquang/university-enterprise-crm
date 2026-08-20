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
    {
      id: "e-vnpt", code: "DN-VNPT", name: "Tập đoàn Bưu chính Viễn thông Việt Nam (VNPT)", shortName: "VNPT",
      taxCode: "0100684378", field: "Viễn thông & Chuyển đổi số", scale: "Trên 500 nhân sự", type: "Doanh nghiệp Nhà nước",
      address: "Số 57 Huỳnh Thúc Kháng, Đống Đa", city: "Hà Nội", website: "https://vnpt.com.vn",
      linkedin: null, description: "Tập đoàn viễn thông nhà nước, trọng tâm chuyển đổi số quốc gia.",
      status: "DANG_TIEP_CAN", priority: "QUAN_TRONG", picId: "u-dung",
      internalNotes: "Đã gửi thư mời hợp tác, chờ phản hồi từ Ban Nhân sự.", tags: ["Viễn Thông", "Chuyển Đổi Số"],
      faculties: ["d-dtvt", "d-cntt"], majors: ["d-dtvt"],
    },
    {
      id: "e-cmc", code: "DN-CMC", name: "Công ty Cổ phần Tập đoàn Công nghệ CMC", shortName: "CMC Corp",
      taxCode: "0100778687", field: "Công nghệ thông tin & Tích hợp hệ thống", scale: "Trên 500 nhân sự", type: "Tư nhân Việt Nam",
      address: "Tòa CMC, 11 Duy Tân, Cầu Giấy", city: "Hà Nội", website: "https://cmc.com.vn",
      linkedin: null, description: "Tập đoàn công nghệ lớn thứ hai Việt Nam.",
      status: "TAM_NGUNG", priority: "TIEM_NANG", picId: "u-an",
      internalNotes: "Tạm dừng do đối tác thay đổi nhân sự phụ trách, sẽ liên hệ lại đầu năm sau.", tags: ["Tích Hợp Hệ Thống", "Tạm Hoãn"],
      faculties: ["d-cntt"], majors: ["d-cntt"],
    },
    {
      id: "e-oldpartner", code: "DN-ABC", name: "Công ty TNHH Thương mại ABC", shortName: "ABC Trading",
      taxCode: "0102233445", field: "Thương mại & Phân phối", scale: "Dưới 100 nhân sự", type: "Tư nhân Việt Nam",
      address: "Số 12 Lê Trọng Tấn, Thanh Xuân", city: "Hà Nội", website: null,
      linkedin: null, description: "Đối tác cũ, quy mô nhỏ, không còn phù hợp định hướng đào tạo.",
      status: "NGUNG_HOP_TAC", priority: "THUONG", picId: "u-dung",
      internalNotes: "Đã kết thúc hợp tác từ 2025, lưu hồ sơ để tra cứu lịch sử.", tags: ["Đã Kết Thúc"],
      faculties: ["d-ktql"], majors: ["d-ktql"],
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
    { id: "c-vng-1", enterpriseId: "e-vng", name: "Ông Trần Thanh Sơn", position: "Giám đốc Khối Kỹ thuật", department: "Khối Cloud & Data", email: "son.tt@vng.com.vn", phone: "0903222444", zalo: "0903222444", linkedin: null, notes: "Đầu mối bàn hợp tác hạ tầng Cloud cho phòng Lab.", isPrimary: true, isActive: true },
    { id: "c-tcb-1", enterpriseId: "e-tcb", name: "Bà Phạm Minh Thư", position: "Trưởng ban Tuyển dụng & Thương hiệu", department: "Khối Nhân sự", email: "thu.pm@techcombank.com.vn", phone: "0988111333", zalo: null, linkedin: null, notes: "Quan tâm chương trình học bổng cho Khoa KTQL.", isPrimary: true, isActive: true },
    { id: "c-vnpt-1", enterpriseId: "e-vnpt", name: "Ông Lê Quang Huy", position: "Phó ban Đào tạo", department: "Ban Tổ chức Nhân sự", email: "huylq@vnpt.vn", phone: "0912777888", zalo: null, linkedin: null, notes: "Mới tiếp cận qua hội thảo ngành.", isPrimary: true, isActive: true },
    { id: "c-cmc-1", enterpriseId: "e-cmc", name: "Bà Vũ Thị Lan", position: "Chuyên viên Hợp tác Đại học", department: "Phòng Nhân sự", email: "lanvt@cmc.com.vn", phone: "0977555666", zalo: null, linkedin: null, notes: "Đã chuyển công tác, cần xin đầu mối mới.", isPrimary: true, isActive: false },
  ];
  for (const c of contacts) {
    await prisma.contact.upsert({ where: { id: c.id }, update: c, create: c });
  }

  // 6b. Interactions (nhật ký tương tác) - kèm đầu mối liên hệ tham gia.
  // Trước đây seed không có bảng này nên tab "Nhật ký tương tác" trong hồ sơ DN luôn trống.
  const interactions = [
    {
      id: "i-fpt-1", enterpriseId: "e-fpt", date: daysFromNow(-20), type: "MEETING_OFFLINE",
      content: "Họp triển khai kế hoạch tiếp nhận 150 thực tập sinh kỳ hè 2026.",
      result: "Thống nhất số lượng và lịch phỏng vấn tháng 6.",
      followUpTasks: "Gửi danh sách sinh viên đăng ký cho FPT.", followUpDeadline: daysFromNow(-5),
      followUpStatus: "COMPLETED", picId: "u-an", contactIds: ["c-fpt-1", "c-fpt-2"],
    },
    {
      id: "i-fpt-2", enterpriseId: "e-fpt", date: daysFromNow(-6), type: "EMAIL",
      content: "Trao đổi email xác nhận danh sách 30 sinh viên vòng phỏng vấn đợt 1.",
      result: "FPT đã nhận danh sách, sẽ phản hồi kết quả trong 2 tuần.",
      followUpTasks: "Theo dõi kết quả phỏng vấn.", followUpDeadline: daysFromNow(8),
      followUpStatus: "PENDING", picId: "u-an", contactIds: ["c-fpt-1"],
    },
    {
      id: "i-viettel-1", enterpriseId: "e-viettel", date: daysFromNow(-45), type: "MOU_SIGNING",
      content: "Lễ ký kết MOU hợp tác nghiên cứu AI & mạng viễn thông giai đoạn 2026-2029.",
      result: "Đã ký MOU 09/2026, kèm cam kết 20 suất học bổng/năm.",
      followUpTasks: null, followUpDeadline: null,
      followUpStatus: "NONE", picId: "u-an", contactIds: ["c-viettel-1"],
    },
    {
      id: "i-viettel-2", enterpriseId: "e-viettel", date: daysFromNow(-10), type: "WORKSHOP",
      content: "Phối hợp tổ chức talkshow định hướng nghề IoT & 5G cho sinh viên Khoa ĐTVT.",
      result: "Hơn 300 sinh viên tham dự, phản hồi rất tích cực.",
      followUpTasks: "Gửi thư cảm ơn và báo cáo tổng kết cho đối tác.", followUpDeadline: daysFromNow(3),
      followUpStatus: "PENDING", picId: "u-minh", contactIds: ["c-viettel-1"],
    },
    {
      id: "i-vng-1", enterpriseId: "e-vng", date: daysFromNow(-14), type: "MEETING_ONLINE",
      content: "Họp trực tuyến thảo luận phương án tài trợ hạ tầng Cloud cho phòng Lab AI.",
      result: "VNG đề xuất gói credit thử nghiệm 12 tháng, chờ duyệt nội bộ.",
      followUpTasks: "Chuẩn bị đề xuất chi tiết nhu cầu hạ tầng.", followUpDeadline: daysFromNow(5),
      followUpStatus: "PENDING", picId: "u-dung", contactIds: ["c-vng-1"],
    },
    {
      id: "i-tcb-1", enterpriseId: "e-tcb", date: daysFromNow(-30), type: "CALL",
      content: "Gọi điện giới thiệu chương trình hợp tác và đề xuất quỹ học bổng Khoa KTQL.",
      result: "Đối tác quan tâm, đề nghị gửi hồ sơ giới thiệu qua email.",
      followUpTasks: "Gửi bộ hồ sơ giới thiệu nhà trường.", followUpDeadline: daysFromNow(2),
      followUpStatus: "PENDING", picId: "u-dung", contactIds: ["c-tcb-1"],
    },
    {
      id: "i-vnpt-1", enterpriseId: "e-vnpt", date: daysFromNow(-8), type: "PROPOSAL",
      content: "Gửi thư mời hợp tác đào tạo và tiếp nhận thực tập sinh ngành ĐTVT.",
      result: "Chưa có phản hồi chính thức.",
      followUpTasks: "Gọi điện nhắc lại sau 1 tuần.", followUpDeadline: daysFromNow(1),
      followUpStatus: "PENDING", picId: "u-dung", contactIds: ["c-vnpt-1"],
    },
    {
      id: "i-abc-1", enterpriseId: "e-oldpartner", date: new Date("2025-02-20"), type: "MEETING_OFFLINE",
      content: "Họp tổng kết hợp tác và thống nhất kết thúc thỏa thuận.",
      result: "Hai bên đồng thuận không gia hạn hợp đồng nguyên tắc.",
      followUpTasks: null, followUpDeadline: null,
      followUpStatus: "NONE", picId: "u-dung", contactIds: [],
    },
    {
      id: "i-cmc-1", enterpriseId: "e-cmc", date: daysFromNow(-90), type: "FOLLOW_UP",
      content: "Liên hệ theo dõi sau hội thảo, đầu mối cũ đã chuyển công tác.",
      result: "Tạm dừng tiếp cận, chờ xác định đầu mối mới.",
      followUpTasks: null, followUpDeadline: null,
      followUpStatus: "NONE", picId: "u-an", contactIds: [],
    },
  ];
  for (const it of interactions) {
    const { contactIds, ...base } = it;
    await prisma.interaction.upsert({
      where: { id: it.id },
      update: base,
      create: { ...base, contacts: { create: contactIds.map((contactId) => ({ contactId })) } },
    });
  }

  // 7. MOUs
  const mous = [
    { id: "mou-fpt", code: "12/2025/MOU-HUST-FPT", type: "MOU", enterpriseId: "e-fpt", departmentId: "d-qhdn", signDate: new Date("2025-05-10"), effectiveDate: new Date("2025-05-10"), expiryDate: new Date("2027-05-10"), picId: "u-an", content: "Hợp tác đào tạo thực hành, tiếp nhận 150 thực tập sinh/năm.", status: "DA_KY", fileUrl: "/files/mou_hust_fpt_signed.pdf" },
    { id: "mou-viettel", code: "09/2026/MOU-HUST-VIETTEL", type: "MOU", enterpriseId: "e-viettel", departmentId: "d-qhdn", signDate: new Date("2026-03-01"), effectiveDate: new Date("2026-03-01"), expiryDate: new Date("2029-03-01"), picId: "u-an", content: "Nghiên cứu chung AI & Mạng viễn thông, trao học bổng.", status: "DA_KY", fileUrl: "/files/mou_hust_viettel_signed.pdf" },
    { id: "mou-vng", code: "15/MOU-HUST-VNG", type: "MOU", enterpriseId: "e-vng", departmentId: "d-qhdn", signDate: new Date("2024-08-15"), effectiveDate: new Date("2024-08-15"), expiryDate: new Date("2026-08-15"), picId: "u-dung", content: "Cung cấp hạ tầng số thử nghiệm, đào tạo AI/Cloud.", status: "DA_KY", fileUrl: null },
    { id: "mou-tcb-draft", code: "21/2026/MOU-HUST-TCB", type: "MOU", enterpriseId: "e-tcb", departmentId: "d-ktql", signDate: daysFromNow(30), effectiveDate: daysFromNow(30), expiryDate: daysFromNow(760), picId: "u-dung", content: "Dự thảo hợp tác cấp học bổng và tiếp nhận thực tập khối Kinh tế.", status: "SOAN_THAO", fileUrl: null },
    { id: "mou-vnpt-review", code: "22/2026/MOA-HUST-VNPT", type: "MOA", enterpriseId: "e-vnpt", departmentId: "d-dtvt", signDate: daysFromNow(15), effectiveDate: daysFromNow(15), expiryDate: daysFromNow(1110), picId: "u-dung", content: "Thỏa thuận phối hợp đào tạo kỹ năng số, đang trình Ban Giám hiệu ký.", status: "TRINH_KY", fileUrl: null },
    { id: "mou-abc-expired", code: "05/2023/MOU-HUST-ABC", type: "CONTRACT", enterpriseId: "e-oldpartner", departmentId: "d-ktql", signDate: new Date("2023-03-01"), effectiveDate: new Date("2023-03-01"), expiryDate: new Date("2025-03-01"), picId: "u-dung", content: "Hợp đồng nguyên tắc đã hết hiệu lực, lưu hồ sơ tra cứu.", status: "HET_HAN", fileUrl: null },
  ];
  for (const m of mous) {
    await prisma.partnershipDocument.upsert({ where: { id: m.id }, update: m, create: m });
  }

  // 8. Jobs
  const jobs = [
    { id: "j-fpt-1", enterpriseId: "e-fpt", title: "Thực tập sinh Lập trình Web Full stack (React & Node.js)", type: "INTERN", quantity: 30, description: "Đào tạo 2 tháng có trợ cấp, tham gia dự án thực tế.", requirements: "Nắm vững CTDL, giải thuật, JS/HTML/CSS.", majors: "Công nghệ thông tin, Hệ thống thông tin", location: "FPT Software Tower, Hà Nội", salary: "3,000,000đ - 6,000,000đ", dateDeadline: daysFromNow(25), contactName: "Nguyễn Thị Hoàng Yến", contactEmail: "yen_n_hoang@fsoft.com.vn", contactPhone: "0904555888", status: "ACTIVE" },
    { id: "j-vng-1", enterpriseId: "e-vng", title: "Kỹ sư Phát triển Trí tuệ Nhân tạo di động", type: "FULLTIME", quantity: 5, description: "Tích hợp NLP và Generative AI lên Zalo.", requirements: "Python, PyTorch, TensorFlow.", majors: "Khoa học máy tính, Trí tuệ nhân tạo", location: "VNG Campus, TP.HCM", salary: "18,000,000đ - 25,000,000đ", dateDeadline: daysFromNow(45), contactName: "HR VNG Career", contactEmail: "cv@vng.com.vn", contactPhone: null, status: "ACTIVE" },
    { id: "j-viettel-1", enterpriseId: "e-viettel", title: "Thực tập sinh Kỹ thuật mạng & An ninh thông tin", type: "INTERN", quantity: 20, description: "Tham gia vận hành hạ tầng mạng lõi và giám sát an ninh.", requirements: "Kiến thức mạng TCP/IP, Linux cơ bản.", majors: "Điện tử Viễn thông, An toàn thông tin", location: "Viện Nghiên cứu Viettel, Hà Nội", salary: "4,000,000đ - 7,000,000đ", dateDeadline: daysFromNow(35), contactName: "Trần Quang Hưng", contactEmail: "hungtq_viettel@viettel.com.vn", contactPhone: "0982333777", status: "ACTIVE" },
    { id: "j-tcb-1", enterpriseId: "e-tcb", title: "Chuyên viên Phân tích dữ liệu kinh doanh (Fresher)", type: "FULLTIME", quantity: 8, description: "Phân tích dữ liệu khách hàng, lập báo cáo cho khối bán lẻ.", requirements: "SQL, Excel nâng cao, Power BI.", majors: "Kinh tế, Quản trị kinh doanh, Hệ thống thông tin", location: "Techcombank Tower, Hà Nội", salary: "12,000,000đ - 16,000,000đ", dateDeadline: daysFromNow(20), contactName: "Phạm Minh Thư", contactEmail: "thu.pm@techcombank.com.vn", contactPhone: "0988111333", status: "NEW" },
    { id: "j-fpt-2", enterpriseId: "e-fpt", title: "Cộng tác viên Kiểm thử phần mềm (Part-time)", type: "CTV", quantity: 10, description: "Thực hiện test case thủ công cho các dự án outsourcing.", requirements: "Có thể làm 20h/tuần, cẩn thận.", majors: "Công nghệ thông tin", location: "Làm việc từ xa", salary: "40,000đ/giờ", dateDeadline: daysFromNow(-3), contactName: "Nguyễn Thị Hoàng Yến", contactEmail: "yen_n_hoang@fsoft.com.vn", contactPhone: null, status: "CLOSED" },
  ];
  for (const j of jobs) {
    await prisma.job.upsert({ where: { id: j.id }, update: j, create: j });
  }

  // 9. Events (kèm enterprises & departments)
  const events = [
    { id: "ev-fpt-1", title: "FPT Software Day 2026", type: "COMPANY_TOUR", date: daysFromNow(10), location: "FPT Software Campus, Hòa Lạc", description: "Tham quan doanh nghiệp, đăng ký phỏng vấn thực tập.", budget: 15000000, joinCount: 120, status: "UPCOMING", enterprises: ["e-fpt"], departments: ["d-qhdn", "d-cntt"] },
    { id: "ev-work-1", title: "Seminar: AI ứng dụng trong Đổi mới sáng tạo 2026", type: "WORKSHOP", date: daysFromNow(-8), location: "Hội trường Thư viện Tạ Quang Bửu", description: "Workshop định hướng AI và ươm tạo start-up.", budget: 35000000, joinCount: 450, status: "COMPLETED", enterprises: ["e-vng", "e-viettel"], departments: ["d-startup", "d-cntt"] },
    { id: "ev-jobfair-1", title: "Ngày hội việc làm & Kết nối doanh nghiệp HUST 2026", type: "JOB_FAIR", date: daysFromNow(25), location: "Sân vận động Đại học Bách khoa Hà Nội", description: "Hơn 40 doanh nghiệp tham gia tuyển dụng trực tiếp tại trường.", budget: 120000000, joinCount: 0, status: "UPCOMING", enterprises: ["e-fpt", "e-viettel", "e-tcb", "e-vng"], departments: ["d-qhdn", "d-support"] },
    { id: "ev-mentor-1", title: "Chương trình Mentor 1-1 cùng chuyên gia Viettel", type: "MENTORSHIP", date: daysFromNow(-2), location: "Học trực tuyến qua MS Teams", description: "20 sinh viên xuất sắc được kèm cặp định hướng nghề nghiệp.", budget: 8000000, joinCount: 20, status: "ONGOING", enterprises: ["e-viettel"], departments: ["d-dtvt", "d-support"] },
    { id: "ev-sponsor-1", title: "Tài trợ cuộc thi Khởi nghiệp Sáng tạo HUST", type: "SPONSORSHIP", date: daysFromNow(-60), location: "Hội trường C2, ĐH Bách khoa Hà Nội", description: "VNG tài trợ giải thưởng và suất ươm tạo cho 3 đội thắng.", budget: 50000000, joinCount: 180, status: "COMPLETED", enterprises: ["e-vng"], departments: ["d-startup"] },
    { id: "ev-tour-cancel", title: "Tham quan Trung tâm dứ liệu CMC", type: "COMPANY_TOUR", date: daysFromNow(-35), location: "CMC Data Center, Hà Nội", description: "Hủy do đối tác thay đổi nhân sự phụ trách.", budget: null, joinCount: 0, status: "CANCELLED", enterprises: ["e-cmc"], departments: ["d-cntt"] },
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
    { id: "t-4", title: "Gửi bộ hồ sơ giới thiệu nhà trường cho Techcombank", description: "Kèm đề xuất quỹ học bổng Khoa KTQL.", dueDate: daysFromNow(2), status: "IN_PROGRESS", priority: "MEDIUM", enterpriseId: "e-tcb", interactionId: "i-tcb-1", assigneeId: "u-dung", creatorId: "u-dung" },
    { id: "t-5", title: "Gọi điện nhắc lại thư mời hợp tác VNPT", description: "Đã gửi đề xuất 8 ngày trước, chưa có phản hồi.", dueDate: daysFromNow(1), status: "TODO", priority: "MEDIUM", enterpriseId: "e-vnpt", interactionId: "i-vnpt-1", assigneeId: "u-dung", creatorId: "u-admin" },
    { id: "t-6", title: "Gửi thư cảm ơn & báo cáo tổng kết talkshow IoT/5G", description: "Gửi cho đầu mối Viettel sau sự kiện.", dueDate: daysFromNow(3), status: "TODO", priority: "LOW", enterpriseId: "e-viettel", interactionId: "i-viettel-2", assigneeId: "u-minh", creatorId: "u-dung" },
    { id: "t-7", title: "Chuẩn bị đề xuất nhu cầu hạ tầng Cloud cho phòng Lab AI", description: "Tổng hợp cấu hình và dự toán credit cần VNG tài trợ.", dueDate: daysFromNow(5), status: "IN_PROGRESS", priority: "HIGH", enterpriseId: "e-vng", interactionId: "i-vng-1", assigneeId: "u-an", creatorId: "u-dung" },
    { id: "t-8", title: "Tổng hợp danh sách sinh viên đăng ký Ngày hội việc làm 2026", description: "Phối hợp Trung tâm Hỗ trợ SV mở đơn đăng ký.", dueDate: daysFromNow(12), status: "TODO", priority: "HIGH", enterpriseId: null, interactionId: null, assigneeId: "u-an", creatorId: "u-admin" },
    { id: "t-9", title: "Gửi danh sách sinh viên thực tập đợt 1 cho FPT", description: "Đã hoàn thành và được đối tác xác nhận.", dueDate: daysFromNow(-5), status: "COMPLETED", priority: "MEDIUM", enterpriseId: "e-fpt", interactionId: "i-fpt-1", assigneeId: "u-an", creatorId: "u-dung" },
  ];
  for (const t of tasks) {
    await prisma.task.upsert({ where: { id: t.id }, update: t, create: t });
  }

  // 11. Notifications (cảnh báo & nhắc nhở trên thanh chuông).
  // Cron job tự sinh cảnh báo MOU sắp hết hạn, nhưng seed sẵn vài bản ghi để màn hình
  // có dữ liệu minh họa ngay từ lần đầu mở, không phải đợi tới chu kỳ chạy nền.
  const notifications = [
    { id: "n-1", userId: "u-an", title: "MOU sắp hết hiệu lực", content: "Văn bản 15/MOU-HUST-VNG với VNG Corp sắp đến hạn, cần liên hệ tái ký.", type: "MOU_EXPIRY", isRead: false, link: "/mous" },
    { id: "n-2", userId: "u-dung", title: "Công việc đến hạn hôm nay", content: "Gọi điện nhắc lại thư mời hợp tác VNPT.", type: "TASK_DUE", isRead: false, link: "/tasks" },
    { id: "n-3", userId: "u-dung", title: "Nhắc theo dõi tương tác", content: "Techcombank đang chờ hồ sơ giới thiệu nhà trường.", type: "INTERACTION_REMINDER", isRead: false, link: "/enterprises" },
    { id: "n-4", userId: "u-admin", title: "Hệ thống đã sẵn sàng", content: "Dữ liệu khởi tạo đã được nạp đầy đủ. Vui lòng đổi mật khẩu mặc định sau lần đăng nhập đầu tiên.", type: "SYSTEM", isRead: false, link: null },
    { id: "n-5", userId: "u-minh", title: "Công việc được giao", content: "Gửi thư cảm ơn & báo cáo tổng kết talkshow IoT/5G.", type: "TASK_DUE", isRead: true, link: "/tasks" },
  ];
  for (const n of notifications) {
    await prisma.notification.upsert({ where: { id: n.id }, update: n, create: n });
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
