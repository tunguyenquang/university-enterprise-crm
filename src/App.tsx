import React, { useState, useEffect } from "react";
import { 
  User, Department, Enterprise, PartnershipDocument, Job, Event, Task, Notification, AuditLog,
  EnterpriseStatus, EnterprisePriority, InteractionType, DocumentStatus, DocumentType, JobType, JobStatus, TaskStatus, TaskPriority, RoleCode
} from "./types/crm.ts";
import CrmDashboard from "./components/CrmDashboard.tsx";
import PipelineKanban from "./components/PipelineKanban.tsx";
import EnterpriseDetails from "./components/EnterpriseDetails.tsx";
import MouManagement from "./components/MouManagement.tsx";
import UserManagement from "./components/UserManagement.tsx";
import { 
  Building2, FileText, Briefcase, Calendar, CheckSquare, Shield, LogOut, Search, Plus, Filter, Download, ArrowRightLeft, UserCheck, Bell, Check, Trash2, Edit2, ShieldAlert, Award, Grid, Menu, X, ToggleLeft, RefreshCcw, Info
} from "lucide-react";

export default function App() {
  // Authentication states
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("crm_token"));
  const [user, setUser] = useState<any>(() => {
    const saved = localStorage.getItem("crm_user");
    return saved ? JSON.parse(saved) : null;
  });
  
  // Login states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<"dashboard" | "enterprises" | "kanban" | "mous" | "jobs" | "events" | "tasks" | "users">("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Core Data Lists
  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
  const [mousList, setMousList] = useState<PartnershipDocument[]>([]);
  const [jobsList, setJobsList] = useState<Job[]>([]);
  const [eventsList, setEventsList] = useState<Event[]>([]);
  const [tasksList, setTasksList] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [departmentsList, setDepartmentsList] = useState<Department[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // List loading triggers
  const [listLoading, setListLoading] = useState(false);

  // Enterprise specific state triggers
  const [selectedEnterpriseId, setSelectedEnterpriseId] = useState<string | null>(null);
  const [enterpriseModalOpen, setEnterpriseModalOpen] = useState(false);
  const [mouModalOpen, setMouModalOpen] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [fieldFilter, setFieldFilter] = useState("");

  // Create Form states
  const [newEntForm, setNewEntForm] = useState<any>({
    code: "", name: "", shortName: "", taxCode: "", field: "Công nghệ thông tin & Viễn thông",
    scale: "Trên 500 nhân sự", type: "Tư nhân Việt Nam", address: "", city: "Hà Nội",
    website: "", linkedin: "", description: "", status: EnterpriseStatus.TIEM_NANG,
    priority: EnterprisePriority.THUONG, picId: "", facultyIds: [], tags: []
  });

  const [newMouForm, setNewMouForm] = useState<any>({
    code: "", type: DocumentType.MOU, enterpriseId: "", departmentId: "",
    signDate: new Date().toISOString().substring(0, 10),
    effectiveDate: new Date().toISOString().substring(0, 10),
    expiryDate: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().substring(0, 10),
    picId: "", content: "", status: DocumentStatus.DA_KY, fileUrl: ""
  });

  const [newTaskForm, setNewTaskForm] = useState<any>({
    title: "", description: "", dueDate: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString().substring(0, 10),
    priority: TaskPriority.MEDIUM, status: TaskStatus.TODO, enterpriseId: "", assigneeId: ""
  });


  // ==========================================
  // FETCH PIPELINED DATA FROM REST API
  // ==========================================
  const loadCrmData = async () => {
    if (!token) return;
    try {
      setListLoading(true);
      
      const headers = { Authorization: `Bearer ${token}` };

      // Parallelize fetches
      const [entsRes, mousRes, jobsRes, evsRes, tasksRes, notifsRes, usersRes, deptsRes, logsRes] = await Promise.all([
        fetch(`/api/enterprises`, { headers }),
        fetch(`/api/mous`, { headers }),
        fetch(`/api/jobs`, { headers }),
        fetch(`/api/events`, { headers }),
        fetch(`/api/tasks`, { headers }),
        fetch(`/api/notifications`, { headers }),
        fetch(`/api/users`, { headers }),
        fetch(`/api/departments`, { headers }),
        fetch(`/api/auth/me`, { headers }).then(() => fetch(`/api/users` /* simulated log access fallback */, { headers }).catch(() => null))
      ]);

      if (entsRes.ok) setEnterprises(await entsRes.json());
      if (mousRes.ok) setMousList(await mousRes.json());
      if (jobsRes.ok) setJobsList(await jobsRes.json());
      if (evsRes.ok) setEventsList(await evsRes.json());
      if (tasksRes.ok) setTasksList(await tasksRes.json());
      if (notifsRes.ok) setNotifications(await notifsRes.json());
      if (usersRes.ok) setUsersList(await usersRes.json());
      if (deptsRes.ok) setDepartmentsList(await deptsRes.json());

    } catch (err) {
      console.error("Lỗi khi đồng bộ dữ liệu CRM: ", err);
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadCrmData();
    }
  }, [token]);

  // Handle Quick login simulation
  const handleQuickLogin = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword("Password123!");
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Đăng nhập thất bại");
      }

      const data = await res.json();
      localStorage.setItem("crm_token", data.token);
      localStorage.setItem("crm_user", JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      
      // Default to target landing page
      setActiveTab("dashboard");
    } catch (err: any) {
      setLoginError(err.message || "Địa chỉ email hoặc mật khẩu không khớp.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = (reason?: string) => {
    localStorage.removeItem("crm_token");
    localStorage.removeItem("crm_user");
    setToken(null);
    setUser(null);
    setSelectedEnterpriseId(null);
    if (reason) setLoginError(reason);
  };

  // ==========================================
  // QUẢN LÝ PHIÊN: TỰ ĐĂNG XUẤT KHI TOKEN HẾT HẠN (#16)
  // ==========================================

  // Đọc thời điểm hết hạn (exp) trong JWT mà không cần thư viện.
  const getTokenExpiry = (jwt: string | null): number | null => {
    if (!jwt) return null;
    try {
      const payload = JSON.parse(atob(jwt.split(".")[1]));
      return typeof payload.exp === "number" ? payload.exp * 1000 : null;
    } catch {
      return null;
    }
  };

  // (a) Chặn mọi phản hồi 401 từ API => coi như phiên hết hạn, tự đăng xuất mượt.
  useEffect(() => {
    const originalFetch = window.fetch.bind(window);
    window.fetch = async (...args) => {
      const res = await originalFetch(...args);
      const url = typeof args[0] === "string" ? args[0] : (args[0] as Request)?.url || "";
      // Bỏ qua chính route login để không tự đăng xuất khi nhập sai mật khẩu.
      if (res.status === 401 && url.includes("/api/") && !url.includes("/api/auth/login")) {
        handleLogout("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      }
      return res;
    };
    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  // (b) Chủ động đăng xuất đúng thời điểm token hết hạn (không chờ tới khi gọi API).
  useEffect(() => {
    if (!token) return;
    const expiry = getTokenExpiry(token);
    if (!expiry) return;
    const msLeft = expiry - Date.now();
    if (msLeft <= 0) {
      handleLogout("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      return;
    }
    const timer = setTimeout(
      () => handleLogout("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."),
      Math.min(msLeft, 2 ** 31 - 1)
    );
    return () => clearTimeout(timer);
  }, [token]);

  // ==========================================
  // BUSINESS CRUD PROCESSORS (DIRECT FROM FRONT END ACTION)
  // ==========================================

  // Save/Create Enterprise
  const handleCreateEnterprise = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/enterprises", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newEntForm,
          picId: newEntForm.picId || user.id,
          tags: typeof newEntForm.tags === "string" ? (newEntForm.tags as string).split(",").map(t => t.trim()).filter(Boolean) : newEntForm.tags
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Tạo doanh nghiệp thất bại");
      }

      setEnterpriseModalOpen(false);
      // Reset form
      setNewEntForm({
        code: "", name: "", shortName: "", taxCode: "", field: "Công nghệ thông tin & Viễn thông",
        scale: "Trên 500 nhân sự", type: "Tư nhân Việt Nam", address: "", city: "Hà Nội",
        website: "", linkedin: "", description: "", status: EnterpriseStatus.TIEM_NANG,
        priority: EnterprisePriority.THUONG, picId: "", facultyIds: [], tags: []
      });
      loadCrmData();
    } catch (err: any) {
      alert("Lỗi: " + err.message);
    }
  };

  // Quick Inline Status Update (e.g. from Kanban column drag arrows)
  const handleUpdateEnterpriseStatus = async (id: string, newStatus: EnterpriseStatus) => {
    try {
      const res = await fetch(`/api/enterprises/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!res.ok) throw new Error("Cập nhật trạng thái thất bại");
      loadCrmData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Upload file đính kèm cho MOU (bản scan văn bản đã ký).
  const [mouUploading, setMouUploading] = useState(false);
  const handleMouFileUpload = async (file: File | null) => {
    if (!file) return;
    setMouUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/mous/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Tải file thất bại");
      setNewMouForm((prev: any) => ({ ...prev, fileUrl: data.fileUrl }));
    } catch (err: any) {
      alert("Lỗi tải file: " + err.message);
    } finally {
      setMouUploading(false);
    }
  };

  // Create MOU Registry
  const handleCreateMou = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/mous", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newMouForm,
          picId: newMouForm.picId || user.id
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Không thể đăng ký MOU.");
      }

      setMouModalOpen(false);
      setNewMouForm({
        code: "", type: DocumentType.MOU, enterpriseId: "", departmentId: "",
        signDate: new Date().toISOString().substring(0, 10),
        effectiveDate: new Date().toISOString().substring(0, 10),
        expiryDate: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().substring(0, 10),
        picId: "", content: "", status: DocumentStatus.DA_KY, fileUrl: ""
      });
      loadCrmData();
    } catch (err: any) {
      alert("Lỗi: " + err.message);
    }
  };

  // Create Task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newTaskForm,
          assigneeId: newTaskForm.assigneeId || user.id
        })
      });

      if (!res.ok) throw new Error("Chắp cánh tạo task thất bại");
      setTaskModalOpen(false);
      setNewTaskForm({
        title: "", description: "", dueDate: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString().substring(0, 10),
        priority: TaskPriority.MEDIUM, status: TaskStatus.TODO, enterpriseId: "", assigneeId: ""
      });
      loadCrmData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Complete/Toggle Task inline
  const handleToggleTaskStatus = async (task: Task) => {
    const nextStatus = task.status === TaskStatus.COMPLETED ? TaskStatus.TODO : TaskStatus.COMPLETED;
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        loadCrmData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Mark all notifications as read
  const handleMarkNotifRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      loadCrmData();
    } catch (err) {
      console.error(err);
    }
  };

  // Simulated CSV report downloader key data
  const handleDownloadCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Mã DN,Tên Doanh Nghiệp,Lĩnh vực,Mức hợp tác,Tỉnh thành"].join(",") + "\n"
      + enterprises.map(e => `"${e.code}","${e.name}","${e.field}","${e.status}","${e.city}"`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Danh_sach_Doanh_nghiep_QHDN.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  // ==========================================
  // UNIFIED FILTERING PROCESSORS (LOCAL LIST PRE-RENDERING)
  // ==========================================
  const filteredEnterprises = enterprises.filter(e => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = e.name.toLowerCase().includes(query) || 
      e.code.toLowerCase().includes(query) || 
      (e.shortName && e.shortName.toLowerCase().includes(query)) ||
      e.field.toLowerCase().includes(query);
    
    const matchesStatus = !statusFilter || e.status === statusFilter;
    const matchesPriority = !priorityFilter || e.priority === priorityFilter;
    const matchesField = !fieldFilter || e.field.toLowerCase().includes(fieldFilter.toLowerCase());

    return matchesSearch && matchesStatus && matchesPriority && matchesField;
  });

  const activeNotis = notifications.filter(n => !n.isRead);

  // ==========================================
  // VIEW RENDER CONSTRUCT (NOT AUTHENTICATED -> RENDER LOGIN)
  // ==========================================
  if (!token || !user) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans antialiased relative overflow-hidden">
        
        {/* Subtle geometric circles styling */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 blur-[130px] rounded-full pointer-events-none"></div>
        <div className="absolute top-20 left-20 w-[300px] h-[300px] bg-cyan-500/5 blur-[90px] rounded-full pointer-events-none"></div>

        <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
          <div className="flex justify-center items-center space-x-3 mb-2">
            <div className="p-3 bg-blue-600/20 border border-blue-500/30 text-blue-400 rounded-2xl shadow-inner">
              <Building2 className="h-8 w-8 animate-pulse" />
            </div>
            <div>
              <span className="text-blue-400 font-bold uppercase tracking-widest text-[10px] font-mono block">Cổng CRM Nhà Trường</span>
              <h1 className="text-xl font-extrabold text-white">UniPartner Relations</h1>
            </div>
          </div>
          <h2 className="mt-2 text-center text-sm text-slate-400 font-medium">
            Hệ thống CRM quản lý sâu sát Quan hệ Doanh nghiệp & Việc làm Sinh viên
          </h2>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl relative z-10" id="login-container">
          <div className="bg-slate-800 border border-slate-700/60 py-8 px-4 shadow-2xl rounded-3xl sm:px-10 space-y-6">
            <form className="space-y-5" onSubmit={handleLoginSubmit}>
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Địa chỉ Email Cán bộ (.edu.vn) *</label>
                <input 
                  type="email" 
                  required 
                  placeholder="E.g., admin@hust.edu.vn"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full text-sm font-semibold bg-slate-950 border border-slate-700 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">Mật khẩu tài khoản *</label>
                </div>
                <input 
                  type="password" 
                  required 
                  placeholder="Mật khẩu bảo mật"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full text-sm font-semibold bg-slate-950 border border-slate-700 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {loginError && (
                <div className="p-3.5 bg-red-950/40 border border-red-800/80 rounded-xl text-red-300 text-xs font-medium flex items-center">
                  <ShieldAlert className="h-4 w-4 mr-2 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <button 
                type="submit" 
                disabled={loginLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-98 transition focus:outline-none"
              >
                {loginLoading ? "Đang xác thực bảo mật..." : "Xác thực danh tính & Truy cập"}
              </button>
            </form>

            {/* QUICK SWAP DEMO ROLES PANEL FOR EVALUATION - PREMIER UX */}
            <div className="border-t border-slate-700/50 pt-5 space-y-3">
              <span className="block text-[11px] font-bold text-slate-400 tracking-widest uppercase text-center">
                Bộ lọc phân quyền nhanh (Đánh giá chấm điểm)
              </span>
              <p className="text-[10px] text-slate-500 text-center leading-normal">
                Bấm nút đổi tài khoản ngay để kiểm thử logic thu gọn, phân chia khoa/ngành và quyền cấu hình MOU.
              </p>
              
              <div className="grid grid-cols-2 gap-2.5">
                <button 
                  onClick={() => handleQuickLogin("admin@hust.edu.vn")}
                  className="p-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-xl text-[11px] font-bold text-blue-400 text-left hover:border-blue-500/30 transition focus:outline-none"
                  id="demo-admin"
                >
                  <p className="font-extrabold truncate text-white">1. Nguyễn Văn Admin</p>
                  <p className="text-[9px] text-slate-500 mt-0.5 font-normal">Super Admin / Đầy đủ quyền</p>
                </button>

                <button 
                  onClick={() => handleQuickLogin("bgh.hai@hust.edu.vn")}
                  className="p-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-xl text-[11px] font-bold text-blue-400 text-left hover:border-blue-500/30 transition focus:outline-none"
                  id="demo-leader"
                >
                  <p className="font-extrabold truncate text-white">2. PGS. TS Trần Đức Hải</p>
                  <p className="text-[9px] text-slate-500 mt-0.5 font-normal">Lãnh đạo / Chỉ xem báo cáo</p>
                </button>

                <button 
                  onClick={() => handleQuickLogin("qhdn.an@hust.edu.vn")}
                  className="p-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-xl text-[11px] font-bold text-blue-400 text-left hover:border-blue-500/30 transition focus:outline-none"
                  id="demo-staff"
                >
                  <p className="font-extrabold truncate text-white">3. CN. Lê Hoài An</p>
                  <p className="text-[9px] text-slate-500 mt-0.5 font-normal">Chuyên viên QHDN / Ghi log</p>
                </button>

                <button 
                  onClick={() => handleQuickLogin("cntt.minh@hust.edu.vn")}
                  className="p-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-xl text-[11px] font-bold text-blue-400 text-left hover:border-blue-500/30 transition focus:outline-none"
                  id="demo-faculty"
                >
                  <p className="font-extrabold truncate text-white">4. TS. Nguyễn Khánh Minh</p>
                  <p className="text-[9px] text-slate-500 mt-0.5 font-normal">Cán bộ CNTT / Chỉ xem DN khoa</p>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Vietnamese translator for active tabs title
  const viewTitles = {
    dashboard: "Tổng quan & KPIs",
    enterprises: "Hồ sơ Doanh nghiệp",
    kanban: "Pipeline Tiến độ hợp tác",
    mous: "Hợp tác MOU/MOA",
    jobs: "Cơ hội Việc làm & Thực tập",
    events: "Sự kiện Hợp tác",
    tasks: "Nhắc việc & Follow-up",
    users: "Cán bộ & Phân quyền"
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 antialiased flex">
      
      {/* 1. SIDEBAR NAVIGATION PANELS */}
      <aside 
        className={`${sidebarOpen ? "w-64" : "w-20"} shrink-0 bg-slate-900 text-slate-300 min-h-screen flex flex-col justify-between transition-all duration-300 z-30`}
        id="main-sidebar"
      >
        <div>
          {/* Sidebar head title */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2.5 overflow-hidden">
              <div className="p-2 bg-blue-600/30 border border-blue-500/30 text-blue-400 rounded-xl shrink-0">
                <Building2 className="h-5 w-5" />
              </div>
              {sidebarOpen && (
                <div className="truncate">
                  <h2 className="text-sm font-bold text-white tracking-tight">HUST CRM</h2>
                  <span className="text-[9px] text-slate-500 font-mono font-bold tracking-widest block uppercase">Quan hệ Doanh nghiệp</span>
                </div>
              )}
            </div>
            
            {/* Collapse toggle */}
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-slate-500 hover:text-white transition focus:outline-none"
            >
              <ArrowRightLeft className="h-4 w-4 shrink-0 transform rotate-180" />
            </button>
          </div>

          {/* User Brief section */}
          {sidebarOpen && (
            <div className="p-4 border-b border-slate-800/60 bg-slate-950/20">
              <div className="flex items-center space-x-3">
                <div className="h-9 w-9 flex items-center justify-center rounded-full bg-blue-600 text-white text-xs font-black">
                  {user.fullName.slice(-2)}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">{user.fullName}</p>
                  <p className="text-[9px] text-blue-400 font-mono tracking-wide truncate mt-0.5">
                    🛡️ {user.role?.name || "Cán bộ"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Nav items list */}
          <nav className="p-3.5 space-y-1.5 list-none">
            {[
              { code: "dashboard", label: "Dashboard KPIs", icon: Grid, badge: null },
              { code: "enterprises", label: "Hồ sơ Doanh nghiệp", icon: Building2, badge: enterprises.length },
              { code: "kanban", label: "Pipeline Hợp tác", icon: ArrowRightLeft, badge: null },
              { code: "mous", label: "Hỏi thoả thuận MOU", icon: FileText, badge: mousList.filter(m => {
                const now = new Date().getTime();
                const remaining = Math.ceil((new Date(m.expiryDate).getTime() - now) / (1000 * 3600 * 24));
                return m.status === DocumentStatus.DA_KY && remaining <= 90;
              }).length && "⚠️" },
              { code: "jobs", label: "Nhu cầu Việc làm", icon: Briefcase, badge: jobsList.length },
              { code: "events", label: "Sự kiện phối hợp", icon: Calendar, badge: eventsList.length },
              { code: "tasks", label: "Nhắc việc & Follow-up", icon: CheckSquare, badge: tasksList.filter(t => t.status !== TaskStatus.COMPLETED).length },
              { code: "users", label: "Cán bộ & Phân quyền", icon: Shield, badge: null }
            ].map((item) => (
              <li key={item.code}>
                <button
                  onClick={() => {
                    setActiveTab(item.code as any);
                    setSelectedEnterpriseId(null);
                  }}
                  className={`w-full flex items-center p-3 text-xs font-bold rounded-xl transition ${
                    activeTab === item.code && !selectedEnterpriseId
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/10" 
                      : "hover:bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                  id={`nav-${item.code}`}
                >
                  <item.icon className="h-4.5 w-4.5 shrink-0" />
                  {sidebarOpen && (
                    <span className="ml-3 truncate flex-1 text-left">{item.label}</span>
                  )}
                  {sidebarOpen && item.badge !== null && item.badge !== 0 && (
                    <span className="ml-2 px-1.5 py-0.5 bg-slate-800 text-[10px] text-slate-300 font-mono font-bold rounded-md border border-slate-700/60 shrink-0">
                      {item.badge}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </nav>
        </div>

        {/* Sidebar lower logout */}
        <div className="p-3.5 border-t border-slate-800">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center p-3 text-xs font-bold text-rose-400 hover:bg-rose-950/20 hover:text-rose-300 transition rounded-xl focus:outline-none"
          >
            <LogOut className="h-4.5 w-4.5 shrink-0" />
            {sidebarOpen && <span className="ml-3 font-semibold text-left">Đăng xuất hệ thống</span>}
          </button>
        </div>
      </aside>

      {/* 2. MAIN HUB SHELL */}
      <div className="flex-1 flex flex-col min-w-0 max-h-screen overflow-y-auto">
        
        {/* Upper global header */}
        <header className="bg-white border-b border-gray-100 p-4 shrink-0 flex items-center justify-between sticky top-0 z-20 shadow-4xs">
          <div className="flex items-center space-x-3 min-w-0">
            <h1 className="text-base font-bold text-gray-900 truncate">
              {selectedEnterpriseId ? "Chi tiết Hồ sơ Doanh nghiệp" : viewTitles[activeTab]}
            </h1>
            <span className="text-[10px] font-mono select-none px-2 py-0.5 bg-slate-100 text-slate-500 font-bold rounded-md">
              HUST • Edu-CRM v1.0
            </span>
          </div>

          <div className="flex items-center space-x-4 shrink-0">
            {/* Sync button */}
            <button 
              onClick={loadCrmData} 
              disabled={listLoading}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
              title="Cập nhật đồng bộ dữ liệu"
            >
              <RefreshCcw className={`h-4.5 w-4.5 ${listLoading ? "animate-spin text-blue-600" : ""}`} />
            </button>

            {/* Notification alert log */}
            <div className="relative group">
              <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition relative">
                <Bell className="h-4.5 w-4.5" />
                {activeNotis.length > 0 && (
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500 animate-ping"></span>
                )}
              </button>
              
              {/* Notifications Popover */}
              <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 invisible group-hover:visible group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transform translate-y-1 transition-all duration-200 z-50">
                <div className="flex items-center justify-between border-b border-gray-50 pb-2 mb-2">
                  <h4 className="text-xs font-bold text-gray-800">Cảnh báo & Nhắc nhở {activeNotis.length}</h4>
                  <span className="text-[9px] text-gray-400 font-mono">Đợt rà soát</span>
                </div>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {activeNotis.map(noti => (
                    <div onClick={() => handleMarkNotifRead(noti.id)} key={noti.id} className="p-2 hover:bg-slate-50 rounded-lg text-[11px] leading-relaxed cursor-pointer border-l-2 border-l-red-500">
                      <p className="font-bold text-gray-800">{noti.title}</p>
                      <p className="text-gray-500 mt-0.5">{noti.content}</p>
                    </div>
                  ))}
                  {activeNotis.length === 0 && (
                    <p className="text-[11px] text-gray-400 text-center py-4">Tất cả các rà soát MOU đều bình thường.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Quick status box */}
            <div className="flex items-center space-x-2 text-xs border-l border-gray-100 pl-3.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-mono font-medium text-gray-500 hidden sm:inline">{user.email}</span>
            </div>
          </div>
        </header>

        {/* Global Body Workspace wrapper */}
        <main className="p-6 md:p-8 flex-1">
          {selectedEnterpriseId ? (
            <EnterpriseDetails 
              token={token}
              enterpriseId={selectedEnterpriseId}
              onBack={() => {
                setSelectedEnterpriseId(null);
                loadCrmData();
              }}
              currentUser={user}
              usersList={usersList}
              departmentsList={departmentsList}
              onRefreshList={loadCrmData}
            />
          ) : (
            <>
              {/* TAB 1: EXECUTIVE ANALYTICAL REPORT STATS */}
              {activeTab === "dashboard" && (
                <CrmDashboard 
                  token={token}
                  onNavigateToEnterprise={(st) => {
                    setStatusFilter(st || "");
                    setActiveTab("enterprises");
                  }}
                  onNavigateToMous={() => setActiveTab("mous")}
                  onNavigateToTasks={() => setActiveTab("tasks")}
                />
              )}

              {/* TAB 2: ACTIVE ENTERPRISES CATALOG GRID */}
              {activeTab === "enterprises" && (
                <div className="space-y-6 animate-fade-in">
                  
                  {/* Filters Header toolbar */}
                  <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col md:flex-row gap-5 items-center justify-between">
                    <div className="flex-1 w-full relative">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input 
                        type="text"
                        placeholder="Tìm kiếm theo mã, tên doanh nghiệp, ngành nghề đào tạo..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full text-xs font-semibold bg-slate-50 border border-gray-100 rounded-xl p-3 pl-11 focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto overflow-x-auto justify-end">
                      <select 
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="text-xs font-semibold border border-gray-200 bg-white p-2.5 rounded-xl focus:outline-none"
                      >
                        <option value="">-- Trạng thái hợp tác --</option>
                        {Object.values(EnterpriseStatus).map(st => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>

                      <select 
                        value={priorityFilter}
                        onChange={e => setPriorityFilter(e.target.value)}
                        className="text-xs font-semibold border border-gray-200 bg-white p-2.5 rounded-xl focus:outline-none"
                      >
                        <option value="">-- Mức ưu tiên --</option>
                        {Object.values(EnterprisePriority).map(pr => (
                          <option key={pr} value={pr}>{pr}</option>
                        ))}
                      </select>

                      <button 
                        onClick={handleDownloadCSV}
                        className="p-2.5 px-4 bg-gray-100 hover:bg-gray-200 active:scale-95 border border-gray-200/50 rounded-xl text-xs font-bold text-gray-700 transition flex items-center shrink-0"
                      >
                        <Download className="h-4 w-4 mr-1.5" />
                        Xuất Excel
                      </button>

                      {/* CREATE NEW ENTERPRISES TRIGER */}
                      <button 
                        onClick={() => setEnterpriseModalOpen(true)}
                        className="p-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-2xs transition flex items-center shrink-0"
                        id="btn-create-enterprise"
                      >
                        <Plus className="h-4 w-4 mr-1.5" />
                        Tạo Doanh Nghiệp
                      </button>
                    </div>
                  </div>

                  {/* Directory lists block */}
                  <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left font-sans text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-wider select-none">
                            <th className="p-4 pl-6">Mã DN</th>
                            <th className="p-4">Doanh nghiệp / Lĩnh vực</th>
                            <th className="p-4">Trạng thái hợp tác</th>
                            <th className="p-4">Mức độ ưu tiên</th>
                            <th className="p-4">Cán bộ phụ trách</th>
                            <th className="p-4 pr-6 text-center">Xử lý</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {filteredEnterprises.map((ent) => (
                            <tr 
                              key={ent.id} 
                              className="hover:bg-slate-50/50 transition cursor-pointer"
                              onClick={() => setSelectedEnterpriseId(ent.id)}
                              id={`enterprise-row-${ent.code}`}
                            >
                              <td className="p-4 pl-6 font-mono font-extrabold text-blue-600">{ent.code}</td>
                              <td className="p-4">
                                <div className="max-w-xs sm:max-w-md">
                                  <p className="font-bold text-slate-800 hover:text-blue-600 truncate leading-normal text-sm">{ent.name}</p>
                                  <p className="text-[10px] text-gray-400 mt-1 truncate">{ent.field} • {ent.city}</p>
                                </div>
                              </td>
                              <td className="p-4">
                                <span className={`px-2.5 py-1 border rounded-md font-bold ${
                                  ent.status === EnterpriseStatus.DANG_TRIEN_KHAI ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                  ent.status === EnterpriseStatus.DA_KY_MOU ? "bg-blue-50 text-blue-700 border-blue-100" :
                                  ent.status === EnterpriseStatus.DANG_TRAO_DOI ? "bg-orange-50 text-orange-700 border-orange-100" :
                                  "bg-gray-150 text-gray-600"
                                }`}>
                                  {ent.status}
                                </span>
                              </td>
                              <td className="p-4">
                                <span className="font-bold font-mono text-gray-800">
                                  {ent.priority === EnterprisePriority.CHIEN_LUOC ? "⭐ Chiến lược" : ent.priority}
                                </span>
                              </td>
                              <td className="p-4">
                                <div className="flex items-center space-x-2">
                                  <div className="h-6 w-6 flex items-center justify-center rounded-full bg-slate-100 text-[10px] font-black text-gray-600 shrink-0">
                                    {ent.pic?.fullName.slice(-2) || "AN"}
                                  </div>
                                  <span className="font-medium text-slate-600 truncate">{ent.pic?.fullName || "N/A"}</span>
                                </div>
                              </td>
                              <td className="p-4 pr-6 text-center" onClick={(e) => e.stopPropagation()}>
                                <button 
                                  onClick={() => setSelectedEnterpriseId(ent.id)}
                                  className="text-blue-600 hover:text-blue-800 font-bold hover:underline focus:outline-none"
                                >
                                  Quản lý
                                </button>
                              </td>
                            </tr>
                          ))}

                          {filteredEnterprises.length === 0 && (
                            <tr>
                              <td colSpan={6} className="text-center py-16 text-gray-400 font-semibold font-sans">
                                <Building2 className="h-8 w-8 mx-auto opacity-30 mb-2" />
                                Không tìm thấy doanh nghiệp QHLK nào phù hợp bộ lọc trên.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: PIPELINE KANBAN VIEW */}
              {activeTab === "kanban" && (
                <PipelineKanban 
                  token={token}
                  enterprises={enterprises}
                  onUpdateEnterpriseStatus={handleUpdateEnterpriseStatus}
                  onViewEnterpriseDetails={(id) => setSelectedEnterpriseId(id)}
                />
              )}

              {/* TAB 4: AGREEMENT MOUS MANAGEMENT DATABASE */}
              {activeTab === "mous" && (
                <MouManagement 
                  token={token || ""}
                  mousList={mousList}
                  enterprises={enterprises}
                  departmentsList={departmentsList}
                  usersList={usersList}
                  onRefreshData={loadCrmData}
                />
              )}

              {/* TAB 5: STUDENT CAREERS AND INTERNSHIPS SELECTION */}
              {activeTab === "jobs" && (
                <div className="space-y-6 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {jobsList.map(job => (
                      <div key={job.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-3xs hover:shadow-2xs transition flex flex-col justify-between h-56 space-y-3">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded font-mono uppercase">
                              {job.type}
                            </span>
                            <span className="text-[11px] font-bold font-mono text-emerald-600">{job.salary}</span>
                          </div>
                          <h4 className="text-xs font-black text-slate-800 line-clamp-1 leading-normal">{job.title}</h4>
                          <p className="text-[10px] text-blue-600 font-bold truncate">🏢 {job.enterpriseName}</p>
                          <p className="text-xs text-gray-500 leading-normal line-clamp-2">{job.description}</p>
                        </div>
                        
                        <div className="pt-2 border-t border-gray-50 text-[10px] font-mono font-semibold text-gray-400 flex items-center justify-between mt-auto">
                          <span>📅 Hạn chót: {new Date(job.dateDeadline).toLocaleDateString("vi-VN")}</span>
                          <span className="font-sans text-gray-600 font-bold">{job.contactName || "HR Department"}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 6: EVENTS SECTION */}
              {activeTab === "events" && (
                <div className="space-y-6 animate-fade-in">
                  <div className="space-y-4">
                    {eventsList.map(ev => (
                      <div key={ev.id} className="bg-white p-5 rounded-2xl border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-3xs transition">
                        <div className="space-y-2 flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] bg-amber-100 text-amber-800 border border-amber-200 font-black px-2 py-0.5 rounded">
                              {ev.type}
                            </span>
                            <span className="text-xs text-gray-400 font-mono font-bold">
                              {new Date(ev.date).toLocaleDateString("vi-VN")}
                            </span>
                          </div>
                          <h4 className="text-sm font-black text-slate-800 truncate leading-normal">{ev.title}</h4>
                          <p className="text-xs text-gray-500 font-medium">📍 {ev.location} • Có khoảng {ev.joinCount} Sinh viên/Cán bộ đã đăng ký.</p>
                          <p className="text-xs text-blue-600 font-mono font-semibold">
                            🤝 Đồng hành cùng: {ev.enterpriseIds.join(", ")}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="inline-block px-4 py-1.5 font-bold font-mono text-xs text-gray-700 bg-slate-50 border border-gray-100 rounded-xl leading-none">
                            {ev.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 7: TASKS & ACTION LOGS */}
              {activeTab === "tasks" && (
                <div className="space-y-6 animate-fade-in">
                  <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-bold text-gray-900 flex items-center">
                        <CheckSquare className="h-5 w-5 mr-1.5 text-blue-600" />
                        Danh sách công việc & Giao việc nội bộ
                      </h2>
                      <p className="text-xs text-gray-400 mt-1">Lệt kê toàn bộ task cần follow up các cuộc tương tác.</p>
                    </div>

                    <button 
                      onClick={() => setTaskModalOpen(true)}
                      className="px-4 py-1.5 bg-blue-600 text-white hover:bg-blue-700 font-bold text-xs rounded-xl shadow-xs transition"
                    >
                      + Phân công việc mới
                    </button>
                  </div>

                  <div className="space-y-3">
                    {tasksList.map(task => (
                      <div 
                        key={task.id} 
                        className="bg-white p-4.5 rounded-2xl border border-gray-100 flex items-center justify-between gap-4 shadow-3xs"
                        id={`task-${task.id}`}
                      >
                        <div className="flex items-center space-x-3.5 flex-1 min-w-0">
                          <input 
                            type="checkbox" 
                            checked={task.status === TaskStatus.COMPLETED} 
                            onChange={() => handleToggleTaskStatus(task)}
                            className="h-4.5 w-4.5 border-gray-300 rounded text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
                          />
                          <div className="min-w-0">
                            <h4 className={`text-xs sm:text-sm font-bold text-slate-800 ${task.status === TaskStatus.COMPLETED ? "line-through text-gray-400" : ""}`}>
                              {task.title}
                            </h4>
                            <p className="text-[10px] text-gray-400 mt-0.5 font-semibold font-mono truncate leading-normal">
                              🎯 Doanh nghiệp: {task.enterpriseName} • 👥 Cán bộ: {task.assigneeName}
                            </p>
                            {task.description && <p className="text-xs text-gray-400 italic line-clamp-1 mt-1 font-medium">{task.description}</p>}
                          </div>
                        </div>

                        <div className="text-right shrink-0 flex flex-col items-end gap-1 font-mono text-[10px]">
                          <span className={`px-2 py-0.5 rounded font-black ${
                            task.priority === TaskPriority.HIGH ? "bg-red-50 text-red-600 border border-red-200" : "bg-gray-50 text-gray-600"
                          }`}>
                            {task.priority}
                          </span>
                          <span className="text-slate-400 font-bold mt-1">⏰ {new Date(task.dueDate).toLocaleDateString("vi-VN")}</span>
                        </div>
                      </div>
                    ))}
                    
                    {tasksList.length === 0 && (
                      <div className="py-12 border border-dashed border-gray-200 rounded-2xl text-center text-slate-400">
                        <CheckSquare className="h-8 w-8 mx-auto opacity-30 mb-2" />
                        <p className="text-xs font-semibold">Tất cả các công vụ đã hoàn thành.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 8: USERS & PERMISSIONS SYSTEM ROLES MAPPING */}
              {activeTab === "users" && (
                <UserManagement
                  token={token}
                  currentUserId={user.id}
                  canManage={(user.permissions || []).includes("manage_users")}
                  usersList={usersList}
                  departmentsList={departmentsList}
                  onChanged={loadCrmData}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* ==========================================
          MODALS & FORM DRAWERS
          ========================================== */}

      {/* Modal 1: Create Enterprise */}
      {enterpriseModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4 z-50 animate-fade-in whitespace-normal text-left">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-widest flex items-center">
                <Building2 className="mr-2 h-5 w-5 text-blue-600" />
                Khởi tạo hồ sơ doanh nghiệp mới
              </h3>
              <button onClick={() => setEnterpriseModalOpen(false)} className="text-gray-400 hover:text-gray-600 focus:outline-none">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEnterprise} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 block">Mã doanh nghiệp *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="E.g., DN-VIETTEL, DN-FPT"
                    value={newEntForm.code} 
                    onChange={e => setNewEntForm({ ...newEntForm, code: e.target.value })}
                    className="w-full text-xs font-bold p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 block">Tên pháp nhân đầy đủ *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="E.g., Tập đoàn Viễn thông Quân đội"
                    value={newEntForm.name} 
                    onChange={e => setNewEntForm({ ...newEntForm, name: e.target.value })}
                    className="w-full text-xs font-bold p-2.5 border border-gray-300 rounded-lg focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 block">Tên viết tắt / Tên thương mại</label>
                  <input 
                    type="text" 
                    placeholder="E.g., Viettel Group"
                    value={newEntForm.shortName} 
                    onChange={e => setNewEntForm({ ...newEntForm, shortName: e.target.value })}
                    className="w-full text-xs font-semibold p-2.5 border border-gray-300 rounded-lg focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 block">Mã số thuế</label>
                  <input 
                    type="text" 
                    placeholder="Mã số thuế 10 ký tự"
                    value={newEntForm.taxCode} 
                    onChange={e => setNewEntForm({ ...newEntForm, taxCode: e.target.value })}
                    className="w-full text-xs font-semibold p-2.5 border border-gray-300 rounded-lg focus:outline-none font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 block">Lĩnh vực chủ chốt *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="E.g., Công nghệ thông tin"
                    value={newEntForm.field} 
                    onChange={e => setNewEntForm({ ...newEntForm, field: e.target.value })}
                    className="w-full text-xs font-semibold p-2.5 border border-gray-300 rounded-lg focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 block">Tỉnh / Thành *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Hà Nội, TP.HCM, Đà Nẵng v.v."
                    value={newEntForm.city} 
                    onChange={e => setNewEntForm({ ...newEntForm, city: e.target.value })}
                    className="w-full text-xs font-semibold p-2.5 border border-gray-300 rounded-lg focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 block">Tiến độ hợp tác hiện trạng</label>
                  <select 
                    value={newEntForm.status} 
                    onChange={e => setNewEntForm({ ...newEntForm, status: e.target.value as any })}
                    className="w-full text-xs font-semibold p-2.5 border border-gray-300 bg-white rounded-lg focus:outline-none"
                  >
                    {Object.values(EnterpriseStatus).map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 block">Mức độ ưu tiên quan hệ</label>
                  <select 
                    value={newEntForm.priority} 
                    onChange={e => setNewEntForm({ ...newEntForm, priority: e.target.value as any })}
                    className="w-full text-xs font-semibold p-2.5 border border-gray-300 bg-white rounded-lg focus:outline-none"
                  >
                    {Object.values(EnterprisePriority).map(pr => (
                      <option key={pr} value={pr}>{pr}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 block">Liên kết phòng/khoa của trường ĐH</label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {departmentsList.filter(d => d.type === "KHOA" || d.type === "TRUNG_TAM").map(dept => {
                    const isSelected = newEntForm.facultyIds.includes(dept.id);
                    return (
                      <button 
                        type="button" 
                        key={dept.id}
                        onClick={() => {
                          const nextIds = isSelected 
                            ? newEntForm.facultyIds.filter((id: string) => id !== dept.id)
                            : [...newEntForm.facultyIds, dept.id];
                          setNewEntForm({ ...newEntForm, facultyIds: nextIds });
                        }}
                        className={`px-3 py-1 text-xs font-bold rounded-lg border transition ${isSelected ? "bg-blue-600 border-blue-500 text-white" : "border-gray-200 text-gray-500"}`}
                      >
                        {dept.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 block">Địa chỉ trụ sở chính</label>
                <input 
                  type="text" 
                  value={newEntForm.address} 
                  onChange={e => setNewEntForm({ ...newEntForm, address: e.target.value })}
                  className="w-full text-xs font-semibold p-2.5 border border-gray-300 rounded-lg focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 block">Website chính</label>
                  <input 
                    type="url" 
                    placeholder="https://"
                    value={newEntForm.website} 
                    onChange={e => setNewEntForm({ ...newEntForm, website: e.target.value })}
                    className="w-full text-xs font-semibold p-2.5 border border-gray-300 rounded-lg focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 block">Thẻ nhận biết (Tags) - Phân cách bằng dấu phẩy</label>
                  <input 
                    type="text" 
                    placeholder="E.g., CNTT, Sinh Viên Thực Tập, Tài Trợ"
                    value={newEntForm.tags} 
                    onChange={e => setNewEntForm({ ...newEntForm, tags: e.target.value })}
                    className="w-full text-xs font-semibold p-2.5 border border-gray-300 rounded-lg focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 block">Mô tả tóm lược thế mạnh Doanh nghiệp</label>
                <textarea 
                  value={newEntForm.description} 
                  onChange={e => setNewEntForm({ ...newEntForm, description: e.target.value })}
                  className="w-full text-xs font-semibold p-2.5 border border-gray-300 rounded-lg focus:outline-none h-16"
                />
              </div>

              <div className="p-4 bg-slate-50 border border-gray-100 rounded-xl space-y-1.5">
                      <button 
                  type="submit" 
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs focus:outline-none"
                >
                  Tạo mới và Đóng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Create MOU Agreement doc block */}
      {mouModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4 z-50 animate-fade-in text-left whitespace-normal">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-gray-100 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-widest flex items-center">
                <FileText className="h-5 w-5 text-blue-600 mr-1.5" />
                Thành văn thỏa thuận MOU/MOA mới
              </h3>
              <button onClick={() => setMouModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMou} className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                <div className="space-y-1">
                  <label className="text-gray-500 block">Số/Ký văn bản *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="12/2026/MOU-HUST-VIETTEL"
                    value={newMouForm.code} 
                    onChange={e => setNewMouForm({ ...newMouForm, code: e.target.value })}
                    className="w-full text-xs font-bold p-2 bg-white border border-gray-300 rounded-lg focus:outline-none font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-gray-500 block">Loại văn bản</label>
                  <select 
                    value={newMouForm.type} 
                    onChange={e => setNewMouForm({ ...newMouForm, type: e.target.value as any })}
                    className="w-full p-2 bg-white border border-gray-300 rounded-lg text-xs"
                  >
                    <option value={DocumentType.MOU}>MOU (Memorandum of Understanding)</option>
                    <option value={DocumentType.MOA}>MOA (Memorandum of Agreement)</option>
                    <option value={DocumentType.CONTRACT}>Hợp đồng thoả thuận khung</option>
                  </select>
                </div>

                <div className="space-y-1 col-span-2">
                  <label className="text-gray-500 block">Doanh nghiệp thực hiện ký *</label>
                  <select 
                    required 
                    value={newMouForm.enterpriseId} 
                    onChange={e => setNewMouForm({ ...newMouForm, enterpriseId: e.target.value })}
                    className="w-full p-2 bg-white border border-gray-300 rounded-lg text-xs"
                  >
                    <option value="">-- Bắt buộc chọn Doanh nghiệp --</option>
                    {enterprises.map(ent => (
                      <option key={ent.id} value={ent.id}>{ent.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-gray-500 block">Đầu mối Khoa tổ chức ký *</label>
                  <select 
                    required 
                    value={newMouForm.departmentId} 
                    onChange={e => setNewMouForm({ ...newMouForm, departmentId: e.target.value })}
                    className="w-full p-2 bg-white border border-gray-300 rounded-lg text-xs"
                  >
                    <option value="">-- Chọn Khoa phụ trách --</option>
                    {departmentsList.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-gray-500 block">Thời hạn hết hiệu lực *</label>
                  <input 
                    type="date" 
                    required 
                    value={newMouForm.expiryDate} 
                    onChange={e => setNewMouForm({ ...newMouForm, expiryDate: e.target.value })}
                    className="w-full p-2 bg-white border border-gray-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1 text-xs font-semibold">
                <label className="text-gray-500 block">Mô tả cam kết lõi trong MOU</label>
                <textarea 
                  value={newMouForm.content} 
                  onChange={e => setNewMouForm({ ...newMouForm, content: e.target.value })}
                  placeholder="E.g., FPT Software cam kết tuyển dụng 150 sinh viên/năm..."
                  className="w-full p-2 bg-white border border-gray-300 rounded-lg text-xs h-20"
                />
              </div>

              <div className="space-y-1 text-xs font-semibold">
                <label className="text-gray-500 block">File đính kèm (bản scan văn bản đã ký)</label>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
                  onChange={e => handleMouFileUpload(e.target.files?.[0] || null)}
                  disabled={mouUploading}
                  className="w-full p-2 bg-white border border-gray-300 rounded-lg text-xs"
                />
                {mouUploading && <p className="text-blue-600">Đang tải file lên...</p>}
                {newMouForm.fileUrl && !mouUploading && (
                  <p className="text-green-600 truncate">
                    Đã đính kèm: <a href={newMouForm.fileUrl} target="_blank" rel="noreferrer" className="underline">{newMouForm.fileUrl}</a>
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-gray-150 flex justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => setMouModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-600 font-bold text-xs rounded-xl"
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl"
                >
                  Xác nhận ký kết
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Dispatch manual follow-up task */}
      {taskModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4 z-50 animate-fade-in text-left whitespace-normal">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-100 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-widest flex items-center">
                <CheckSquare className="h-5 w-5 text-blue-600 mr-1.5" />
                Giao phó công việc liên quan hoạt động DN
              </h3>
              <button onClick={() => setTaskModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div className="space-y-1 text-xs font-semibold">
                <label className="text-gray-500 block">Tiêu đề công vụ *</label>
                <input 
                  type="text" 
                  required 
                  placeholder="E.g., Gửi thư mời hội thảo cho chị Thao HR"
                  value={newTaskForm.title} 
                  onChange={e => setNewTaskForm({ ...newTaskForm, title: e.target.value })}
                  className="w-full p-2 bg-white border border-gray-300 rounded-lg text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                <div className="space-y-1">
                  <label className="text-gray-500 block">Phân công cán bộ làm *</label>
                  <select 
                    required 
                    value={newTaskForm.assigneeId} 
                    onChange={e => setNewTaskForm({ ...newTaskForm, assigneeId: e.target.value })}
                    className="w-full p-2 bg-white border border-gray-300 rounded-lg text-xs"
                  >
                    <option value="">-- Chọn Chuyên viên --</option>
                    {usersList.map(u => (
                      <option key={u.id} value={u.id}>{u.fullName}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-gray-500 block">Thời hạn hoàn thành *</label>
                  <input 
                    type="date" 
                    required 
                    value={newTaskForm.dueDate} 
                    onChange={e => setNewTaskForm({ ...newTaskForm, dueDate: e.target.value })}
                    className="w-full p-2 bg-white border border-gray-300 rounded-lg text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-gray-500 block">Doanh nghiệp phối hợp</label>
                  <select 
                    value={newTaskForm.enterpriseId} 
                    onChange={e => setNewTaskForm({ ...newTaskForm, enterpriseId: e.target.value })}
                    className="w-full p-2 bg-white border border-gray-300 rounded-lg text-xs"
                  >
                    <option value="">Không bắt buộc</option>
                    {enterprises.map(e => (
                      <option key={e.id} value={e.id}>{e.shortName || e.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-gray-500 block">Chỉ định Mức ưu tiên</label>
                  <select 
                    value={newTaskForm.priority} 
                    onChange={e => setNewTaskForm({ ...newTaskForm, priority: e.target.value as any })}
                    className="w-full p-2 bg-white border border-gray-300 rounded-lg text-xs"
                  >
                    <option value={TaskPriority.LOW}>Thấp</option>
                    <option value={TaskPriority.MEDIUM}>Thường</option>
                    <option value={TaskPriority.HIGH}>🔥 Khẩn cấp</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1 text-xs font-semibold">
                <label className="text-gray-500 block">Yêu cầu giao phó chi tiết</label>
                <textarea 
                  value={newTaskForm.description} 
                  onChange={e => setNewTaskForm({ ...newTaskForm, description: e.target.value })}
                  placeholder="Nói rõ mục tiêu cuộc gọi, email mẫu hay các kết quả mong mỏi..."
                  className="w-full p-2 bg-white border border-gray-300 rounded-lg text-xs h-16"
                />
              </div>

              <div className="pt-3 border-t border-gray-150 flex justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => setTaskModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-600 font-bold text-xs rounded-xl"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl"
                >
                  Giao việc
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
