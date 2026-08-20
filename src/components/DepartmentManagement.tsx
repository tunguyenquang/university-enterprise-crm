// ==========================================
// QUẢN LÝ ĐƠN VỊ: KHOA / PHÒNG / TRUNG TÂM (Master data - Departments)
// ==========================================
// Backend đã có đủ CRUD /api/departments (quyền manage_master_data) nhưng chưa có màn nào
// dùng tới, nên danh mục Khoa/Phòng chỉ xem được qua dropdown. Component này bổ sung
// màn quản lý thật: tạo/sửa/xóa, gán đơn vị cha, và đếm số cán bộ thuộc đơn vị.
// Backend chặn xóa khi đơn vị còn được tham chiếu; lỗi đó được hiển thị nguyên văn cho người dùng.

import React, { useMemo, useState } from "react";
import { Department, User, DepartmentType } from "../types/crm.ts";
import { api } from "../lib/api.ts";
import { DEPARTMENT_TYPE_LABELS, labelOf } from "../lib/crmLabels.ts";
import { Building2, Plus, X, Edit2, Trash2, Users } from "lucide-react";

interface Props {
  token: string;
  canManage: boolean;
  departmentsList: Department[];
  usersList: User[];
  onChanged: () => void;
}

const EMPTY_FORM = {
  name: "",
  code: "",
  type: DepartmentType.KHOA as DepartmentType,
  parentId: "",
};

const TYPE_COLORS: Record<DepartmentType, string> = {
  [DepartmentType.KHOA]: "bg-blue-50 text-blue-700 border-blue-200",
  [DepartmentType.PHONG]: "bg-emerald-50 text-emerald-700 border-emerald-200",
  [DepartmentType.TRUNG_TAM]: "bg-purple-50 text-purple-700 border-purple-200",
};

export default function DepartmentManagement({
  token,
  canManage,
  departmentsList,
  usersList,
  onChanged,
}: Props) {
  const [typeFilter, setTypeFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const filtered = useMemo(
    () => departmentsList.filter((d) => !typeFilter || d.type === typeFilter),
    [departmentsList, typeFilter],
  );

  const countStaff = (departmentId: string) =>
    usersList.filter((u) => u.departmentId === departmentId).length;

  const parentNameOf = (parentId: string | null) => {
    if (!parentId) return null;
    return departmentsList.find((d) => d.id === parentId)?.name || parentId;
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setError("");
    setModalOpen(true);
  };

  const openEdit = (dept: Department) => {
    setEditingId(dept.id);
    setForm({
      name: dept.name,
      code: dept.code,
      type: dept.type,
      parentId: dept.parentId || "",
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
        name: form.name,
        code: form.code,
        type: form.type,
        parentId: form.parentId || null,
      };
      if (editingId) {
        await api.put(`/api/departments/${editingId}`, payload, token);
      } else {
        await api.post("/api/departments", payload, token);
      }
      setModalOpen(false);
      onChanged();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (dept: Department) => {
    if (!window.confirm(`Xóa đơn vị "${dept.name}"?`)) return;
    setError("");
    try {
      await api.del(`/api/departments/${dept.id}`, token);
      onChanged();
    } catch (err) {
      // Backend trả 400 khi đơn vị còn được tham chiếu - hiển thị nguyên văn để người dùng biết lý do.
      setError((err as Error).message);
    }
  };

  return (
    <div className="space-y-5">
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center">
              <Building2 className="h-5 w-5 mr-1.5 text-emerald-600" />
              Danh mục Khoa / Phòng / Trung tâm
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Cơ cấu tổ chức dùng để gán cán bộ, chủ trì MOU và sự kiện hợp tác.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="p-2 text-xs font-semibold bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">-- Tất cả loại đơn vị --</option>
              {Object.values(DepartmentType).map((t) => (
                <option key={t} value={t}>{DEPARTMENT_TYPE_LABELS[t]}</option>
              ))}
            </select>
            {canManage && (
              <button
                onClick={openCreate}
                className="px-3 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl flex items-center gap-1"
              >
                <Plus className="h-4 w-4" /> Thêm đơn vị
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 text-xs font-semibold p-3 rounded-xl border border-red-100">
            {error}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-3xs">
        <div className="divide-y divide-gray-50">
          {filtered.map((dept) => {
            const parentName = parentNameOf(dept.parentId);
            return (
              <div key={dept.id} className="py-3 flex items-center justify-between gap-4">
                <div className="min-w-0 space-y-1">
                  <h5 className="text-xs font-bold text-slate-800 flex items-center gap-2 flex-wrap">
                    {dept.name}
                    <span className="text-[10px] font-mono font-bold text-gray-400 bg-gray-50 border border-gray-200 px-1.5 py-0.5 rounded">
                      {dept.code}
                    </span>
                  </h5>
                  <p className="text-[10px] text-gray-400 font-semibold flex items-center gap-1.5 flex-wrap">
                    <Users className="h-3 w-3 shrink-0" />
                    {countStaff(dept.id)} cán bộ
                    {parentName && (
                      <>
                        <span className="text-gray-300">•</span>
                        Thuộc: {parentName}
                      </>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`px-2.5 py-1 border text-[10px] font-black rounded-md leading-none ${
                      TYPE_COLORS[dept.type] || "bg-gray-50 text-gray-600 border-gray-200"
                    }`}
                  >
                    {labelOf(DEPARTMENT_TYPE_LABELS, dept.type)}
                  </span>
                  {canManage && (
                    <>
                      <button
                        onClick={() => openEdit(dept)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Sửa đơn vị"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(dept)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Xóa đơn vị"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="py-10 text-center text-slate-400 text-xs font-semibold">
            Không có đơn vị nào khớp điều kiện lọc.
          </div>
        )}
      </div>

      {/* Modal tạo/sửa */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4 z-50 animate-fade-in text-left">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-100 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-widest">
                {editingId ? "Cập nhật đơn vị" : "Thêm đơn vị mới"}
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
                <label className="text-gray-500 block">Tên đơn vị *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="VD: Khoa Công nghệ thông tin"
                  className="w-full p-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-gray-500 block">Mã đơn vị *</label>
                  <input
                    type="text"
                    required
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    placeholder="VD: K_CNTT"
                    className="w-full p-2 bg-white border border-gray-300 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-gray-500 block">Loại đơn vị *</label>
                  <select
                    required
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as DepartmentType })}
                    className="w-full p-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {Object.values(DepartmentType).map((t) => (
                      <option key={t} value={t}>{DEPARTMENT_TYPE_LABELS[t]}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-gray-500 block">Đơn vị cấp trên</label>
                <select
                  value={form.parentId}
                  onChange={(e) => setForm({ ...form, parentId: e.target.value })}
                  className="w-full p-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">-- Đơn vị cấp cao nhất --</option>
                  {departmentsList
                    .filter((d) => d.id !== editingId)
                    .map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                </select>
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
                  className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl disabled:opacity-60"
                >
                  {saving ? "Đang lưu..." : editingId ? "Cập nhật" : "Tạo mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
