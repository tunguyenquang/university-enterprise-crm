// ==========================================
// QUẢN LÝ NHẮC VIỆC & FOLLOW-UP (Tasks)
// ==========================================
// Trước đây tab này chỉ tạo mới + tick hoàn thành, không sửa/xóa được và không có bộ lọc.
// Component này bổ sung sửa/xóa, lọc theo trạng thái - mức ưu tiên - cán bộ phụ trách,
// và hiển thị nhãn tiếng Việt thay cho enum thô (HIGH, TODO...).

import React, { useMemo, useState } from "react";
import { Task, Enterprise, User, TaskStatus, TaskPriority } from "../types/crm.ts";
import { api } from "../lib/api.ts";
import {
  TASK_STATUS_LABELS,
  TASK_STATUS_COLORS,
  TASK_PRIORITY_LABELS,
  TASK_PRIORITY_COLORS,
  labelOf,
  formatDateVi,
} from "../lib/crmLabels.ts";
import {
  CheckSquare, Plus, X, Edit2, Trash2, Search, AlarmClock, Building2, UserCircle2,
} from "lucide-react";

interface Props {
  token: string;
  currentUserId: string;
  tasksList: Task[];
  enterprises: Enterprise[];
  usersList: User[];
  onChanged: () => void;
}

const EMPTY_FORM = {
  title: "",
  description: "",
  dueDate: "",
  status: TaskStatus.TODO as TaskStatus,
  priority: TaskPriority.MEDIUM as TaskPriority,
  enterpriseId: "",
  assigneeId: "",
};

const toDateInput = (value?: string | null): string =>
  value ? String(value).substring(0, 10) : "";

// Số ngày còn lại tới hạn (âm = đã quá hạn). Dùng mốc đầu ngày để không bị lệch bởi giờ.
const daysLeft = (dueDate: string): number => {
  const due = new Date(dueDate);
  if (Number.isNaN(due.getTime())) return 0;
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  return Math.round((startOfDay(due) - startOfDay(new Date())) / (24 * 3600 * 1000));
};

export default function TaskManagement({
  token,
  currentUserId,
  tasksList,
  enterprises,
  usersList,
  onChanged,
}: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return tasksList.filter((t) => {
      const matchKeyword =
        !keyword ||
        t.title.toLowerCase().includes(keyword) ||
        (t.description || "").toLowerCase().includes(keyword) ||
        (t.enterpriseName || "").toLowerCase().includes(keyword);
      const matchStatus = !statusFilter || t.status === statusFilter;
      const matchPriority = !priorityFilter || t.priority === priorityFilter;
      const matchAssignee = !assigneeFilter || t.assigneeId === assigneeFilter;
      return matchKeyword && matchStatus && matchPriority && matchAssignee;
    });
  }, [tasksList, search, statusFilter, priorityFilter, assigneeFilter]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, assigneeId: currentUserId });
    setError("");
    setModalOpen(true);
  };

  const openEdit = (task: Task) => {
    setEditingId(task.id);
    setForm({
      title: task.title,
      description: task.description || "",
      dueDate: toDateInput(task.dueDate),
      status: task.status,
      priority: task.priority,
      enterpriseId: task.enterpriseId || "",
      assigneeId: task.assigneeId,
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
        title: form.title,
        description: form.description || null,
        dueDate: form.dueDate,
        status: form.status,
        priority: form.priority,
        enterpriseId: form.enterpriseId || null,
        assigneeId: form.assigneeId,
      };
      if (editingId) {
        await api.put(`/api/tasks/${editingId}`, payload, token);
      } else {
        await api.post("/api/tasks", payload, token);
      }
      setModalOpen(false);
      onChanged();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  // Tick nhanh hoàn thành / bỏ hoàn thành, chỉ gửi đúng trường status.
  const handleToggleDone = async (task: Task) => {
    const nextStatus = task.status === TaskStatus.COMPLETED ? TaskStatus.TODO : TaskStatus.COMPLETED;
    try {
      await api.put(`/api/tasks/${task.id}`, { status: nextStatus }, token);
      onChanged();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleDelete = async (task: Task) => {
    if (!window.confirm(`Xóa công việc "${task.title}"?`)) return;
    try {
      await api.del(`/api/tasks/${task.id}`, token);
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
              <CheckSquare className="h-5 w-5 mr-1.5 text-blue-600" />
              Danh sách công việc &amp; Giao việc nội bộ
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Liệt kê toàn bộ công việc cần follow-up sau các cuộc tương tác với doanh nghiệp.
            </p>
          </div>
          <button
            onClick={openCreate}
            className="px-3 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl flex items-center gap-1 shrink-0"
          >
            <Plus className="h-4 w-4" /> Phân công việc mới
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo nội dung công việc..."
              className="w-full pl-9 pr-3 py-2.5 text-xs font-semibold border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full p-2.5 text-xs font-semibold bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">-- Tất cả trạng thái --</option>
            {Object.values(TaskStatus).map((s) => (
              <option key={s} value={s}>{TASK_STATUS_LABELS[s]}</option>
            ))}
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-full p-2.5 text-xs font-semibold bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">-- Tất cả mức ưu tiên --</option>
            {Object.values(TaskPriority).map((p) => (
              <option key={p} value={p}>{TASK_PRIORITY_LABELS[p]}</option>
            ))}
          </select>
          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="w-full p-2.5 text-xs font-semibold bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">-- Tất cả cán bộ --</option>
            {usersList.map((u) => (
              <option key={u.id} value={u.id}>{u.fullName}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-xs font-semibold p-3 rounded-xl border border-red-100">
          {error}
        </div>
      )}

      {/* Danh sách công việc */}
      <div className="space-y-3">
        {filtered.map((task) => {
          const remaining = daysLeft(task.dueDate);
          const isDone = task.status === TaskStatus.COMPLETED;
          const isOverdue = !isDone && remaining < 0;
          return (
            <div
              key={task.id}
              className="bg-white p-4 rounded-2xl border border-gray-100 flex items-start justify-between gap-4 hover:shadow-3xs transition"
            >
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <input
                  type="checkbox"
                  checked={isDone}
                  onChange={() => handleToggleDone(task)}
                  title={isDone ? "Đánh dấu chưa hoàn thành" : "Đánh dấu hoàn thành"}
                  className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-blue-600"
                />
                <div className="min-w-0 space-y-1">
                  <h4
                    className={`text-sm font-bold leading-normal ${
                      isDone ? "text-gray-400 line-through" : "text-slate-800"
                    }`}
                  >
                    {task.title}
                  </h4>
                  <p className="text-[11px] text-gray-500 font-semibold flex items-center gap-1.5 flex-wrap">
                    <Building2 className="h-3 w-3 text-gray-400 shrink-0" />
                    {task.enterpriseName || "Không gắn doanh nghiệp"}
                    <span className="text-gray-300">•</span>
                    <UserCircle2 className="h-3 w-3 text-gray-400 shrink-0" />
                    {task.assigneeName || "—"}
                  </p>
                  {task.description && (
                    <p className="text-xs text-gray-400 italic line-clamp-2">{task.description}</p>
                  )}
                </div>
              </div>

              <div className="shrink-0 flex flex-col items-end gap-1.5">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-black border ${
                      TASK_PRIORITY_COLORS[task.priority] || "bg-gray-50 text-gray-600 border-gray-200"
                    }`}
                  >
                    {labelOf(TASK_PRIORITY_LABELS, task.priority)}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-black border ${
                      TASK_STATUS_COLORS[task.status] || "bg-gray-50 text-gray-600 border-gray-200"
                    }`}
                  >
                    {labelOf(TASK_STATUS_LABELS, task.status)}
                  </span>
                </div>

                <span
                  className={`text-[10px] font-bold font-mono flex items-center gap-1 ${
                    isOverdue ? "text-red-600" : "text-slate-400"
                  }`}
                >
                  <AlarmClock className="h-3 w-3" />
                  {formatDateVi(task.dueDate)}
                  {!isDone && (isOverdue ? ` (quá ${Math.abs(remaining)} ngày)` : ` (còn ${remaining} ngày)`)}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEdit(task)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="Sửa công việc"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(task)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Xóa công việc"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="py-12 border border-dashed border-gray-200 rounded-2xl text-center text-slate-400 text-xs font-semibold">
          {tasksList.length === 0
            ? "Chưa có công việc nào. Bấm “Phân công việc mới” để thêm."
            : "Không có công việc nào khớp điều kiện lọc."}
        </div>
      )}

      {/* Modal tạo/sửa */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4 z-50 animate-fade-in text-left">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-gray-100 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-widest">
                {editingId ? "Cập nhật công việc" : "Phân công việc mới"}
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
                <label className="text-gray-500 block">Nội dung công việc *</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full p-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-gray-500 block">Cán bộ phụ trách *</label>
                  <select
                    required
                    value={form.assigneeId}
                    onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}
                    className="w-full p-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">-- Chọn cán bộ --</option>
                    {usersList.map((u) => (
                      <option key={u.id} value={u.id}>{u.fullName}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-gray-500 block">Hạn hoàn thành *</label>
                  <input
                    type="date"
                    required
                    value={form.dueDate}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                    className="w-full p-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-gray-500 block">Mức ưu tiên</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value as TaskPriority })}
                    className="w-full p-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {Object.values(TaskPriority).map((p) => (
                      <option key={p} value={p}>{TASK_PRIORITY_LABELS[p]}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-gray-500 block">Trạng thái</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as TaskStatus })}
                    className="w-full p-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {Object.values(TaskStatus).map((s) => (
                      <option key={s} value={s}>{TASK_STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-gray-500 block">Doanh nghiệp liên quan</label>
                <select
                  value={form.enterpriseId}
                  onChange={(e) => setForm({ ...form, enterpriseId: e.target.value })}
                  className="w-full p-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">-- Không gắn doanh nghiệp --</option>
                  {enterprises.map((ent) => (
                    <option key={ent.id} value={ent.id}>{ent.shortName || ent.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-gray-500 block">Mô tả chi tiết</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full p-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
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
                  {saving ? "Đang lưu..." : editingId ? "Cập nhật" : "Phân công"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
