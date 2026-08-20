// ==========================================
// QUẢN LÝ NHU CẦU VIỆC LÀM / THỰC TẬP (Jobs)
// ==========================================
// Trước đây tab này chỉ hiển thị danh sách (read-only) dù backend đã có đủ
// POST/PUT/DELETE /api/jobs. Component này bổ sung: tìm kiếm, lọc theo loại hình
// và trạng thái, tạo/sửa/xóa tin, hiển thị đầy đủ số lượng - địa điểm - ngành.
// Mọi nhãn enum lấy từ lib/crmLabels để không lộ chuỗi kỹ thuật ra giao diện.

import React, { useMemo, useState } from "react";
import { Job, Enterprise, JobType, JobStatus } from "../types/crm.ts";
import { api } from "../lib/api.ts";
import {
  JOB_TYPE_LABELS,
  JOB_STATUS_LABELS,
  JOB_STATUS_COLORS,
  labelOf,
  formatDateVi,
} from "../lib/crmLabels.ts";
import {
  Briefcase, Plus, X, Edit2, Trash2, Search, MapPin, Users, GraduationCap, Clock,
} from "lucide-react";

interface Props {
  token: string;
  canManage: boolean;
  jobsList: Job[];
  enterprises: Enterprise[];
  onChanged: () => void;
}

const EMPTY_FORM = {
  enterpriseId: "",
  title: "",
  type: JobType.INTERN as JobType,
  quantity: 1,
  description: "",
  requirements: "",
  majors: "",
  location: "",
  salary: "",
  dateDeadline: "",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  status: JobStatus.NEW as JobStatus,
};

// Cắt phần giờ khỏi ISO date để đưa vào <input type="date">.
const toDateInput = (value?: string | null): string =>
  value ? String(value).substring(0, 10) : "";

export default function JobManagement({
  token,
  canManage,
  jobsList,
  enterprises,
  onChanged,
}: Props) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return jobsList.filter((j) => {
      const matchKeyword =
        !keyword ||
        j.title.toLowerCase().includes(keyword) ||
        (j.enterpriseName || "").toLowerCase().includes(keyword) ||
        (j.majors || "").toLowerCase().includes(keyword);
      const matchType = !typeFilter || j.type === typeFilter;
      const matchStatus = !statusFilter || j.status === statusFilter;
      return matchKeyword && matchType && matchStatus;
    });
  }, [jobsList, search, typeFilter, statusFilter]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, enterpriseId: enterprises[0]?.id || "" });
    setError("");
    setModalOpen(true);
  };

  const openEdit = (job: Job) => {
    setEditingId(job.id);
    setForm({
      enterpriseId: job.enterpriseId,
      title: job.title,
      type: job.type,
      quantity: job.quantity,
      description: job.description || "",
      requirements: job.requirements || "",
      majors: job.majors || "",
      location: job.location || "",
      salary: job.salary || "",
      dateDeadline: toDateInput(job.dateDeadline),
      contactName: job.contactName || "",
      contactEmail: job.contactEmail || "",
      contactPhone: job.contactPhone || "",
      status: job.status,
    });
    setError("");
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        enterpriseId: form.enterpriseId,
        title: form.title,
        type: form.type,
        quantity: Number(form.quantity) || 1,
        description: form.description || null,
        requirements: form.requirements || null,
        majors: form.majors,
        location: form.location || null,
        salary: form.salary || null,
        dateDeadline: form.dateDeadline,
        contactName: form.contactName || null,
        contactEmail: form.contactEmail || null,
        contactPhone: form.contactPhone || null,
        status: form.status,
      };
      if (editingId) {
        await api.put(`/api/jobs/${editingId}`, payload, token);
      } else {
        await api.post("/api/jobs", payload, token);
      }
      setModalOpen(false);
      onChanged();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (job: Job) => {
    if (!window.confirm(`Xóa tin tuyển dụng "${job.title}"?`)) return;
    try {
      await api.del(`/api/jobs/${job.id}`, token);
      onChanged();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Thanh công cụ: tìm kiếm + lọc + tạo mới */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center">
              <Briefcase className="h-5 w-5 mr-1.5 text-blue-600" />
              Cơ hội Việc làm &amp; Thực tập
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Tiếp nhận và theo dõi nhu cầu tuyển dụng, thực tập từ doanh nghiệp đối tác.
            </p>
          </div>
          {canManage && (
            <button
              onClick={openCreate}
              className="px-3 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl flex items-center gap-1 shrink-0"
            >
              <Plus className="h-4 w-4" /> Đăng tin tuyển dụng
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tiêu đề, doanh nghiệp, ngành đào tạo..."
              className="w-full pl-9 pr-3 py-2.5 text-xs font-semibold border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full p-2.5 text-xs font-semibold bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">-- Tất cả loại hình --</option>
            {Object.values(JobType).map((t) => (
              <option key={t} value={t}>{JOB_TYPE_LABELS[t]}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full p-2.5 text-xs font-semibold bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">-- Tất cả trạng thái --</option>
            {Object.values(JobStatus).map((s) => (
              <option key={s} value={s}>{JOB_STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-xs font-semibold p-3 rounded-xl border border-red-100">
          {error}
        </div>
      )}

      {/* Danh sách tin */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.map((job) => (
          <div
            key={job.id}
            className="bg-white p-5 rounded-2xl border border-gray-100 shadow-3xs hover:shadow-2xs transition flex flex-col justify-between gap-3"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded shrink-0">
                  {labelOf(JOB_TYPE_LABELS, job.type)}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 ${
                    JOB_STATUS_COLORS[job.status] || "bg-gray-100 text-gray-600 border-gray-200"
                  }`}
                >
                  {labelOf(JOB_STATUS_LABELS, job.status)}
                </span>
              </div>

              <h4 className="text-xs font-black text-slate-800 leading-normal line-clamp-2">
                {job.title}
              </h4>
              <p className="text-[10px] text-blue-600 font-bold truncate">
                🏢 {job.enterpriseName || "—"}
              </p>
              <p className="text-[11px] font-bold font-mono text-emerald-600">{job.salary || "Thỏa thuận"}</p>

              {job.description && (
                <p className="text-xs text-gray-500 leading-normal line-clamp-2">{job.description}</p>
              )}

              <div className="space-y-1 pt-1 text-[10px] text-gray-500 font-semibold">
                <p className="flex items-center gap-1.5">
                  <Users className="h-3 w-3 text-gray-400 shrink-0" />
                  Cần tuyển: <span className="font-bold text-slate-700">{job.quantity}</span>
                </p>
                <p className="flex items-center gap-1.5">
                  <GraduationCap className="h-3 w-3 text-gray-400 shrink-0" />
                  <span className="truncate">{job.majors || "—"}</span>
                </p>
                <p className="flex items-center gap-1.5">
                  <MapPin className="h-3 w-3 text-gray-400 shrink-0" />
                  <span className="truncate">{job.location || "—"}</span>
                </p>
              </div>
            </div>

            <div className="pt-2.5 border-t border-gray-50 flex items-center justify-between gap-2">
              <span className="text-[10px] font-mono font-semibold text-gray-400 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Hạn chót: {formatDateVi(job.dateDeadline)}
              </span>
              {canManage && (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => openEdit(job)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="Sửa tin tuyển dụng"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(job)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Xóa tin tuyển dụng"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="py-12 border border-dashed border-gray-200 rounded-2xl text-center text-slate-400 text-xs font-semibold">
          {jobsList.length === 0
            ? "Chưa có tin tuyển dụng nào. Bấm “Đăng tin tuyển dụng” để thêm mới."
            : "Không có tin nào khớp điều kiện tìm kiếm."}
        </div>
      )}

      {/* Modal tạo/sửa */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4 z-50 animate-fade-in text-left">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-gray-100 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-widest">
                {editingId ? "Cập nhật tin tuyển dụng" : "Đăng tin tuyển dụng mới"}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 text-xs p-2 rounded-lg border border-red-100">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3 text-xs font-semibold">
              <div className="space-y-1">
                <label className="text-gray-500 block">Tiêu đề tin *</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="VD: Thực tập sinh Lập trình Web Full stack"
                  className="w-full p-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-gray-500 block">Doanh nghiệp *</label>
                  <select
                    required
                    value={form.enterpriseId}
                    onChange={(e) => setForm({ ...form, enterpriseId: e.target.value })}
                    className="w-full p-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">-- Chọn doanh nghiệp --</option>
                    {enterprises.map((ent) => (
                      <option key={ent.id} value={ent.id}>
                        {ent.shortName || ent.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-gray-500 block">Loại hình *</label>
                  <select
                    required
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as JobType })}
                    className="w-full p-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {Object.values(JobType).map((t) => (
                      <option key={t} value={t}>{JOB_TYPE_LABELS[t]}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-gray-500 block">Số lượng cần tuyển *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
                    className="w-full p-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-gray-500 block">Hạn chót nhận hồ sơ *</label>
                  <input
                    type="date"
                    required
                    value={form.dateDeadline}
                    onChange={(e) => setForm({ ...form, dateDeadline: e.target.value })}
                    className="w-full p-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-gray-500 block">Trạng thái</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as JobStatus })}
                    className="w-full p-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {Object.values(JobStatus).map((s) => (
                      <option key={s} value={s}>{JOB_STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-gray-500 block">Ngành / chuyên ngành phù hợp *</label>
                <input
                  type="text"
                  required
                  value={form.majors}
                  onChange={(e) => setForm({ ...form, majors: e.target.value })}
                  placeholder="VD: Công nghệ thông tin, Hệ thống thông tin"
                  className="w-full p-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-gray-500 block">Địa điểm làm việc</label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="w-full p-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-gray-500 block">Mức lương / trợ cấp</label>
                  <input
                    type="text"
                    value={form.salary}
                    onChange={(e) => setForm({ ...form, salary: e.target.value })}
                    placeholder="VD: 3,000,000đ - 6,000,000đ"
                    className="w-full p-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-gray-500 block">Mô tả công việc</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full p-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-500 block">Yêu cầu ứng viên</label>
                <textarea
                  rows={2}
                  value={form.requirements}
                  onChange={(e) => setForm({ ...form, requirements: e.target.value })}
                  className="w-full p-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-gray-500 block">Người liên hệ</label>
                  <input
                    type="text"
                    value={form.contactName}
                    onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                    className="w-full p-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-gray-500 block">Email liên hệ</label>
                  <input
                    type="email"
                    value={form.contactEmail}
                    onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                    className="w-full p-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-gray-500 block">Điện thoại liên hệ</label>
                  <input
                    type="text"
                    value={form.contactPhone}
                    onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                    className="w-full p-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-600 font-bold rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl disabled:opacity-60"
                >
                  {saving ? "Đang lưu..." : editingId ? "Cập nhật" : "Đăng tin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
