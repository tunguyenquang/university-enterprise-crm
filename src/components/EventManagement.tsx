// ==========================================
// QUẢN LÝ SỰ KIỆN PHỐI HỢP (Events)
// ==========================================
// Trước đây tab này chỉ hiển thị và in ra ID thô ("Đồng hành cùng: e-fpt") dù backend
// đã có đủ POST/PUT/DELETE /api/events. Component này bổ sung tạo/sửa/xóa, lọc theo
// loại và trạng thái, hiển thị TÊN doanh nghiệp / khoa thay cho ID, và hiện ngân sách.

import React, { useMemo, useState } from "react";
import { Event, Enterprise, Department, EventType, EventStatus } from "../types/crm.ts";
import { api } from "../lib/api.ts";
import {
  EVENT_TYPE_LABELS,
  EVENT_STATUS_LABELS,
  EVENT_STATUS_COLORS,
  labelOf,
  formatDateVi,
} from "../lib/crmLabels.ts";
import {
  Calendar, Plus, X, Edit2, Trash2, Search, MapPin, Users, Wallet, Building2,
} from "lucide-react";

interface Props {
  token: string;
  canManage: boolean;
  eventsList: Event[];
  enterprises: Enterprise[];
  departmentsList: Department[];
  onChanged: () => void;
}

const EMPTY_FORM = {
  title: "",
  type: EventType.WORKSHOP as EventType,
  date: "",
  location: "",
  description: "",
  budget: "",
  joinCount: 0,
  status: EventStatus.UPCOMING as EventStatus,
  enterpriseIds: [] as string[],
  departmentIds: [] as string[],
};

const toDateInput = (value?: string | null): string =>
  value ? String(value).substring(0, 10) : "";

// Định dạng tiền VND, trả về "—" khi không có ngân sách.
const formatBudget = (value?: number | null): string => {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value);
};

export default function EventManagement({
  token,
  canManage,
  eventsList,
  enterprises,
  departmentsList,
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

  // Đổi danh sách ID thành tên đọc được. ID không tra được (đơn vị đã xóa) vẫn hiện
  // nguyên giá trị để không mất dấu dữ liệu, thay vì im lặng bỏ qua.
  const namesOf = (ids: string[], source: { id: string; name: string; shortName?: string | null }[]): string => {
    if (!ids || ids.length === 0) return "—";
    return ids
      .map((id) => {
        const found = source.find((s) => s.id === id);
        return found ? (found.shortName || found.name) : id;
      })
      .join(", ");
  };

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return eventsList.filter((ev) => {
      const matchKeyword =
        !keyword ||
        ev.title.toLowerCase().includes(keyword) ||
        (ev.location || "").toLowerCase().includes(keyword);
      const matchType = !typeFilter || ev.type === typeFilter;
      const matchStatus = !statusFilter || ev.status === statusFilter;
      return matchKeyword && matchType && matchStatus;
    });
  }, [eventsList, search, typeFilter, statusFilter]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setError("");
    setModalOpen(true);
  };

  const openEdit = (ev: Event) => {
    setEditingId(ev.id);
    setForm({
      title: ev.title,
      type: ev.type,
      date: toDateInput(ev.date),
      location: ev.location || "",
      description: ev.description || "",
      budget: ev.budget === null || ev.budget === undefined ? "" : String(ev.budget),
      joinCount: ev.joinCount || 0,
      status: ev.status,
      enterpriseIds: [...(ev.enterpriseIds || [])],
      departmentIds: [...(ev.departmentIds || [])],
    });
    setError("");
    setModalOpen(true);
  };

  const toggleId = (field: "enterpriseIds" | "departmentIds", id: string) => {
    const current = form[field];
    // Tạo mảng mới thay vì mutate (immutable).
    const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
    setForm({ ...form, [field]: next });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        title: form.title,
        type: form.type,
        date: form.date,
        location: form.location,
        description: form.description || null,
        // Ngân sách để trống nghĩa là chưa xác định, không phải 0.
        budget: form.budget === "" ? null : Number(form.budget),
        joinCount: Number(form.joinCount) || 0,
        status: form.status,
        enterpriseIds: form.enterpriseIds,
        departmentIds: form.departmentIds,
      };
      if (editingId) {
        await api.put(`/api/events/${editingId}`, payload, token);
      } else {
        await api.post("/api/events", payload, token);
      }
      setModalOpen(false);
      onChanged();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (ev: Event) => {
    if (!window.confirm(`Xóa sự kiện "${ev.title}"?`)) return;
    try {
      await api.del(`/api/events/${ev.id}`, token);
      onChanged();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Thanh công cụ */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center">
              <Calendar className="h-5 w-5 mr-1.5 text-blue-600" />
              Sự kiện phối hợp Nhà trường &ndash; Doanh nghiệp
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Workshop, ngày hội việc làm, tham quan doanh nghiệp, tài trợ và cố vấn.
            </p>
          </div>
          {canManage && (
            <button
              onClick={openCreate}
              className="px-3 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl flex items-center gap-1 shrink-0"
            >
              <Plus className="h-4 w-4" /> Tạo sự kiện
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
              placeholder="Tìm theo tên sự kiện, địa điểm..."
              className="w-full pl-9 pr-3 py-2.5 text-xs font-semibold border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full p-2.5 text-xs font-semibold bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">-- Tất cả loại sự kiện --</option>
            {Object.values(EventType).map((t) => (
              <option key={t} value={t}>{EVENT_TYPE_LABELS[t]}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full p-2.5 text-xs font-semibold bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">-- Tất cả trạng thái --</option>
            {Object.values(EventStatus).map((s) => (
              <option key={s} value={s}>{EVENT_STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-xs font-semibold p-3 rounded-xl border border-red-100">
          {error}
        </div>
      )}

      {/* Danh sách sự kiện */}
      <div className="space-y-4">
        {filtered.map((ev) => (
          <div
            key={ev.id}
            className="bg-white p-5 rounded-2xl border border-gray-100 flex flex-col md:flex-row md:items-start justify-between gap-6 hover:shadow-3xs transition"
          >
            <div className="space-y-2 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] bg-amber-100 text-amber-800 border border-amber-200 font-black px-2 py-0.5 rounded">
                  {labelOf(EVENT_TYPE_LABELS, ev.type)}
                </span>
                <span className="text-xs text-gray-400 font-mono font-bold">{formatDateVi(ev.date)}</span>
              </div>

              <h4 className="text-sm font-black text-slate-800 leading-normal">{ev.title}</h4>

              <p className="text-xs text-gray-500 font-medium flex items-center gap-1.5 flex-wrap">
                <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                {ev.location || "—"}
                <span className="text-gray-300">•</span>
                <Users className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                {ev.joinCount} người tham dự
                <span className="text-gray-300">•</span>
                <Wallet className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                {formatBudget(ev.budget)}
              </p>

              {ev.description && (
                <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{ev.description}</p>
              )}

              <p className="text-xs text-blue-600 font-semibold">
                🤝 Doanh nghiệp: {namesOf(ev.enterpriseIds || [], enterprises)}
              </p>
              <p className="text-xs text-slate-500 font-semibold flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                Đơn vị chủ trì: {namesOf(ev.departmentIds || [], departmentsList)}
              </p>
            </div>

            <div className="flex md:flex-col items-center md:items-end gap-2 shrink-0">
              <span
                className={`inline-block px-4 py-1.5 font-bold text-xs border rounded-xl leading-none ${
                  EVENT_STATUS_COLORS[ev.status] || "bg-slate-50 text-gray-700 border-gray-100"
                }`}
              >
                {labelOf(EVENT_STATUS_LABELS, ev.status)}
              </span>
              {canManage && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEdit(ev)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="Sửa sự kiện"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(ev)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Xóa sự kiện"
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
          {eventsList.length === 0
            ? "Chưa có sự kiện nào. Bấm “Tạo sự kiện” để thêm mới."
            : "Không có sự kiện nào khớp điều kiện tìm kiếm."}
        </div>
      )}

      {/* Modal tạo/sửa */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4 z-50 animate-fade-in text-left">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-gray-100 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-widest">
                {editingId ? "Cập nhật sự kiện" : "Tạo sự kiện mới"}
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
                <label className="text-gray-500 block">Tên sự kiện *</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="VD: Ngày hội việc làm HUST 2026"
                  className="w-full p-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-gray-500 block">Loại sự kiện *</label>
                  <select
                    required
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as EventType })}
                    className="w-full p-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {Object.values(EventType).map((t) => (
                      <option key={t} value={t}>{EVENT_TYPE_LABELS[t]}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-gray-500 block">Ngày tổ chức *</label>
                  <input
                    type="date"
                    required
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full p-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-gray-500 block">Trạng thái</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as EventStatus })}
                    className="w-full p-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {Object.values(EventStatus).map((s) => (
                      <option key={s} value={s}>{EVENT_STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-gray-500 block">Địa điểm *</label>
                <input
                  type="text"
                  required
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="w-full p-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-gray-500 block">Ngân sách (VND)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.budget}
                    onChange={(e) => setForm({ ...form, budget: e.target.value })}
                    placeholder="Để trống nếu chưa xác định"
                    className="w-full p-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-gray-500 block">Số người tham dự</label>
                  <input
                    type="number"
                    min={0}
                    value={form.joinCount}
                    onChange={(e) => setForm({ ...form, joinCount: Number(e.target.value) })}
                    className="w-full p-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-gray-500 block">Mô tả nội dung</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full p-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-500 block">Doanh nghiệp đồng hành</label>
                <div className="flex flex-wrap gap-2 pt-1 max-h-32 overflow-y-auto">
                  {enterprises.map((ent) => {
                    const selected = form.enterpriseIds.includes(ent.id);
                    return (
                      <button
                        type="button"
                        key={ent.id}
                        onClick={() => toggleId("enterpriseIds", ent.id)}
                        className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition ${
                          selected
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white text-gray-600 border-gray-300 hover:border-blue-300"
                        }`}
                      >
                        {ent.shortName || ent.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-gray-500 block">Đơn vị chủ trì (Khoa / Phòng / Trung tâm)</label>
                <div className="flex flex-wrap gap-2 pt-1 max-h-32 overflow-y-auto">
                  {departmentsList.map((dept) => {
                    const selected = form.departmentIds.includes(dept.id);
                    return (
                      <button
                        type="button"
                        key={dept.id}
                        onClick={() => toggleId("departmentIds", dept.id)}
                        className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition ${
                          selected
                            ? "bg-emerald-600 text-white border-emerald-600"
                            : "bg-white text-gray-600 border-gray-300 hover:border-emerald-300"
                        }`}
                      >
                        {dept.name}
                      </button>
                    );
                  })}
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
                  {saving ? "Đang lưu..." : editingId ? "Cập nhật" : "Tạo sự kiện"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
