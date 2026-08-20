import React, { useState, useEffect } from "react";
import { 
  Enterprise, Contact, Interaction, PartnershipDocument, Job, Event, User, Department,
  EnterpriseStatus, EnterprisePriority, InteractionType, DocumentStatus, DocumentType, JobType, JobStatus
} from "../types/crm.ts";
import {
  DOCUMENT_STATUS_LABELS, DOCUMENT_STATUS_COLORS, DOCUMENT_TYPE_LABELS,
  INTERACTION_TYPE_LABELS, JOB_TYPE_LABELS, JOB_STATUS_LABELS, JOB_STATUS_COLORS, labelOf, initialsOf,
} from "../lib/crmLabels.ts";
import { 
  ArrowLeft, Building2, User2, Mail, Phone, ExternalLink, Calendar, MapPin, Tag, Plus, Trash2, Edit2, Check, AlertCircle, FileText, CheckSquare, Briefcase, ListTodo, Save, X, Info
} from "lucide-react";

interface EnterpriseDetailsProps {
  token: string;
  enterpriseId: string;
  onBack: () => void;
  currentUser: any;
  usersList: User[];
  departmentsList: Department[];
  onRefreshList: () => void;
}

export default function EnterpriseDetails({ 
  token, enterpriseId, onBack, currentUser, usersList, departmentsList, onRefreshList 
}: EnterpriseDetailsProps) {
  
  const [enterprise, setEnterprise] = useState<(Enterprise & { 
    pic?: User; contacts: Contact[]; interactions: any[]; mous: any[]; jobs: Job[]; events: Event[] 
  }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"general" | "contacts" | "interactions" | "mous" | "jobs" | "events">("general");

  // FORM STATES
  const [contactForm, setContactForm] = useState<Partial<Contact> | null>(null);
  const [interactionForm, setInteractionForm] = useState<Partial<Interaction> | null>(null);
  const [mouForm, setMouForm] = useState<Partial<PartnershipDocument> | null>(null);
  const [jobForm, setJobForm] = useState<Partial<Job> | null>(null);

  const fetchEnterpriseDetails = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/enterprises/${enterpriseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Không thể tải thông tin chi tiết doanh nghiệp.");
      const data = await res.json();
      setEnterprise(data);
    } catch (err: any) {
      setError(err.message || "Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnterpriseDetails();
  }, [enterpriseId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-500 font-medium">Đang tải hồ sơ hoạt động...</span>
      </div>
    );
  }

  if (error || !enterprise) {
    return (
      <div className="bg-red-50 text-red-800 p-4 rounded-lg flex items-center">
        <AlertCircle className="h-5 w-5 mr-2" />
        <p className="font-medium">Lỗi: {error || "Không tìm thấy hồ sơ doanh nghiệp"}</p>
        <button onClick={onBack} className="ml-auto text-xs underline font-semibold">Quay lại</button>
      </div>
    );
  }

  // Translators
  const statusLabels: Record<EnterpriseStatus, string> = {
    [EnterpriseStatus.TIEM_NANG]: "Tiềm năng",
    [EnterpriseStatus.DANG_TIEP_CAN]: "Đang tiếp cận",
    [EnterpriseStatus.DANG_TRAO_DOI]: "Đang trao đổi",
    [EnterpriseStatus.DA_KY_MOU]: "Đã ký MOU",
    [EnterpriseStatus.DANG_TRIEN_KHAI]: "Đang triển khai",
    [EnterpriseStatus.TAM_NGUNG]: "Tạm ngưng",
    [EnterpriseStatus.NGUNG_HOP_TAC]: "Ngừng hợp tác"
  };

  const statusColors: Record<EnterpriseStatus, string> = {
    [EnterpriseStatus.TIEM_NANG]: "bg-gray-100 text-gray-800 border-gray-200",
    [EnterpriseStatus.DANG_TIEP_CAN]: "bg-blue-50 text-blue-800 border-blue-200",
    [EnterpriseStatus.DANG_TRAO_DOI]: "bg-orange-50 text-orange-800 border-orange-200",
    [EnterpriseStatus.DA_KY_MOU]: "bg-blue-50 text-blue-800 border-blue-200",
    [EnterpriseStatus.DANG_TRIEN_KHAI]: "bg-emerald-50 text-emerald-800 border-emerald-200",
    [EnterpriseStatus.TAM_NGUNG]: "bg-amber-100 text-amber-800 border-amber-200",
    [EnterpriseStatus.NGUNG_HOP_TAC]: "bg-red-50 text-red-800 border-red-200"
  };

  const priorityLabels: Record<EnterprisePriority, string> = {
    [EnterprisePriority.CHIEN_LUOC]: "⭐ Đối tác Chiến lược",
    [EnterprisePriority.QUAN_TRONG]: "🔥 Quan trọng",
    [EnterprisePriority.TIEM_NANG]: "⚡ Tiềm năng",
    [EnterprisePriority.THUONG]: "Thông thường"
  };

  // ==========================================
  // CONTACT HANDLERS
  // ==========================================
  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm?.name || !contactForm?.position) return;
    try {
      const isEdit = !!contactForm.id;
      const url = isEdit ? `/api/contacts/${contactForm.id}` : "/api/contacts";
      const method = isEdit ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...contactForm,
          enterpriseId: enterprise.id
        })
      });

      if (!res.ok) throw new Error("Lưu thất bại");
      setContactForm(null);
      fetchEnterpriseDetails();
    } catch (err: any) {
      alert("Lỗi khi lưu đầu mối: " + err.message);
    }
  };

  const handleDeleteContact = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa đầu mối liên hệ này?")) return;
    try {
      const res = await fetch(`/api/contacts/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Xóa thất bại");
      fetchEnterpriseDetails();
    } catch (err: any) {
      alert("Lỗi: " + err.message);
    }
  };

  // ==========================================
  // INTERACTION HANDLERS
  // ==========================================
  const handleSaveInteraction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!interactionForm?.type || !interactionForm?.content) return;
    try {
      const isEdit = !!interactionForm.id;
      const url = isEdit ? `/api/interactions/${interactionForm.id}` : "/api/interactions";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...interactionForm,
          enterpriseId: enterprise.id
        })
      });

      if (!res.ok) throw new Error("Lưu nhật ký tương tác thất bại.");
      setInteractionForm(null);
      fetchEnterpriseDetails();
      onRefreshList(); // Update overall pipeline view
    } catch (err: any) {
      alert("Lỗi: " + err.message);
    }
  };

  const handleDeleteInteraction = async (id: string) => {
    if (!confirm("Xóa nhật ký tương tác này?")) return;
    try {
      const res = await fetch(`/api/interactions/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Thành nghiệm thất bại");
      fetchEnterpriseDetails();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // ==========================================
  // MOU HANDLERS
  // ==========================================
  const handleSaveMOU = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mouForm?.code || !mouForm?.departmentId || !mouForm?.expiryDate) return;
    try {
      const isEdit = !!mouForm.id;
      const url = isEdit ? `/api/mous/${mouForm.id}` : "/api/mous";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...mouForm,
          enterpriseId: enterprise.id
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Lỗi thỏa thuận ký kết.");
      }
      setMouForm(null);
      fetchEnterpriseDetails();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteMOU = async (id: string) => {
    if (!confirm("Hủy bỏ văn bản ghi nhớ này khỏi hệ thống?")) return;
    try {
      const res = await fetch(`/api/mous/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Hủy thất bại");
      fetchEnterpriseDetails();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // ==========================================
  // JOB OPPORTUNITIES HANDLERS
  // ==========================================
  const handleSaveJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobForm?.title || !jobForm?.majors || !jobForm?.dateDeadline) return;
    try {
      const isEdit = !!jobForm.id;
      const url = isEdit ? `/api/jobs/${jobForm.id}` : "/api/jobs";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...jobForm,
          enterpriseId: enterprise.id
        })
      });

      if (!res.ok) throw new Error("Cập nhật tin và yêu cầu thất bại.");
      setJobForm(null);
      fetchEnterpriseDetails();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteJob = async (id: string) => {
    if (!confirm("Gỡ bỏ thông tin nhu cầu tuyển dụng này?")) return;
    try {
      const res = await fetch(`/api/jobs/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Gỡ thất bại");
      fetchEnterpriseDetails();
    } catch (err: any) {
      alert(err.message);
    }
  };


  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Detail Back Anchor Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <button 
          onClick={onBack}
          className="inline-flex items-center px-3 py-1.5 bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-700 font-medium text-xs rounded-xl transition focus:outline-none shrink-0"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Danh mục Doanh nghiệp
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <span className={`px-3 py-1 border rounded-lg text-xs font-semibold ${statusColors[enterprise.status]}`}>
            Phân loại: {statusLabels[enterprise.status]}
          </span>
          <span className="px-3 py-1 bg-slate-900 border border-slate-800 text-amber-300 rounded-lg text-xs font-bold font-mono">
            {priorityLabels[enterprise.priority]}
          </span>
        </div>
      </div>

      {/* Main Corporate Visual Identity row */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-xs flex flex-col md:flex-row gap-5 items-start">
        <div className="p-4 bg-blue-50 border border-blue-100 text-blue-700 rounded-2xl shrink-0">
          <Building2 className="h-10 w-10 animate-pulse" />
        </div>
        <div className="space-y-2 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl font-bold text-gray-900 leading-tight">{enterprise.name}</h1>
            {enterprise.shortName && (
              <span className="text-xs bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 rounded font-bold font-mono">
                {enterprise.shortName}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">{enterprise.description || "Chưa có mô tả ngắn về lĩnh vực thế mạnh."}</p>
          
          <div className="flex flex-wrap gap-1.5 pt-1">
            {enterprise.tags && enterprise.tags.map(t => (
              <span key={t} className="text-[10px] font-medium font-mono text-blue-600 bg-blue-50/70 border border-blue-100/50 px-2 py-0.5 rounded-md">
                #{t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Primary tab bar structure */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-xs">
        <div className="border-b border-gray-50 flex items-center overflow-x-auto whitespace-nowrap bg-slate-50/50 p-1 gap-1">
          <button 
            onClick={() => setActiveTab("general")}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all focus:outline-none ${activeTab === "general" ? "bg-white text-blue-700 shadow-3xs" : "text-gray-500 hover:bg-white/40 hover:text-gray-800"}`}
          >
            Thông tin chung
          </button>
          <button 
            onClick={() => setActiveTab("contacts")}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all focus:outline-none ${activeTab === "contacts" ? "bg-white text-blue-700 shadow-3xs" : "text-gray-500 hover:bg-white/40 hover:text-gray-800"}`}
          >
            Người liên hệ ({enterprise.contacts.length})
          </button>
          <button 
            onClick={() => setActiveTab("interactions")}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all focus:outline-none ${activeTab === "interactions" ? "bg-white text-blue-700 shadow-3xs" : "text-gray-500 hover:bg-white/40 hover:text-gray-800"}`}
          >
            Lịch sử tương tác ({enterprise.interactions.length})
          </button>
          <button 
            onClick={() => setActiveTab("mous")}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all focus:outline-none ${activeTab === "mous" ? "bg-white text-blue-700 shadow-3xs" : "text-gray-500 hover:bg-white/40 hover:text-gray-800"}`}
          >
            MOU / Hợp tác ({enterprise.mous.length})
          </button>
          <button 
            onClick={() => setActiveTab("jobs")}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all focus:outline-none ${activeTab === "jobs" ? "bg-white text-blue-700 shadow-3xs" : "text-gray-500 hover:bg-white/40 hover:text-gray-800"}`}
          >
            Tuyển dụng & Thực tập ({enterprise.jobs.length})
          </button>
          <button 
            onClick={() => setActiveTab("events")}
            className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all focus:outline-none ${activeTab === "events" ? "bg-white text-blue-700 shadow-3xs" : "text-gray-500 hover:bg-white/40 hover:text-gray-800"}`}
          >
            Sự kiện phối hợp ({enterprise.events.length})
          </button>
        </div>

        <div className="p-6">
          {/* TAB 1: GENERAL CORPORATE INFO VIEW */}
          {activeTab === "general" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-5">
                <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center">
                  <Info className="h-4 w-4 mr-1.5 text-blue-600" />
                  Hồ sơ Pháp nhân & Quy mô
                </h3>
                
                <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                  <div className="bg-slate-50/50 p-3 rounded-xl border border-gray-100">
                    <span className="block text-gray-400 font-medium mb-1.5 font-sans">Mã số thuế</span>
                    <span className="font-bold text-gray-800">{enterprise.taxCode || "N/A"}</span>
                  </div>
                  <div className="bg-slate-50/50 p-3 rounded-xl border border-gray-100">
                    <span className="block text-gray-400 font-medium mb-1.5 font-sans">Quy mô nhân sự</span>
                    <span className="font-bold text-gray-800">{enterprise.scale || "Dưới 50"}</span>
                  </div>
                  <div className="bg-slate-50/50 p-3 rounded-xl border border-gray-100 col-span-2">
                    <span className="block text-gray-400 font-medium mb-1.5 font-sans">Lĩnh vực hoạt động</span>
                    <span className="font-bold text-gray-800">{enterprise.field}</span>
                  </div>
                  <div className="bg-slate-50/50 p-3 rounded-xl border border-gray-100">
                    <span className="block text-gray-400 font-medium mb-1.5 font-sans">Loại hình thành cơ</span>
                    <span className="font-bold text-gray-800">{enterprise.type}</span>
                  </div>
                  <div className="bg-slate-50/50 p-3 rounded-xl border border-gray-100">
                    <span className="block text-gray-400 font-medium mb-1.5 font-sans">Đại phương (Tỉnh/Thành)</span>
                    <span className="font-bold text-gray-800">{enterprise.city}</span>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <span className="block text-gray-400 font-medium font-sans">Địa chỉ chi nhánh chính</span>
                  <div className="bg-white p-3 rounded-xl border border-gray-100 flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-gray-400 shrink-0" />
                    <p className="text-gray-700 leading-normal font-medium">{enterprise.address}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  {enterprise.website && (
                    <a 
                      href={enterprise.website} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="inline-flex items-center px-4 py-2 bg-blue-50 border border-blue-100 text-blue-700 font-semibold text-xs rounded-xl hover:bg-blue-100 active:scale-95 transition"
                    >
                      Trang Web chính
                      <ExternalLink className="h-3 w-3 ml-1.5" />
                    </a>
                  )}
                  {enterprise.linkedin && (
                    <a 
                      href={enterprise.linkedin} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="inline-flex items-center px-4 py-2 bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-200 active:scale-95 transition"
                    >
                      Kênh LinkedIn
                      <ExternalLink className="h-3 w-3 ml-1.5" />
                    </a>
                  )}
                </div>
              </div>

              <div className="space-y-5">
                <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center">
                  <User2 className="h-4 w-4 mr-1.5 text-blue-600" />
                  Đầu mối trường ĐH & Khoa liên quan
                </h3>

                <div className="bg-slate-50/50 p-4 border border-gray-100 rounded-xl space-y-3.5">
                  <span className="block text-xs text-gray-400 font-semibold font-sans uppercase tracking-wider">Cơ quan phụ trách nội bộ</span>
                  
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 flex items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-sm">
                      {initialsOf(enterprise.pic?.fullName)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-800">{enterprise.pic?.fullName || "Chưa phân công"}</h4>
                      <p className="text-xs text-gray-400 font-mono mt-0.5">{enterprise.pic?.email || "Chưa thiết lập liên hệ"}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <span className="block text-xs font-bold text-gray-900 uppercase">Phòng / Khoa liên kết đào tạo:</span>
                  <div className="flex flex-wrap gap-2">
                    {enterprise.facultyIds && enterprise.facultyIds.map(fId => {
                      const dept = departmentsList.find(d => d.id === fId);
                      return dept ? (
                        <span key={fId} className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-xl text-xs font-bold">
                          🏢 {dept.name}
                        </span>
                      ) : null;
                    })}
                    {(!enterprise.facultyIds || enterprise.facultyIds.length === 0) && (
                      <span className="text-xs text-gray-400">Chưa bắt cặp phòng khoa cụ thể.</span>
                    )}
                  </div>
                </div>

                <div className="bg-amber-50/50 border border-amber-100/70 p-4.5 rounded-xl space-y-2">
                  <h4 className="text-xs font-bold text-amber-800 flex items-center">
                    <ListTodo className="h-4 w-4 mr-1.5" />
                    Ghi chú nghiệp vụ nội bộ
                  </h4>
                  <p className="text-xs text-amber-900/80 leading-relaxed font-medium">
                    {enterprise.internalNotes || "Không có ghi chú đặc biệt cho doanh nghiệp này. Nhập các chiến lược tiếp tế tiếp cận ưu tiên khác."}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DETAILED CONTACTS (HEADCOUNT CRUD) */}
          {activeTab === "contacts" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900">Danh bạ đầu mối Doanh nghiệp ({enterprise.contacts.length})</h3>
                <button 
                  onClick={() => setContactForm({ isActive: true, isPrimary: false })}
                  className="inline-flex items-center px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-2xs transition focus:outline-none"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Thêm đầu mối mới
                </button>
              </div>

              {/* Edit form representation */}
              {contactForm && (
                <form onSubmit={handleSaveContact} className="bg-slate-50 border border-gray-200 rounded-2xl p-5 space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-gray-200/50 pb-2">
                    <h4 className="text-xs font-bold text-gray-800 uppercase">
                      {contactForm.id ? "Chỉnh sửa thông tin liên hệ" : "Tạo mẫu nhân sự liên hệ"}
                    </h4>
                    <button type="button" onClick={() => setContactForm(null)} className="text-gray-400 hover:text-gray-600">
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-gray-500">Họ và tên *</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="E.g., Bà Nguyễn Thị Hoàng Yến"
                        value={contactForm.name || ""} 
                        onChange={e => setContactForm({ ...contactForm, name: e.target.value })}
                        className="w-full text-xs font-medium bg-white border border-gray-300 rounded-lg p-2 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-gray-500">Chức vị / Vai trò *</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="E.g., HR Manager"
                        value={contactForm.position || ""} 
                        onChange={e => setContactForm({ ...contactForm, position: e.target.value })}
                        className="w-full text-xs font-medium bg-white border border-gray-300 rounded-lg p-2 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-gray-500">Thuộc ban ngành Doanh nghiệp</label>
                      <input 
                        type="text" 
                        placeholder="E.g., Ban Nhân sự"
                        value={contactForm.department || ""} 
                        onChange={e => setContactForm({ ...contactForm, department: e.target.value })}
                        className="w-full text-xs font-medium bg-white border border-gray-300 rounded-lg p-2 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-gray-500">Email LH</label>
                      <input 
                        type="email" 
                        placeholder="E.g., yen@fsoft.com"
                        value={contactForm.email || ""} 
                        onChange={e => setContactForm({ ...contactForm, email: e.target.value })}
                        className="w-full text-xs font-medium bg-white border border-gray-200/50 rounded-lg p-2 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-gray-500">Điện thoại di động</label>
                      <input 
                        type="text" 
                        placeholder="E.g., 0904123123"
                        value={contactForm.phone || ""} 
                        onChange={e => setContactForm({ ...contactForm, phone: e.target.value })}
                        className="w-full text-xs font-medium bg-white border border-gray-200/50 rounded-lg p-2 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-gray-500">Zalo ID / LinkedIn</label>
                      <input 
                        type="text" 
                        placeholder="Zalo (nếu có)"
                        value={contactForm.zalo || ""} 
                        onChange={e => setContactForm({ ...contactForm, zalo: e.target.value })}
                        className="w-full text-xs font-medium bg-white border border-gray-200/50 rounded-lg p-2 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-500">Ghi chú riêng về người liên hệ này</label>
                    <textarea 
                      placeholder="Tính cách, sở thích, ngày nghỉ hay tiếp nhận thông tin..."
                      value={contactForm.notes || ""} 
                      onChange={e => setContactForm({ ...contactForm, notes: e.target.value })}
                      className="w-full text-xs font-medium bg-white border border-gray-200/50 rounded-lg p-2 focus:ring-1 focus:ring-blue-500 focus:outline-none h-16"
                    />
                  </div>

                  <div className="flex items-center gap-6 text-xs pt-1">
                    <label className="flex items-center space-x-2 font-semibold text-gray-700 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={!!contactForm.isPrimary} 
                        onChange={e => setContactForm({ ...contactForm, isPrimary: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>Đánh dấu là Liên hệ chính (đầu mối ưu tiên liên lạc)</span>
                    </label>

                    <label className="flex items-center space-x-2 font-semibold text-gray-700 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={contactForm.isActive !== false} 
                        onChange={e => setContactForm({ ...contactForm, isActive: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>Còn đang công tác tại DN</span>
                    </label>
                  </div>

                  <div className="pt-2 flex justify-end gap-2.5">
                    <button 
                      type="button" 
                      onClick={() => setContactForm(null)}
                      className="px-4 py-2 border border-gray-300 text-gray-600 font-bold text-xs rounded-xl hover:bg-gray-100 transition"
                    >
                      Hủy bỏ
                    </button>
                    <button 
                      type="submit" 
                      className="inline-flex items-center px-4.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-2xs transition"
                    >
                      <Save className="h-3.5 w-3.5 mr-1" />
                      Lưu thông tin đầu mối
                    </button>
                  </div>
                </form>
              )}

              {/* Grid of contact entries */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {enterprise.contacts.map((contact) => (
                  <div 
                    key={contact.id} 
                    className={`p-4 rounded-2xl border ${contact.isPrimary ? "border-blue-200 bg-blue-50/10" : "border-gray-100 bg-white"} flex flex-col justify-between h-full space-y-4`}
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="text-sm font-bold text-slate-800">{contact.name}</h4>
                            {contact.isPrimary && (
                              <span className="text-[9px] bg-blue-100 text-blue-700 font-bold border border-blue-200 px-1.5 py-0.5 rounded-sm">
                                Liên hệ chính
                              </span>
                            )}
                            {!contact.isActive && (
                              <span className="text-[9px] bg-red-100 text-red-700 font-bold border border-red-200 px-1.5 py-0.5 rounded-sm">
                                Đã nghỉ việc
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5 font-semibold font-mono">{contact.position} • {contact.department || "Ban đại diện"}</p>
                        </div>
                        
                        <div className="flex space-x-1 shrink-0">
                          <button 
                            onClick={() => setContactForm(contact)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                            title="Chỉnh sửa"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteContact(contact.id)}
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                            title="Xóa đầu mối"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 space-y-1.5 text-xs font-mono text-gray-500">
                        {contact.email && (
                          <div className="flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                            <span className="truncate">{contact.email}</span>
                          </div>
                        )}
                        {contact.phone && (
                          <div className="flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                            <span className="font-bold">{contact.phone}</span>
                            {contact.zalo && <span className="text-[10px] text-blue-500 font-bold bg-blue-50 px-1 rounded-sm">Zalo</span>}
                          </div>
                        )}
                      </div>
                    </div>

                    {contact.notes && (
                      <p className="text-[11px] text-gray-400 italic bg-slate-50/50 p-2.5 rounded-xl border border-dashed border-gray-100 leading-normal">
                        Chú ý: {contact.notes}
                      </p>
                    )}
                  </div>
                ))}

                {enterprise.contacts.length === 0 && (
                  <div className="py-12 border border-dashed border-gray-200 rounded-xl text-center text-gray-400 col-span-2">
                    <User2 className="h-8 w-8 mx-auto opacity-30 mb-2" />
                    <p className="text-xs font-semibold">Chưa thiết lập liên hệ đại diện doanh nghiệp nào.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: INTERACTIONS LOG & TIMELINE (ACTIVITY ENTRIES) */}
          {activeTab === "interactions" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900">Nhật ký làm việc và Tương tác ({enterprise.interactions.length})</h3>
                <button 
                  onClick={() => setInteractionForm({ date: new Date().toISOString().substring(0, 16), type: InteractionType.CALL, followUpStatus: "NONE" })}
                  className="inline-flex items-center px-4 py-1.5 bg-blue-800 hover:bg-blue-900 text-white font-bold text-xs rounded-xl shadow-xs transition focus:outline-none"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Ghi chép đợt làm việc
                </button>
              </div>

              {/* Form to log interaction effort */}
              {interactionForm && (
                <form onSubmit={handleSaveInteraction} className="bg-slate-50 border border-gray-200 rounded-2xl p-5 space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-gray-200/50 pb-2">
                    <h4 className="text-xs font-bold text-gray-800 uppercase">
                      {interactionForm.id ? "Thay đổi nội dung đợt tương tác" : "Ghi nhận nỗ lực xúc tiến / Họp hành"}
                    </h4>
                    <button type="button" onClick={() => setInteractionForm(null)} className="text-gray-400 hover:text-gray-600">
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-gray-500">Bắt đầu tương tác lúc *</label>
                      <input 
                        type="datetime-local" 
                        required 
                        value={interactionForm.date ? new Date(interactionForm.date).toISOString().slice(0, 16) : ""} 
                        onChange={e => setInteractionForm({ ...interactionForm, date: new Date(e.target.value).toISOString() })}
                        className="w-full text-xs font-medium bg-white border border-gray-300 rounded-lg p-2 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-gray-500">Hình thức tương tác *</label>
                      <select 
                        required
                        value={interactionForm.type || ""} 
                        onChange={e => setInteractionForm({ ...interactionForm, type: e.target.value as InteractionType })}
                        className="w-full text-xs font-medium bg-white border border-gray-300 rounded-lg p-2 focus:outline-none"
                      >
                        <option value={InteractionType.CALL}>📞 Gọi điện thoại</option>
                        <option value={InteractionType.EMAIL}>📧 Trao đổi qua Thư điện tử (Email)</option>
                        <option value={InteractionType.MEETING_OFFLINE}>🏢 Họp trực tiếp tại điểm</option>
                        <option value={InteractionType.MEETING_ONLINE}>💻 Họp trao đổi trực tuyến (Google Meet/Teams)</option>
                        <option value={InteractionType.VISIT}>🚌 Đi thực địa tham quan (Company Tour)</option>
                        <option value={InteractionType.WORKSHOP}>🎓 Phối hợp Seminar / Talkshow</option>
                        <option value={InteractionType.MOU_SIGNING}>📜 Ký kết hợp tác MOU chính thức</option>
                        <option value={InteractionType.JOB_REQ}>💼 Tiếp nhận tin cơ hội việc làm</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-gray-500">Cán bộ chủ trì phía trường ĐH</label>
                      <select 
                        value={interactionForm.picId || ""} 
                        onChange={e => setInteractionForm({ ...interactionForm, picId: e.target.value })}
                        className="w-full text-xs font-medium bg-white border border-gray-300 rounded-lg p-2 focus:outline-none"
                      >
                        <option value="">-- Chọn cán bộ phụ trách --</option>
                        {usersList.map(u => (
                          <option key={u.id} value={u.id}>{u.fullName}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-500">Nội dung cuộc trao đổi *</label>
                    <textarea 
                      required
                      placeholder="Chi tiết câu chuyện trao đổi, các đề nghị hợp tác, đóng góp..."
                      value={interactionForm.content || ""} 
                      onChange={e => setInteractionForm({ ...interactionForm, content: e.target.value })}
                      className="w-full text-xs font-medium bg-white border border-gray-300 rounded-lg p-2 focus:outline-none h-20"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-500">Kết quả đạt được ban đầu (Kết quả cam kết)</label>
                    <input 
                      type="text" 
                      placeholder="E.g., DN gửi 10 kit IoT, HR cử đại diện tham gia Talkshow ngày 10/10"
                      value={interactionForm.result || ""} 
                      onChange={e => setInteractionForm({ ...interactionForm, result: e.target.value })}
                      className="w-full text-xs font-medium bg-white border border-gray-300 rounded-lg p-2 focus:outline-none"
                    />
                  </div>

                  {/* COUPLING FOLLOW UPS AND CHRON TASK */}
                  <div className="bg-white p-4.5 rounded-xl border border-gray-200/50 space-y-4">
                    <h5 className="text-[11px] font-bold text-blue-700 tracking-wider uppercase flex items-center">
                      <CheckSquare className="h-4 w-4 mr-1.5" />
                      Công vụ theo dõi tiếp theo (Follow-up Tasks)
                    </h5>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-gray-500">Hạn nộp nhắc việc (Follow up Deadline)</label>
                        <input 
                          type="date" 
                          value={interactionForm.followUpDeadline ? interactionForm.followUpDeadline.substring(0, 10) : ""} 
                          onChange={e => setInteractionForm({ ...interactionForm, followUpDeadline: e.target.value ? new Date(e.target.value).toISOString() : null, followUpStatus: "PENDING" })}
                          className="w-full text-xs font-medium bg-white border border-gray-300 rounded-lg p-2 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-gray-500">Trạng thái theo việc</label>
                        <select 
                          value={interactionForm.followUpStatus || "NONE"} 
                          onChange={e => setInteractionForm({ ...interactionForm, followUpStatus: e.target.value as any })}
                          className="w-full text-xs font-medium bg-white border border-gray-300 rounded-lg p-2 focus:outline-none"
                        >
                          <option value="NONE">Không có công vụ tiếp quản</option>
                          <option value="PENDING">⚠️ Đang chờ xử lý (Sẽ khởi tạo task tự động)</option>
                          <option value="COMPLETED">✅ Đã hoàn tất công vụ theo dõi này</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-gray-500">Mô tả công việc tiếp quản cụ thể</label>
                      <input 
                        type="text" 
                        placeholder="E.g., Liên kết phòng Đào tạo trường xin mộc phê duyệt, Soạn thảo email phản hồi"
                        value={interactionForm.followUpTasks || ""} 
                        onChange={e => setInteractionForm({ ...interactionForm, followUpTasks: e.target.value })}
                        className="w-full text-xs font-medium bg-white border border-gray-300 rounded-lg p-2 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end gap-2.5">
                    <button 
                      type="button" 
                      onClick={() => setInteractionForm(null)}
                      className="px-4 py-2 border border-gray-300 text-gray-600 font-bold text-xs rounded-xl hover:bg-gray-100 transition"
                    >
                      Hủy bỏ
                    </button>
                    <button 
                      type="submit" 
                      className="inline-flex items-center px-4.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition"
                    >
                      <Save className="h-3.5 w-3.5 mr-1" />
                      Ghi nhận nhật ký
                    </button>
                  </div>
                </form>
              )}

              {/* TIMELINE VIEW ENGINE */}
              <div className="relative border-l border-blue-100 ml-4.5 space-y-6">
                {enterprise.interactions.map((int) => {
                  const matchingPic = usersList.find(u => u.id === int.picId);
                  return (
                    <div key={int.id} className="relative pl-6" id={`timeline-item-${int.id}`}>
                      {/* Timeline dot */}
                      <span className="absolute -left-2 bg-blue-100 border-2 border-blue-600 rounded-full h-4 animate-ping duration-1000 w-4"></span>
                      <span className="absolute -left-2 bg-blue-600 border border-white rounded-full h-4 w-4"></span>
                      
                      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-3xs flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="space-y-2.5 flex-1">
                          
                          {/* Inner head row metadata */}
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] bg-slate-900 text-amber-300 font-bold px-2 py-0.5 rounded-sm">
                              {labelOf(INTERACTION_TYPE_LABELS, int.type)}
                            </span>
                            <span className="text-xs text-gray-400 font-mono font-semibold">
                              ⌛ {new Date(int.date).toLocaleDateString("vi-VN")} {new Date(int.date).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>

                          <div className="text-xs leading-relaxed text-gray-700 font-medium">
                            {int.content}
                          </div>

                          {int.result && (
                            <div className="text-xs bg-emerald-50 border border-emerald-100/70 p-3 rounded-lg text-emerald-800 leading-normal font-medium">
                              <strong>Thành quả:</strong> {int.result}
                            </div>
                          )}

                          {int.followUpDeadline && (
                            <div className={`text-xs p-3.5 rounded-lg border flex flex-col md:flex-row md:items-center justify-between gap-2.5 ${int.followUpStatus === "COMPLETED" ? "bg-slate-50 text-gray-500 border-gray-200" : "bg-rose-50 text-rose-800 border-rose-200"}`}>
                              <span className="font-semibold leading-normal">
                                📌 <strong>Cần tiếp quản:</strong> {int.followUpTasks || "Liên lạc lại"} (Hạn nộp: {new Date(int.followUpDeadline).toLocaleDateString("vi-VN")})
                              </span>
                              <span className={`inline-block px-2 py-0.5 rounded-sm font-semibold text-[9px] uppercase tracking-wider shrink-0 ${int.followUpStatus === "COMPLETED" ? "bg-slate-200 text-slate-700" : "bg-rose-100 text-rose-700"}`}>
                                {int.followUpStatus === "COMPLETED" ? "Đã xong" : "Chờ xử lý"}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="text-right shrink-0 mt-1 flex flex-row md:flex-col items-center md:items-end justify-between md:justify-start gap-4">
                          <div className="text-xs font-mono font-semibold text-gray-500">
                            Cán bộ: <span className="text-blue-600 font-black">{matchingPic?.fullName || "Staff"}</span>
                          </div>
                          
                          <div className="flex space-x-1.5 pt-1">
                            <button 
                              onClick={() => setInteractionForm(int)}
                              className="p-1 px-2 border border-gray-200 hover:border-blue-200 hover:bg-blue-50 text-blue-700 text-[10px] font-bold rounded-lg transition"
                            >
                              Sửa đổi
                            </button>
                            <button 
                              onClick={() => handleDeleteInteraction(int.id)}
                              className="p-1 px-2 border border-rose-100 hover:bg-rose-50 text-rose-600 text-[10px] font-bold rounded-lg transition"
                            >
                              Xóa log
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {enterprise.interactions.length === 0 && (
                  <div className="py-12 border border-dashed border-gray-200 rounded-xl text-center text-gray-400">
                    <Calendar className="h-8 w-8 mx-auto opacity-30 mb-2" />
                    <p className="text-xs font-semibold">Chưa có lịch sử làm việc. Bắt đầu liên hệ và ghi chép nhật ký nào!</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: PARTNERSHIP AGREEMENTS (MOU/REGISTRY) */}
          {activeTab === "mous" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900">Văn bản ký kết thỏa thuận hợp tác (MOU/MOA) ({enterprise.mous.length})</h3>
                <button 
                  onClick={() => setMouForm({ code: `12/${new Date().getFullYear()}/MOU-`, type: DocumentType.MOU, status: DocumentStatus.DA_KY, signDate: new Date().toISOString().substring(0, 10), effectiveDate: new Date().toISOString().substring(0, 10) })}
                  className="inline-flex items-center px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition focus:outline-none"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Đăng ký MOU mới
                </button>
              </div>

              {/* Form to log agreement Registry */}
              {mouForm && (
                <form onSubmit={handleSaveMOU} className="bg-slate-50 border border-gray-200 rounded-2xl p-5 space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-gray-200/50 pb-2">
                    <h4 className="text-xs font-bold text-gray-800 uppercase">
                      {mouForm.id ? "Thay đổi văn bản hợp tác" : "Phát hành số ký kết thỏa thuận (MOU/MOA)"}
                    </h4>
                    <button type="button" onClick={() => setMouForm(null)} className="text-gray-400 hover:text-gray-600">
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-gray-500 font-sans">Số / Ký hiệu văn bản *</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="E.g., 12/2026/MOU-HUST-VIETTEL"
                        value={mouForm.code || ""} 
                        onChange={e => setMouForm({ ...mouForm, code: e.target.value })}
                        className="w-full text-xs font-bold bg-white border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-gray-500">Phân định văn bản *</label>
                      <select 
                        required
                        value={mouForm.type || ""} 
                        onChange={e => setMouForm({ ...mouForm, type: e.target.value as DocumentType })}
                        className="w-full text-xs font-medium bg-white border border-gray-300 rounded-lg p-2 focus:outline-none"
                      >
                        <option value={DocumentType.MOU}>📜 Biên bản ghi nhớ (MOU)</option>
                        <option value={DocumentType.MOA}>📜 Biên bản thỏa thuận triển khai (MOA)</option>
                        <option value={DocumentType.CONTRACT}>📜 Hợp đồng nguyên tắc, thỏa thuận phát triển</option>
                        <option value={DocumentType.OTHER}>📃 Văn bản khác/Biên bản tài trợ</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-gray-500">Đại diện Khoa/Phòng phụ trách theo dõi *</label>
                      <select 
                        required
                        value={mouForm.departmentId || ""} 
                        onChange={e => setMouForm({ ...mouForm, departmentId: e.target.value })}
                        className="w-full text-xs font-medium bg-white border border-gray-300 rounded-lg p-2 focus:outline-none"
                      >
                        <option value="">-- Chọn Đơn vị phụ trách chính --</option>
                        {departmentsList.map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-gray-500">Ngày đặt bút ký *</label>
                      <input 
                        type="date" 
                        required
                        value={mouForm.signDate ? mouForm.signDate.substring(0, 10) : ""} 
                        onChange={e => setMouForm({ ...mouForm, signDate: new Date(e.target.value).toISOString() })}
                        className="w-full text-xs font-medium bg-white border border-gray-300 rounded-lg p-2 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-gray-500">Ngày có hiệu lực *</label>
                      <input 
                        type="date" 
                        required
                        value={mouForm.effectiveDate ? mouForm.effectiveDate.substring(0, 10) : ""} 
                        onChange={e => setMouForm({ ...mouForm, effectiveDate: new Date(e.target.value).toISOString() })}
                        className="w-full text-xs font-medium bg-white border border-gray-300 rounded-lg p-2 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-gray-500">Hạn hết hiệu lực * (Duy trì cảnh cáo)</label>
                      <input 
                        type="date" 
                        required
                        value={mouForm.expiryDate ? mouForm.expiryDate.substring(0, 10) : ""} 
                        onChange={e => setMouForm({ ...mouForm, expiryDate: new Date(e.target.value).toISOString() })}
                        className="w-full text-xs font-medium bg-white border border-gray-300 rounded-lg p-2 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-gray-500">Cán bộ theo dõi sát sao</label>
                      <select 
                        value={mouForm.picId || ""} 
                        onChange={e => setMouForm({ ...mouForm, picId: e.target.value })}
                        className="w-full text-xs font-medium bg-white border border-gray-300 rounded-lg p-2 focus:outline-none"
                      >
                        <option value="">-- Chọn chuyên viên theo dõi --</option>
                        {usersList.map(u => (
                          <option key={u.id} value={u.id}>{u.fullName}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-gray-500">Trạng thái triển khai</label>
                      <select 
                        value={mouForm.status || ""} 
                        onChange={e => setMouForm({ ...mouForm, status: e.target.value as DocumentStatus })}
                        className="w-full text-xs font-medium bg-white border border-gray-300 rounded-lg p-2 focus:outline-none"
                      >
                        <option value={DocumentStatus.SOAN_THAO}>Draft (Đang soạn thảo)</option>
                        <option value={DocumentStatus.TRINH_KY}>Trình ký Ban Giám hiệu</option>
                        <option value={DocumentStatus.DA_KY}>Active (Đã ký kết / Có hiệu lực)</option>
                        <option value={DocumentStatus.HET_HAN}>Expired (Đã hết hạn)</option>
                        <option value={DocumentStatus.THANH_LY}>Liquidated (Đã thanh lý)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-gray-500">File tài liệu liên kết / Số hóa</label>
                      <input 
                        type="text" 
                        placeholder="/files/tailieu_scan.pdf"
                        value={mouForm.fileUrl || ""} 
                        onChange={e => setMouForm({ ...mouForm, fileUrl: e.target.value })}
                        className="w-full text-xs font-medium bg-white border border-gray-300 rounded-lg p-2 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-500">Nội dung cốt lõi hợp tác trong MOU</label>
                    <textarea 
                      placeholder="Cam kết tiếp nhận bao nhiêu sinh viên thực tập mỗi kì học, mức tài trợ cuộc thi hay quỹ nghiên cứu khoa học..."
                      value={mouForm.content || ""} 
                      onChange={e => setMouForm({ ...mouForm, content: e.target.value })}
                      className="w-full text-xs font-medium bg-white border border-gray-300 rounded-lg p-2 focus:outline-none h-20"
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-2.5">
                    <button 
                      type="button" 
                      onClick={() => setMouForm(null)}
                      className="px-4 py-2 border border-gray-300 text-gray-600 font-bold text-xs rounded-xl hover:bg-gray-100 transition"
                    >
                      Hủy bỏ
                    </button>
                    <button 
                      type="submit" 
                      className="inline-flex items-center px-4.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition"
                    >
                      <Save className="h-3.5 w-3.5 mr-1" />
                      Đăng ký kết văn bản
                    </button>
                  </div>
                </form>
              )}

              {/* Cards for MOUs */}
              <div className="space-y-4">
                {enterprise.mous.map((mou) => {
                  const now = new Date().getTime();
                  const exprTime = new Date(mou.expiryDate).getTime();
                  const remainingDays = Math.ceil((exprTime - now) / (1000 * 3600 * 24));
                  const isExpiring = mou.status === DocumentStatus.DA_KY && remainingDays > 0 && remainingDays <= 90;
                  const isExpired = mou.status === DocumentStatus.HET_HAN || (mou.status === DocumentStatus.DA_KY && remainingDays <= 0);

                  return (
                    <div 
                      key={mou.id} 
                      className={`p-5 rounded-2xl border ${isExpired ? "border-red-200 bg-red-50/10" : isExpiring ? "border-amber-200 bg-amber-50/10" : "border-gray-100 bg-white"} space-y-4`}
                      id={`mou-card-${mou.id}`}
                    >
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono font-black text-sm text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-lg">
                              {mou.code}
                            </span>
                            <span className="text-[11px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                              {labelOf(DOCUMENT_TYPE_LABELS, mou.type)}
                            </span>
                            
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                              DOCUMENT_STATUS_COLORS[mou.status] || "bg-gray-100 text-gray-600 border-gray-200"
                            }`}>
                              {labelOf(DOCUMENT_STATUS_LABELS, mou.status)}
                            </span>
                          </div>

                          <h4 className="text-sm font-bold text-gray-800">
                            🏢 Đơn vị đầu mối: <span className="text-blue-600">{mou.departmentName}</span>
                          </h4>
                        </div>

                        <div className="flex gap-2 shrink-0 self-end md:self-start">
                          <button 
                            onClick={() => setMouForm(mou)}
                            className="p-1.5 border border-gray-200 text-gray-500 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-100 rounded-lg transition"
                            title="Sửa MOU"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteMOU(mou.id)}
                            className="p-1.5 border border-rose-100 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                            title="Gỡ văn bản"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-gray-600 font-medium leading-relaxed bg-slate-50 p-3 rounded-xl border border-gray-100">
                        {mou.content || "Nội dung hợp tác chưa điền."}
                      </p>

                      {/* Warnings and Dates list */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs pt-2">
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-gray-400 font-mono font-semibold">
                          <span>📅 Ký lúc: {new Date(mou.signDate).toLocaleDateString("vi-VN")}</span>
                          <span>⏳ Có hiệu: {new Date(mou.effectiveDate).toLocaleDateString("vi-VN")}</span>
                          <span className={isExpired ? "text-red-600 font-bold" : isExpiring ? "text-amber-600 font-bold" : ""}>
                            🛑 Hết hạn: {new Date(mou.expiryDate).toLocaleDateString("vi-VN")}
                          </span>
                        </div>

                        {/* Critical status notices box */}
                        {isExpired ? (
                          <span className="inline-flex items-center text-xs font-semibold bg-red-50 text-red-600 border border-red-200 p-1 px-2.5 rounded-lg">
                            <AlertCircle className="h-4 w-4 mr-1 shrink-0" />
                            Đã hết hiệu lực! Sắp xếp lịch đàm phán tái ký ngay lập tức.
                          </span>
                        ) : isExpiring ? (
                          <span className="inline-flex items-center text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 p-1 px-2.5 rounded-lg animate-pulse">
                            <AlertCircle className="h-4 w-4 mr-1 shrink-0" />
                            Sắp hết hiệu lực (Còn {remainingDays} ngày). Tiến hành soạn mail xin gia hạn.
                          </span>
                        ) : (
                          <span className="text-xs text-emerald-600 font-medium select-none bg-emerald-50 px-2 py-0.5 rounded">
                            ✓ Có hiệu lực bình thường
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {enterprise.mous.length === 0 && (
                  <div className="py-12 border border-dashed border-gray-200 rounded-xl text-center text-gray-400">
                    <FileText className="h-8 w-8 mx-auto opacity-30 mb-2" />
                    <p className="text-xs font-semibold">Hiện chưa lập biên bản ghi nhớ hợp tác MOU cụ thể với Doanh nghiệp này.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: ACTIVE JOB AND INTERNSHIP DEMANDS */}
          {activeTab === "jobs" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900">Báo cáo nhu cầu tuyển dụng & Thực tập sinh ({enterprise.jobs.length})</h3>
                <button 
                  onClick={() => setJobForm({ type: JobType.INTERN, quantity: 15, status: JobStatus.ACTIVE, dateDeadline: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().substring(0, 10), salary: "Thỏa thuận" })}
                  className="inline-flex items-center px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition focus:outline-none"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Đăng tuyển cơ hội việc làm
                </button>
              </div>

              {/* Form to log and edit job */}
              {jobForm && (
                <form onSubmit={handleSaveJob} className="bg-slate-50 border border-gray-200 rounded-2xl p-5 space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-gray-200/50 pb-2">
                    <h4 className="text-xs font-bold text-gray-800 uppercase">
                      {jobForm.id ? "Sửa đổi thông tin buổi phỏng vấn/tin tuyển" : "Phát động tin tuyển dụng học việc mới"}
                    </h4>
                    <button type="button" onClick={() => setJobForm(null)} className="text-gray-400 hover:text-gray-600">
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="block text-xs font-semibold text-gray-500">Tiêu đề tin tuyển dụng / Nhu cầu thực tập *</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="E.g., Thực tập sinh Lập trình viên React & Node.js"
                        value={jobForm.title || ""} 
                        onChange={e => setJobForm({ ...jobForm, title: e.target.value })}
                        className="w-full text-xs font-bold bg-white border border-gray-300 rounded-lg p-2 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-gray-500">Hình thức công việc *</label>
                      <select 
                        required
                        value={jobForm.type || ""} 
                        onChange={e => setJobForm({ ...jobForm, type: e.target.value as JobType })}
                        className="w-full text-xs font-medium bg-white border border-gray-300 rounded-lg p-2 focus:outline-none"
                      >
                        <option value={JobType.FULLTIME}>💼 Việc làm Full-time</option>
                        <option value={JobType.PARTTIME}>💼 Việc làm Part-time</option>
                        <option value={JobType.INTERN}>💼 Thực tập sinh (Internship)</option>
                        <option value={JobType.CTV}>💼 Cộng tác viên cơ hội tự do (CTV)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-gray-500 font-sans">Mức thu nhập / Trợ cấp tuyển dụng</label>
                      <input 
                        type="text" 
                        placeholder="E.g., 3,000,000đ - 5,000,000đ"
                        value={jobForm.salary || ""} 
                        onChange={e => setJobForm({ ...jobForm, salary: e.target.value })}
                        className="w-full text-xs font-medium bg-white border border-gray-300 rounded-lg p-2 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-gray-500">Hạn chót ứng tuyển *</label>
                      <input 
                        type="date" 
                        required
                        value={jobForm.dateDeadline ? jobForm.dateDeadline.substring(0, 10) : ""} 
                        onChange={e => setJobForm({ ...jobForm, dateDeadline: new Date(e.target.value).toISOString() })}
                        className="w-full text-xs font-medium bg-white border border-gray-300 rounded-lg p-2 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5 font-sans">
                      <label className="block text-xs font-semibold text-gray-500">Chỉ tiêu Số lượng cần tuyển (người) *</label>
                      <input 
                        type="number" 
                        required
                        value={jobForm.quantity || 0} 
                        onChange={e => setJobForm({ ...jobForm, quantity: Number(e.target.value) })}
                        className="w-full text-xs font-bold bg-white border border-gray-300 rounded-lg p-2 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-gray-500 font-sans">Các ngành đào tạo trường ĐH phù hợp *</label>
                      <input 
                        type="text" 
                        required
                        placeholder="E.g., Công nghệ thông tin, Khoa học dữ liệu, Toán tin"
                        value={jobForm.majors || ""} 
                        onChange={e => setJobForm({ ...jobForm, majors: e.target.value })}
                        className="w-full text-xs font-medium bg-white border border-gray-300 rounded-lg p-2 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-gray-500">Địa điểm làm việc</label>
                      <input 
                        type="text" 
                        placeholder="E.g., Duy Tân, Cầu Giấy, Hà Nội"
                        value={jobForm.location || ""} 
                        onChange={e => setJobForm({ ...jobForm, location: e.target.value })}
                        className="w-full text-xs font-medium bg-white border border-gray-300 rounded-lg p-2 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-500">Mô tả công việc (Mục tiêu học tập/trách nhiệm)</label>
                    <textarea 
                      placeholder="Công cụ chính sử dụng, kĩ năng đạt được, điều kiện đãi lý..."
                      value={jobForm.description || ""} 
                      onChange={e => setJobForm({ ...jobForm, description: e.target.value })}
                      className="w-full text-xs font-medium bg-white border border-gray-300 rounded-lg p-2 focus:outline-none h-16"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-500">Yêu cầu năng lực ứng viên</label>
                    <textarea 
                      placeholder="Yêu cầu điểm số GPA tối thiểu, ngoại ngữ, kĩ năng giao tiếp..."
                      value={jobForm.requirements || ""} 
                      onChange={e => setJobForm({ ...jobForm, requirements: e.target.value })}
                      className="w-full text-xs font-medium bg-white border border-gray-300 rounded-lg p-2 focus:outline-none h-14"
                    />
                  </div>

                  {/* Contact of HR recruiters */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white/50 p-4 border border-gray-200/50 rounded-xl">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-gray-500 font-sans">Đầu mối tuyển dụng DN (Họ tên)</label>
                      <input 
                        type="text" 
                        value={jobForm.contactName || ""} 
                        onChange={e => setJobForm({ ...jobForm, contactName: e.target.value })}
                        className="w-full text-xs font-medium bg-white border border-gray-200 rounded-lg p-2 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-gray-500">Email nộp CV</label>
                      <input 
                        type="email" 
                        value={jobForm.contactEmail || ""} 
                        onChange={e => setJobForm({ ...jobForm, contactEmail: e.target.value })}
                        className="w-full text-xs font-semibold bg-white border border-gray-200 rounded-lg p-2 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-gray-500 font-sans">Trạng thái tin hiển thị</label>
                      <select 
                        value={jobForm.status || ""} 
                        onChange={e => setJobForm({ ...jobForm, status: e.target.value as any })}
                        className="w-full text-xs font-medium bg-white border border-gray-200 rounded-lg p-2 focus:outline-none"
                      >
                        <option value={JobStatus.NEW}>Tin mới tiếp nhận</option>
                        <option value={JobStatus.ACTIVE}>Active (Đang đăng tin công khai)</option>
                        <option value={JobStatus.CLOSED}>Closed (Đã dừng tuyển)</option>
                        <option value={JobStatus.COMPLETED}>Completed (Đã tuyển dụng thành công)</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end gap-2.5">
                    <button 
                      type="button" 
                      onClick={() => setJobForm(null)}
                      className="px-4 py-2 border border-gray-300 text-gray-600 font-bold text-xs rounded-xl hover:bg-gray-100 transition"
                    >
                      Hủy bỏ
                    </button>
                    <button 
                      type="submit" 
                      className="inline-flex items-center px-4.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition"
                    >
                      <Save className="h-3.5 w-3.5 mr-1" />
                      Lưu và xuất bản
                    </button>
                  </div>
                </form>
              )}

              {/* Recruitment Lists Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {enterprise.jobs.map((job) => (
                  <div 
                    key={job.id} 
                    className="p-5 rounded-2xl border border-gray-100 bg-white hover:border-blue-100 hover:shadow-3xs transition flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[9px] bg-blue-50 border border-blue-100 font-bold text-blue-700 px-2 py-0.5 rounded">
                              {labelOf(JOB_TYPE_LABELS, job.type)}
                            </span>
                            <span className={`text-[10px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                              JOB_STATUS_COLORS[job.status] || "bg-gray-100 text-gray-500 border-gray-200"
                            }`}>
                              {labelOf(JOB_STATUS_LABELS, job.status)}
                            </span>
                          </div>

                          <h4 className="text-sm font-bold text-slate-800 leading-normal mt-1.5">{job.title}</h4>
                        </div>

                        <div className="flex space-x-1 shrink-0 ml-3">
                          <button 
                            onClick={() => setJobForm(job)}
                            className="p-1 px-1.5 border border-gray-200 text-gray-500 hover:text-blue-600 rounded transition"
                          >
                            Sửa
                          </button>
                          <button 
                            onClick={() => handleDeleteJob(job.id)}
                            className="p-1 px-1.5 border border-rose-100 text-rose-500 hover:text-rose-700 rounded transition"
                          >
                            Gỡ
                          </button>
                        </div>
                      </div>

                      <div className="mt-3.5 space-y-2 text-xs text-gray-600 leading-relaxed">
                        <p className="font-semibold text-gray-700 bg-slate-50 p-2 rounded-xl">
                          🎓 <strong>Ngành nghề tương ứng:</strong> {job.majors}
                        </p>
                        <p className="font-medium">
                          💰 <strong>Trợ cấp nương bổng:</strong> {job.salary} • 👥 <strong>Số lượng:</strong> {job.quantity} nhân sự.
                        </p>
                        {job.description && (
                          <p className="text-gray-400 font-medium line-clamp-3 bg-blue-50/10 p-2 rounded-xl border border-dashed border-blue-50 leading-normal">
                            📋 {job.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-50 flex flex-wrap items-center justify-between text-xs text-gray-400 font-mono mt-auto">
                      <span>📅 Hạn ứng tuyển: <strong className="text-red-500">{new Date(job.dateDeadline).toLocaleDateString("vi-VN")}</strong></span>
                      {job.contactEmail && <span>📥 CV gửi: <strong className="font-sans text-gray-600 font-semibold">{job.contactEmail}</strong></span>}
                    </div>
                  </div>
                ))}

                {enterprise.jobs.length === 0 && (
                  <div className="py-12 border border-dashed border-gray-200 rounded-xl text-center text-gray-400 col-span-2">
                    <Briefcase className="h-8 w-8 mx-auto opacity-30 mb-2" />
                    <p className="text-xs font-semibold">Hiện tại doanh nghiệp chưa gửi cơ hội thông báo cần sinh viên thực tập nào.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: ASSOCIATED SEMINARS & NETWORKING EVENTS */}
          {activeTab === "events" && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-900">Các hoạt động phối hợp, Seminar, Company Tour đã kết nối</h3>
              <p className="text-xs text-gray-400">Tự động tập hợp những sự kiện đào tạo học bổng do nhà trường tổ chức mà doanh nghiệp cùng tham gia đồng hành.</p>

              <div className="space-y-3 pt-3">
                {enterprise.events.map((ev) => (
                  <div key={ev.id} className="p-4 border border-gray-100 bg-slate-50/45 hover:bg-slate-50 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-sm">
                          {ev.type}
                        </span>
                        <span className="text-[10px] font-mono text-gray-400 font-bold">
                          {new Date(ev.date).toLocaleDateString("vi-VN")}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-800 truncate">{ev.title}</h4>
                      <p className="text-[11px] text-gray-400 font-semibold font-mono">📍 Địa điểm: {ev.location} • {ev.joinCount} Sinh viên đăng ký.</p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="inline-block px-3 py-1 bg-white border border-gray-200 text-gray-600 text-xs font-bold font-mono rounded-lg shadow-3xs">
                        {String(ev.status).toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}

                {enterprise.events.length === 0 && (
                  <div className="py-12 border border-dashed border-gray-200 rounded-xl text-center text-gray-400">
                    <Calendar className="h-8 w-8 mx-auto opacity-30 mb-2" />
                    <p className="text-xs font-semibold">Chưa có sự kiện phối hợp thực hành kỹ năng nào được ghi lại cùng đối tác này.</p>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
