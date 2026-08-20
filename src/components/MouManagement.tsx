import React, { useState, useMemo } from "react";
import { PartnershipDocument, Enterprise, Department, User, DocumentType, DocumentStatus } from "../types/crm.ts";
import { 
  FileText, Search, Filter, Plus, Calendar, AlertTriangle, CheckCircle2, 
  Trash2, Edit2, Download, Eye, ExternalLink, HelpCircle, X, ChevronDown, ChevronUp, RefreshCw
} from "lucide-react";

interface MouManagementProps {
  token: string;
  mousList: PartnershipDocument[];
  enterprises: Enterprise[];
  departmentsList: Department[];
  usersList: User[];
  onRefreshData: () => void;
}

export default function MouManagement({ 
  token, 
  mousList, 
  enterprises, 
  departmentsList, 
  usersList, 
  onRefreshData 
}: MouManagementProps) {
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [deptFilter, setDeptFilter] = useState<string>("ALL");
  const [expiryStatusFilter, setExpiryStatusFilter] = useState<string>("ALL"); // 'ALL', 'ACTIVE', 'EXPIRING', 'EXPIRED'
  
  // Modal tracking states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formError, setFormError] = useState("");
  const [editingMou, setEditingMou] = useState<PartnershipDocument | null>(null);
  
  // Form input states
  const [formData, setFormData] = useState({
    code: "",
    type: DocumentType.MOU,
    enterpriseId: "",
    departmentId: "",
    signDate: new Date().toISOString().substring(0, 10),
    effectiveDate: new Date().toISOString().substring(0, 10),
    expiryDate: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().substring(0, 10),
    picId: "",
    content: "",
    status: DocumentStatus.DA_KY,
    fileUrl: ""
  });

  // Expand row status
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  // Stats calculation
  const stats = useMemo(() => {
    const now = new Date().getTime();
    const ninetyDays = 90 * 24 * 3600 * 1000;

    let activeCount = 0;
    let expiringCount = 0;
    let expiredCount = 0;

    mousList.forEach(mou => {
      const expiry = new Date(mou.expiryDate).getTime();
      const remaining = expiry - now;

      if (mou.status === DocumentStatus.HET_HAN || remaining <= 0) {
        expiredCount++;
      } else if (mou.status === DocumentStatus.DA_KY && remaining > 0 && remaining <= ninetyDays) {
        expiringCount++;
      } else if (mou.status === DocumentStatus.DA_KY && remaining > ninetyDays) {
        activeCount++;
      }
    });

    return {
      total: mousList.length,
      active: activeCount,
      expiring: expiringCount,
      expired: expiredCount
    };
  }, [mousList]);

  // Filtered MOUs computation
  const filteredMous = useMemo(() => {
    const now = new Date().getTime();
    const ninetyDays = 90 * 24 * 3600 * 1000;

    return mousList.filter(mou => {
      // Search matching
      const enterpriseName = mou.enterpriseName || enterprises.find(e => e.id === mou.enterpriseId)?.name || "";
      const searchStr = `${mou.code} ${enterpriseName} ${mou.content}`.toLowerCase();
      const matchesSearch = searchStr.includes(searchTerm.toLowerCase());

      // Type filter
      const matchesType = typeFilter === "ALL" || mou.type === typeFilter;

      // Status filter
      const matchesStatus = statusFilter === "ALL" || mou.status === statusFilter;

      // Department filter
      const matchesDept = deptFilter === "ALL" || mou.departmentId === deptFilter;

      // Expiry status filter matches
      const expiry = new Date(mou.expiryDate).getTime();
      const remaining = expiry - now;
      let matchesExpiryStatus = true;
      if (expiryStatusFilter === "ACTIVE") {
        matchesExpiryStatus = mou.status === DocumentStatus.DA_KY && remaining > ninetyDays;
      } else if (expiryStatusFilter === "EXPIRING") {
        matchesExpiryStatus = mou.status === DocumentStatus.DA_KY && remaining > 0 && remaining <= ninetyDays;
      } else if (expiryStatusFilter === "EXPIRED") {
        matchesExpiryStatus = mou.status === DocumentStatus.HET_HAN || remaining <= 0;
      }

      return matchesSearch && matchesType && matchesStatus && matchesDept && matchesExpiryStatus;
    });
  }, [mousList, enterprises, searchTerm, typeFilter, statusFilter, deptFilter, expiryStatusFilter]);

  // Handle row click expander
  const toggleRow = (id: string) => {
    setExpandedRowId(expandedRowId === id ? null : id);
  };

  // Open creation Modal
  const openCreateModal = () => {
    setEditingMou(null);
    setFormError("");
    setFormData({
      code: `MOU-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      type: DocumentType.MOU,
      enterpriseId: enterprises[0]?.id || "",
      departmentId: departmentsList[0]?.id || "",
      signDate: new Date().toISOString().substring(0, 10),
      effectiveDate: new Date().toISOString().substring(0, 10),
      expiryDate: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().substring(0, 10),
      picId: usersList[0]?.id || "",
      content: "",
      status: DocumentStatus.DA_KY,
      fileUrl: ""
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (mou: PartnershipDocument, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingMou(mou);
    setFormError("");
    setFormData({
      code: mou.code,
      type: mou.type,
      enterpriseId: mou.enterpriseId,
      departmentId: mou.departmentId,
      signDate: new Date(mou.signDate).toISOString().substring(0, 10),
      effectiveDate: new Date(mou.effectiveDate).toISOString().substring(0, 10),
      expiryDate: new Date(mou.expiryDate).toISOString().substring(0, 10),
      picId: mou.picId || "",
      content: mou.content || "",
      status: mou.status,
      fileUrl: mou.fileUrl || ""
    });
    setIsModalOpen(true);
  };

  // Delete handler
  const handleDelete = async (id: string, code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Bạn có chắc chắn muốn xóa Văn bản thỏa thuận MOU: ${code}? Thao tác này không thể hoàn tác.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/mous/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Không thể xóa văn bản hợp tác.");
      }

      onRefreshData();
    } catch (err: any) {
      alert("Lỗi: " + err.message);
    }
  };

  // Submit action (POST / PUT)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    // Validate date sequence
    const tSign = new Date(formData.signDate).getTime();
    const tEff = new Date(formData.effectiveDate).getTime();
    const tExp = new Date(formData.expiryDate).getTime();

    if (tSign > tEff) {
      setFormError("Ngày ký kết không thể diễn ra sau ngày bắt đầu hiệu lực.");
      return;
    }
    if (tEff > tExp) {
      setFormError("Ngày hết hiệu lực phải sau ngày bắt đầu hiệu lực.");
      return;
    }
    if (!formData.enterpriseId) {
      setFormError("Vui lòng chọn Doanh nghiệp liên kết.");
      return;
    }
    if (!formData.departmentId) {
      setFormError("Vui lòng chọn Khoa/Đơn vị phụ trách.");
      return;
    }

    try {
      const url = editingMou ? `/api/mous/${editingMou.id}` : "/api/mous";
      const method = editingMou ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Có lỗi xảy ra khi cập nhật văn bản.");
      }

      setIsModalOpen(false);
      onRefreshData();
    } catch (err: any) {
      setFormError(err.message);
    }
  };

  // Clear filters
  const resetFilters = () => {
    setSearchTerm("");
    setTypeFilter("ALL");
    setStatusFilter("ALL");
    setDeptFilter("ALL");
    setExpiryStatusFilter("ALL");
  };

  // Helper remaining days view
  const getExpiryLabel = (expiryDateStr: string, status: DocumentStatus) => {
    const expiry = new Date(expiryDateStr).getTime();
    const now = new Date().getTime();
    const remainingDays = Math.ceil((expiry - now) / (1000 * 3600 * 24));

    if (status === DocumentStatus.HET_HAN || remainingDays <= 0) {
      return (
        <span className="inline-flex items-center text-[10px] bg-red-50 text-red-700 font-bold border border-red-100 px-2 py-0.5 rounded-full font-sans">
          Đã hết hạn
        </span>
      );
    }

    if (remainingDays <= 90) {
      return (
        <span className="inline-flex items-center text-[10px] bg-amber-50 text-amber-700 font-bold border border-amber-200 px-2 py-0.5 rounded-full font-sans animate-pulse">
          ⚠️ Hạn còn {remainingDays} ngày
        </span>
      );
    }

    return (
      <span className="inline-flex items-center text-[10px] bg-emerald-50 text-emerald-700 font-bold border border-emerald-100 px-2 py-0.5 rounded-full font-sans">
        Còn {remainingDays} ngày
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in" id="mou-mgmt-section-block">
      {/* Top statistics section */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total */}
        <div 
          onClick={() => setExpiryStatusFilter("ALL")}
          className={`bg-white p-4.5 rounded-2xl border transition shadow-3xs cursor-pointer ${
            expiryStatusFilter === "ALL" ? "border-blue-600 ring-1 ring-blue-100 bg-blue-50/10" : "border-gray-100 hover:border-gray-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 font-bold">Tổng văn bản</span>
            <div className="p-2 bg-slate-100 text-slate-600 rounded-xl">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-xl font-black text-slate-800">{stats.total}</span>
            <span className="text-[10px] text-gray-400 font-semibold">bản ký</span>
          </div>
        </div>

        {/* Card 2: Active */}
        <div 
          onClick={() => setExpiryStatusFilter("ACTIVE")}
          className={`bg-white p-4.5 rounded-2xl border transition shadow-3xs cursor-pointer ${
            expiryStatusFilter === "ACTIVE" ? "border-blue-600 ring-1 ring-blue-100 bg-blue-50/10" : "border-gray-100 hover:border-gray-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 font-bold">Đang hiệu lực</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-xl font-black text-blue-600">{stats.active}</span>
            <span className="text-[10px] text-gray-400 font-semibold">đang chạy</span>
          </div>
        </div>

        {/* Card 3: Expiring */}
        <div 
          onClick={() => setExpiryStatusFilter("EXPIRING")}
          className={`bg-white p-4.5 rounded-2xl border transition shadow-3xs cursor-pointer ${
            expiryStatusFilter === "EXPIRING" ? "border-amber-500 ring-1 ring-amber-100 bg-amber-50/10" : "border-gray-100 hover:border-gray-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 font-bold">Sắp hết hạn (&lt;90d)</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <AlertTriangle className="h-4 w-4 animate-bounce" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-xl font-black text-amber-600">{stats.expiring}</span>
            <span className="text-[10px] text-gray-400 font-semibold font-mono font-black">cần gia hạn</span>
          </div>
        </div>

        {/* Card 4: Expired */}
        <div 
          onClick={() => setExpiryStatusFilter("EXPIRED")}
          className={`bg-white p-4.5 rounded-2xl border transition shadow-3xs cursor-pointer ${
            expiryStatusFilter === "EXPIRED" ? "border-red-500 ring-1 ring-red-100 bg-red-50/10" : "border-gray-100 hover:border-gray-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 font-bold">Hết hạn hiệu lực</span>
            <div className="p-2 bg-red-50 text-red-600 rounded-xl">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-xl font-black text-red-600">{stats.expired}</span>
            <span className="text-[10px] text-gray-400 font-semibold">lưu lịch sử</span>
          </div>
        </div>
      </div>

      {/* Main filter & controls bar */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-extrabold text-gray-900 flex items-center">
              <FileText className="h-4 w-4 mr-1.5 text-blue-600" />
              Sổ tay & Cổng Quản lý Thoả thuận Hợp tác (MOU/MOA Database)
            </h3>
            <p className="text-[11px] text-gray-400">
              Quản lý toàn bộ hồ sơ thỏa thuận khung, đối chiếu nghĩa vụ cam kết và tự động cảnh báo ngày tái ký.
            </p>
          </div>

          <button 
            onClick={openCreateModal}
            className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition focus:outline-none shrink-0"
          >
            <Plus className="h-4 w-4 mr-1" />
            Đăng ký Thỏa thuận mới
          </button>
        </div>

        {/* Extended filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50/60 p-3.5 rounded-xl border border-gray-100">
          {/* Keyword Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Tìm mã MOU, Tên doanh nghiệp..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 w-full bg-white border border-gray-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
            />
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="py-1.5 px-2.5 w-full bg-white border border-gray-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700"
            >
              <option value="ALL">-- Tất cả loại văn bản --</option>
              <option value={DocumentType.MOU}>MOU (Ghi nhớ hợp tác)</option>
              <option value={DocumentType.MOA}>MOA (Thỏa thuận cụ thể)</option>
              <option value={DocumentType.CONTRACT}>Hợp đồng khung</option>
              <option value={DocumentType.OTHER}>Khác</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="py-1.5 px-2.5 w-full bg-white border border-gray-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700"
            >
              <option value="ALL">-- Tất cả trạng thái ký --</option>
              <option value={DocumentStatus.DA_KY}>Đã ký / Đang có hiệu lực</option>
              <option value={DocumentStatus.SOAN_THAO}>Đang soạn thảo</option>
              <option value={DocumentStatus.TRINH_KY}>Đang trình ký</option>
              <option value={DocumentStatus.HET_HAN}>Hết hạn</option>
              <option value={DocumentStatus.THANH_LY}>Đã thanh lý</option>
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <select
              value={deptFilter}
              onChange={e => setDeptFilter(e.target.value)}
              className="py-1.5 px-2.5 w-full bg-white border border-gray-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700"
            >
              <option value="ALL">-- Khối khoa phụ trách --</option>
              {departmentsList.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Clear Filter Indicator */}
        {(searchTerm || typeFilter !== "ALL" || statusFilter !== "ALL" || deptFilter !== "ALL" || expiryStatusFilter !== "ALL") && (
          <div className="flex items-center justify-between text-xs font-semibold bg-blue-50/50 p-2 px-3 rounded-lg border border-blue-100 text-blue-700">
            <span>
              Đang áp dụng bộ lọc: Tìm thấy <strong>{filteredMous.length}</strong> kết quả phù hợp.
            </span>
            <button 
              onClick={resetFilters}
              className="inline-flex items-center text-blue-800 hover:underline font-bold"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Reset bộ lọc
            </button>
          </div>
        )}
      </div>

      {/* Database Listing section */}
      {filteredMous.length === 0 ? (
        <div className="bg-white p-12 text-center border border-gray-100 rounded-2xl shadow-xs space-y-4">
          <div className="h-10 w-10 mx-auto bg-slate-100 rounded-full flex items-center justify-center text-gray-400">
            <FileText className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-gray-700">Không tìm thấy thỏa thuận ký kết hợp tác nào</p>
            <p className="text-xs text-gray-400">Vui lòng thay đổi từ khóa tìm kiếm hoặc điều chỉnh điều kiện bộ lọc của bạn.</p>
          </div>
          <button 
            onClick={resetFilters}
            className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-xs rounded-xl"
          >
            Hiển thị toàn bộ
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">
                  <th className="p-4 w-12 text-center"></th>
                  <th className="p-4">Số / Mã văn bản</th>
                  <th className="p-4">Đối tác doanh nghiệp</th>
                  <th className="p-4">Khoa/Đơn vị phụ trách</th>
                  <th className="p-4">Hạn hết hiệu lực</th>
                  <th className="p-4 text-center">Tình trạng</th>
                  <th className="p-4 text-center w-28">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-xs font-semibold text-slate-700">
                {filteredMous.map((mou) => {
                  const enterprise = enterprises.find(e => e.id === mou.enterpriseId);
                  const isExpanded = expandedRowId === mou.id;

                  return (
                    <React.Fragment key={mou.id}>
                      <tr 
                        onClick={() => toggleRow(mou.id)}
                        className={`hover:bg-slate-50/50 cursor-pointer transition ${isExpanded ? "bg-slate-50/20" : ""}`}
                      >
                        <td className="p-4 text-center">
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 mx-auto text-gray-400" />
                          ) : (
                            <ChevronDown className="h-4 w-4 mx-auto text-gray-400" />
                          )}
                        </td>
                        <td className="p-4 font-mono font-black text-blue-700">
                          <span className="px-2 py-1 bg-blue-50 border border-blue-100 rounded">
                            {mou.code}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="font-bold text-slate-800 text-[13px]">{mou.enterpriseName || enterprise?.name || "DN chưa đặt tên"}</div>
                          <div className="text-[10px] text-gray-400 mt-0.5">{enterprise?.field || "Hợp tác tổng thể"}</div>
                        </td>
                        <td className="p-4 text-gray-500 font-medium">
                          🏢 {mou.departmentName || departmentsList.find(d => d.id === mou.departmentId)?.name || "Chuyên ban"}
                        </td>
                        <td className="p-4 font-mono font-black">
                          <div>{new Date(mou.expiryDate).toLocaleDateString("vi-VN")}</div>
                          <div className="mt-1">{getExpiryLabel(mou.expiryDate, mou.status)}</div>
                        </td>
                        <td className="p-4 text-center">
                          <span className={`text-[10px] font-mono tracking-widest font-black uppercase px-2 py-1 rounded-md border ${
                            mou.status === DocumentStatus.DA_KY ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                            mou.status === DocumentStatus.HET_HAN ? "bg-red-50 text-red-700 border-red-100" :
                            mou.status === DocumentStatus.SOAN_THAO ? "bg-gray-100 text-gray-700 border-gray-200" :
                            "bg-amber-50 text-amber-700 border-amber-200"
                          }`}>
                            {mou.status}
                          </span>
                        </td>
                        <td className="p-4" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1.5">
                            <button 
                              onClick={(e) => openEditModal(mou, e)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="Sửa văn bản"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={(e) => handleDelete(mou.id, mou.code, e)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Xóa văn bản"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Detail Drawdown card spacing */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={7} className="p-5 bg-slate-50/50 border-t border-b border-gray-100">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-600 font-medium">
                              <div className="space-y-3">
                                <h4 className="font-bold text-slate-800 uppercase text-[10px] tracking-wider font-mono text-blue-600">
                                  Nội dung cam kết cốt lõi hợp tác:
                                </h4>
                                <div className="p-3 bg-white border border-gray-100 rounded-xl italic leading-relaxed text-gray-600 shadow-3xs whitespace-pre-wrap">
                                  {mou.content || "Chưa cập nhật chi tiết điều khoản hợp tác."}
                                </div>
                              </div>

                              <div className="space-y-3">
                                <h4 className="font-bold text-slate-800 uppercase text-[10px] tracking-wider font-mono text-blue-600">
                                  Chi tiết kỹ thuật & Quản lý:
                                </h4>
                                <div className="bg-white border border-gray-100 rounded-xl p-3 shadow-3xs space-y-2">
                                  <div className="flex justify-between border-b border-slate-50 pb-1.5">
                                    <span className="text-gray-400">Loại văn bản:</span>
                                    <span className="font-bold font-mono text-slate-800 uppercase">{mou.type}</span>
                                  </div>
                                  <div className="flex justify-between border-b border-slate-50 pb-1.5">
                                    <span className="text-gray-400">Ngày ký thỏa thuận:</span>
                                    <span className="font-mono text-slate-800">{new Date(mou.signDate).toLocaleDateString("vi-VN")}</span>
                                  </div>
                                  <div className="flex justify-between border-b border-slate-50 pb-1.5">
                                    <span className="text-gray-400">Ngày có hiệu lực:</span>
                                    <span className="font-mono text-slate-800">{new Date(mou.effectiveDate).toLocaleDateString("vi-VN")}</span>
                                  </div>
                                  <div className="flex justify-between border-b border-slate-50 pb-1.5">
                                    <span className="text-gray-400">Cán bộ QHDN kết nối (PIC):</span>
                                    <span className="font-bold text-slate-800">
                                      👤 {mou.picName || usersList.find(u => u.id === mou.picId)?.fullName || "Admin CRM"}
                                    </span>
                                  </div>
                                  {mou.fileUrl && (
                                    <div className="flex justify-between pt-1">
                                      <span className="text-gray-400">Tài liệu ký:</span>
                                      <a 
                                        href={mou.fileUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline inline-flex items-center font-bold font-mono text-[11px]"
                                      >
                                        <Download className="h-3 w-3 mr-1" />
                                        Tải bản Scan đã đóng dấu (PDF)
                                      </a>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Grid Layout */}
          <div className="block md:hidden divide-y divide-gray-100">
            {filteredMous.map((mou) => {
              const enterprise = enterprises.find(e => e.id === mou.enterpriseId);
              const isExpanded = expandedRowId === mou.id;

              return (
                <div key={mou.id} className="p-4 space-y-3 cursor-pointer hover:bg-slate-50/50" onClick={() => toggleRow(mou.id)}>
                  <div className="flex items-start justify-between gap-1">
                    <span className="text-[11px] font-mono font-black text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded">
                      {mou.code}
                    </span>
                    <span className={`text-[9px] font-mono font-black uppercase px-1.5 py-0.5 rounded border ${
                      mou.status === DocumentStatus.DA_KY ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-red-50 text-red-700 border-red-100"
                    }`}>
                      {mou.status}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-800">{mou.enterpriseName || enterprise?.name || "Doanh nghiệp"}</h4>
                    <p className="text-[11px] text-gray-500 mt-1">🏢 Phụ trách: {mou.departmentName || departmentsList.find(d => d.id === mou.departmentId)?.name || "Khoa"}</p>
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono font-semibold pt-2 border-t border-gray-50 text-gray-400">
                    <div>📅 Hạn: {new Date(mou.expiryDate).toLocaleDateString("vi-VN")}</div>
                    <div>{getExpiryLabel(mou.expiryDate, mou.status)}</div>
                  </div>

                  {isExpanded && (
                    <div className="mt-3 bg-slate-50 p-3 rounded-xl border border-gray-150 text-xs text-slate-600 space-y-3 leading-relaxed" onClick={e => e.stopPropagation()}>
                      <p className="italic">
                        <strong>Nội dung:</strong> {mou.content || "Chưa cập nhật chi tiết cam kết cốt lõi."}
                      </p>
                      <div className="pt-2 border-t border-gray-200/50 space-y-1 bg-white p-2 rounded-lg text-[11px] font-sans">
                        <div>⏱️ <strong>Ký ngày:</strong> {new Date(mou.signDate).toLocaleDateString("vi-VN")}</div>
                        <div>👤 <strong>Cán bộ (PIC):</strong> {mou.picName || usersList.find(u => u.id === mou.picId)?.fullName}</div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button 
                          onClick={(e) => openEditModal(mou, e)}
                          className="px-2 py-1 bg-white text-gray-700 font-bold border border-gray-200 rounded-lg text-[10px]"
                        >
                          Chỉnh sửa
                        </button>
                        <button 
                          onClick={(e) => handleDelete(mou.id, mou.code, e)}
                          className="px-2 py-1 bg-red-50 text-red-600 font-bold border border-red-100 rounded-lg text-[10px]"
                        >
                          Xóa bỏ
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Creation and Edit Popup Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4 z-50 animate-fade-in text-left whitespace-normal">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-gray-100 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-widest flex items-center">
                <FileText className="h-5 w-5 text-blue-600 mr-1.5 animate-pulse" />
                {editingMou ? `Cập lý Biên bản thỏa thuận: ${editingMou.code}` : "Lập bản ghi nhớ hợp tác MOU/MOA mới"}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-700 font-bold text-xs rounded-xl flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                {/* Document Code */}
                <div className="space-y-1">
                  <label className="text-gray-500 block">Số/Ký hiệu văn bản *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="E.g., 12/2026/MOU-HUST-VIETTEL"
                    value={formData.code} 
                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                    className="w-full text-xs font-bold p-2 bg-white border border-gray-300 rounded-lg focus:outline-none font-mono focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Document Type */}
                <div className="space-y-1">
                  <label className="text-gray-500 block">Loại hình liên kết</label>
                  <select 
                    value={formData.type} 
                    onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full p-2 bg-white border border-gray-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value={DocumentType.MOU}>MOU (Memorandum of Understanding)</option>
                    <option value={DocumentType.MOA}>MOA (Memorandum of Agreement)</option>
                    <option value={DocumentType.CONTRACT}>Hợp đồng khung / Hợp đồng Nguyên tắc</option>
                    <option value={DocumentType.OTHER}>Tài liệu Biên bản thỏa thuận khác</option>
                  </select>
                </div>

                {/* Enterprise Name Select */}
                <div className="space-y-1 col-span-2">
                  <label className="text-gray-500 block">Doanh nghiệp thực hiện đối tác ký *</label>
                  <select 
                    required 
                    value={formData.enterpriseId} 
                    onChange={e => setFormData({ ...formData, enterpriseId: e.target.value })}
                    className="w-full p-2 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">-- Click để chọn Doanh nghiệp liên đới --</option>
                    {enterprises.map(ent => (
                      <option key={ent.id} value={ent.id}>{ent.name}</option>
                    ))}
                  </select>
                </div>

                {/* Internal Department Select */}
                <div className="space-y-1">
                  <label className="text-gray-500 block">Đầu mối Khoa tổ chức phụ trách *</label>
                  <select 
                    required 
                    value={formData.departmentId} 
                    onChange={e => setFormData({ ...formData, departmentId: e.target.value })}
                    className="w-full p-2 bg-white border border-gray-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
                  >
                    <option value="">-- Chọn Khoa điều phối chính --</option>
                    {departmentsList.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>

                {/* Responsible User (PIC) */}
                <div className="space-y-1">
                  <label className="text-gray-500 block">Cán bộ thụ lý phụ trách (PIC)</label>
                  <select 
                    required
                    value={formData.picId} 
                    onChange={e => setFormData({ ...formData, picId: e.target.value })}
                    className="w-full p-2 bg-white border border-gray-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
                  >
                    <option value="">-- Chọn cán bộ chuyên trách --</option>
                    {usersList.map(user => (
                      <option key={user.id} value={user.id}>{user.fullName} ({user.email})</option>
                    ))}
                  </select>
                </div>

                {/* Document Status */}
                <div className="space-y-1">
                  <label className="text-gray-500 block">Trạng thái ký kết</label>
                  <select 
                    value={formData.status} 
                    onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full p-2 bg-white border border-gray-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value={DocumentStatus.DA_KY}>Đã ký / Đang có hiệu lực chính thức</option>
                    <option value={DocumentStatus.SOAN_THAO}>Đang dự thảo / Trao đổi nội bộ</option>
                    <option value={DocumentStatus.TRINH_KY}>Đang trình ký (Sếp duyệt)</option>
                    <option value={DocumentStatus.HET_HAN}>Hết hạn hiệu lực</option>
                    <option value={DocumentStatus.THANH_LY}>Đã làm thủ tục thanh lý</option>
                  </select>
                </div>

                {/* Expiry Date */}
                <div className="space-y-1">
                  <label className="text-gray-500 block">Thời hạn hết hiệu lực *</label>
                  <input 
                    type="date" 
                    required 
                    value={formData.expiryDate} 
                    onChange={e => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="w-full p-2 bg-white border border-gray-300 rounded-lg text-xs font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                </div>

                {/* Sign Date */}
                <div className="space-y-1">
                  <label className="text-gray-500 block">Ngày ký thỏa thuận</label>
                  <input 
                    type="date" 
                    required 
                    value={formData.signDate} 
                    onChange={e => setFormData({ ...formData, signDate: e.target.value })}
                    className="w-full p-2 bg-white border border-gray-300 rounded-lg text-xs font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                </div>

                {/* Effective Date */}
                <div className="space-y-1">
                  <label className="text-gray-500 block">Ngày có hiệu lực</label>
                  <input 
                    type="date" 
                    required 
                    value={formData.effectiveDate} 
                    onChange={e => setFormData({ ...formData, effectiveDate: e.target.value })}
                    className="w-full p-2 bg-white border border-gray-300 rounded-lg text-xs font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              {/* Core Commitments notes */}
              <div className="space-y-1 text-xs font-semibold">
                <label className="text-gray-500 block">Cam kết và giá trị cốt lõi (Mô tả chi tiết)</label>
                <textarea 
                  value={formData.content} 
                  required
                  onChange={e => setFormData({ ...formData, content: e.target.value })}
                  placeholder="E.g., Tiếp nhận 150 sinh viên thực tập/năm; phối hợp nghiên cứu phát triển các kit công nghệ IoT trong các phân khoa; trao 10 suất học bổng doanh nghiệp."
                  className="w-full p-3 bg-white border border-gray-300 rounded-lg text-xs h-24 focus:outline-none focus:ring-1 focus:ring-blue-500 leading-normal font-medium"
                />
              </div>

              {/* Scanned upload link mock input */}
              <div className="space-y-1 text-xs font-semibold">
                <label className="text-gray-500 block flex items-center">
                  Đường dẫn tệp tài liệu số đã ký (Scan PDF)
                  <HelpCircle className="h-3.5 w-3.5 ml-1 text-gray-400" title="Đường dẫn lưu trữ tệp tin đã scan lưu trữ đám mây của nhà trường" />
                </label>
                <input 
                  type="text" 
                  placeholder="/files/mou_signed_scan_latest.pdf"
                  value={formData.fileUrl} 
                  onChange={e => setFormData({ ...formData, fileUrl: e.target.value })}
                  className="w-full p-2 bg-white border border-gray-300 rounded-lg text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-gray-150 flex justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-xs rounded-xl active:scale-95 transition"
                >
                  Đóng lại
                </button>
                <button 
                  type="submit" 
                  className="px-4.5 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition"
                >
                  {editingMou ? "Cập nhật Thỏa thuận" : "Xác nhận Lập thỏa thuận"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
