// ==========================================
// QUẢN LÝ CÁN BỘ & PHÂN QUYỀN (Master data - Users)
// ==========================================
// Tách khỏi App.tsx (#15) và dùng API CRUD user mới (#6).
// Chỉ tài khoản có quyền manage_users mới thao tác được (backend enforce).

import React, { useEffect, useState } from "react";
import { User, Department, Role } from "../types/crm.ts";
import { api } from "../lib/api.ts";
import { Shield, Plus, X, UserX, Edit2 } from "lucide-react";

interface Props {
  token: string;
  currentUserId: string;
  canManage: boolean;
  usersList: User[];
  departmentsList: Department[];
  onChanged: () => void; // gọi lại loadCrmData ở App sau khi thay đổi
}

const EMPTY_FORM = {
  email: "",
  fullName: "",
  phone: "",
  roleId: "",
  departmentId: "",
  password: "",
  isActive: true,
};

export default function UserManagement({
  token,
  currentUserId,
  canManage,
  usersList,
  departmentsList,
  onChanged,
}: Props) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<typeof EMPTY_FORM>({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/api/roles", token).then(setRoles).catch(() => setRoles([]));
  }, [token]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, roleId: roles[0]?.id || "" });
    setError("");
    setModalOpen(true);
  };

  const openEdit = (u: User) => {
    setEditingId(u.id);
    setForm({
      email: u.email,
      fullName: u.fullName,
      phone: u.phone || "",
      roleId: u.roleId,
      departmentId: u.departmentId || "",
      password: "",
      isActive: u.isActive,
    });
    setError("");
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (editingId) {
        const payload: Record<string, unknown> = {
          fullName: form.fullName,
          roleId: form.roleId,
          phone: form.phone || null,
          departmentId: form.departmentId || null,
          isActive: form.isActive,
        };
        if (form.password) payload.password = form.password;
        await api.put(`/api/users/${editingId}`, payload, token);
      } else {
        await api.post(
          "/api/users",
          {
            email: form.email,
            fullName: form.fullName,
            phone: form.phone || null,
            roleId: form.roleId,
            departmentId: form.departmentId || null,
            password: form.password,
            isActive: form.isActive,
          },
          token
        );
      }
      setModalOpen(false);
      onChanged();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (u: User) => {
    if (!window.confirm(`Vô hiệu hóa tài khoản "${u.fullName}"?`)) return;
    try {
      await api.del(`/api/users/${u.id}`, token);
      onChanged();
    } catch (err) {
      alert("Lỗi: " + (err as Error).message);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center">
            <Shield className="h-5 w-5 mr-1.5 text-blue-600" />
            Quản lý Cán bộ & Phân quyền (RBAC)
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            Thêm/sửa cán bộ, gán vai trò. Tài khoản vô hiệu hóa không thể đăng nhập.
          </p>
        </div>
        {canManage && (
          <button
            onClick={openCreate}
            className="px-3 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl flex items-center gap-1"
          >
            <Plus className="h-4 w-4" /> Thêm cán bộ
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-3xs overflow-y-auto max-h-[600px]">
        <div className="divide-y divide-gray-50">
          {usersList.map((u) => (
            <div key={u.id} className="py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-8 w-8 flex items-center justify-center rounded-full bg-blue-50 text-blue-600 text-xs font-black">
                  {u.fullName.slice(-2)}
                </div>
                <div className="min-w-0">
                  <h5 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                    {u.fullName}
                    {!u.isActive && (
                      <span className="px-1.5 py-0.5 bg-red-50 text-red-600 text-[9px] font-black rounded">
                        ĐÃ KHÓA
                      </span>
                    )}
                  </h5>
                  <p className="text-[10px] text-gray-400 font-mono truncate">
                    {u.email} • {u.department?.name || "Lãnh đạo Ban"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-blue-50/50 border border-blue-100 text-blue-700 text-[10px] font-black rounded-md leading-none">
                  {u.role?.name}
                </span>
                {canManage && (
                  <>
                    <button
                      onClick={() => openEdit(u)}
                      className="p-1.5 text-gray-400 hover:text-blue-600"
                      title="Sửa"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    {u.isActive && u.id !== currentUserId && (
                      <button
                        onClick={() => handleDeactivate(u)}
                        className="p-1.5 text-gray-400 hover:text-red-600"
                        title="Vô hiệu hóa"
                      >
                        <UserX className="h-4 w-4" />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4 z-50 animate-fade-in text-left">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-100 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-widest">
                {editingId ? "Cập nhật cán bộ" : "Thêm cán bộ mới"}
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
                <label className="text-gray-500 block">Email {!editingId && "*"}</label>
                <input
                  type="email"
                  required={!editingId}
                  disabled={!!editingId}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full p-2 bg-white border border-gray-300 rounded-lg disabled:bg-gray-50"
                />
              </div>
              <div className="space-y-1">
                <label className="text-gray-500 block">Họ tên *</label>
                <input
                  type="text"
                  required
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="w-full p-2 bg-white border border-gray-300 rounded-lg"
                />
              </div>
              <div className="space-y-1">
                <label className="text-gray-500 block">Số điện thoại</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full p-2 bg-white border border-gray-300 rounded-lg"
                />
              </div>
              <div className="space-y-1">
                <label className="text-gray-500 block">Vai trò *</label>
                <select
                  required
                  value={form.roleId}
                  onChange={(e) => setForm({ ...form, roleId: e.target.value })}
                  className="w-full p-2 bg-white border border-gray-300 rounded-lg"
                >
                  <option value="">-- Chọn vai trò --</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-gray-500 block">Đơn vị</label>
                <select
                  value={form.departmentId}
                  onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
                  className="w-full p-2 bg-white border border-gray-300 rounded-lg"
                >
                  <option value="">-- Không thuộc đơn vị --</option>
                  {departmentsList.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-gray-500 block">
                  Mật khẩu {editingId ? "(để trống nếu không đổi)" : "*"}
                </label>
                <input
                  type="password"
                  required={!editingId}
                  minLength={8}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Tối thiểu 8 ký tự"
                  className="w-full p-2 bg-white border border-gray-300 rounded-lg"
                />
              </div>
              {editingId && (
                <label className="flex items-center gap-2 text-gray-600">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  />
                  Tài khoản đang hoạt động
                </label>
              )}

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
