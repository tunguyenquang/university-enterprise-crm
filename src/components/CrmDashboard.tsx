import React, { useState, useEffect } from "react";
import { DashboardStats, EnterpriseStatus } from "../types/crm.ts";
import { ENTERPRISE_STATUS_LABELS } from "../lib/crmLabels.ts";
import { Building2, FileText, Briefcase, Calendar, CheckSquare, Award, AlertTriangle, ChevronRight, TrendingUp } from "lucide-react";

interface DashboardProps {
  token: string;
  onNavigateToEnterprise: (status?: string) => void;
  onNavigateToMous: () => void;
  onNavigateToTasks: () => void;
}

export default function CrmDashboard({ token, onNavigateToEnterprise, onNavigateToMous, onNavigateToTasks }: DashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/dashboard/stats", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Không thể lấy thống kê.");
      const data = await res.json();
      setStats(data);
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-500 font-medium">Đang tải báo cáo phân tích...</span>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-red-50 text-red-800 p-4 rounded-lg flex items-center">
        <AlertTriangle className="h-5 w-5 mr-2" />
        <p className="font-medium">Lỗi: {error || "Không có dữ liệu thống kê"}</p>
      </div>
    );
  }

  // Vietnamese helper translators
  // Nhãn trạng thái dùng chung (xem src/lib/crmLabels.ts).
  const statusLabels = ENTERPRISE_STATUS_LABELS;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
        <div 
          onClick={() => onNavigateToEnterprise()}
          className="bg-white p-5 rounded-xl shadow-xs border border-gray-100 hover:shadow-md hover:border-blue-100 transition cursor-pointer group"
          id="stat-enterprises"
        >
          <div className="flex items-center justify-between">
            <span className="text-gray-500 font-medium text-sm">Doanh nghiệp QHLK</span>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition">
              <Building2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-gray-900">{stats.totalEnterprises}</h3>
            <div className="flex items-center mt-1 text-xs text-gray-500 font-mono">
              <span className="text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded mr-1">
                +{stats.newEnterprisesThisMonth} tháng này
              </span>
              <span>đăng ký mới</span>
            </div>
          </div>
        </div>

        <div 
          onClick={() => onNavigateToMous()}
          className="bg-white p-5 rounded-xl shadow-xs border border-gray-100 hover:shadow-md hover:border-blue-100 transition cursor-pointer group"
          id="stat-mous"
        >
          <div className="flex items-center justify-between">
            <span className="text-gray-500 font-medium text-sm">MOU đang hiệu lực</span>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition">
              <FileText className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-gray-900">{stats.currentMous}</h3>
            <div className="flex items-center mt-1 text-xs">
              {stats.expiringMous > 0 ? (
                <span className="text-amber-600 font-medium flex items-center bg-amber-50 px-1.5 py-0.5 rounded">
                  <AlertTriangle className="h-3 w-3 mr-0.5" />
                  {stats.expiringMous} sắp hết hạn
                </span>
              ) : (
                <span className="text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Các văn bản an toàn</span>
              )}
            </div>
          </div>
        </div>

        <div 
          onClick={() => onNavigateToEnterprise("DANG_TRIEN_KHAI")}
          className="bg-white p-5 rounded-xl shadow-xs border border-gray-100 hover:shadow-md hover:border-emerald-100 transition cursor-pointer group"
          id="stat-active"
        >
          <div className="flex items-center justify-between">
            <span className="text-gray-500 font-medium text-sm">Đối tác tích cực</span>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-gray-900">{stats.activeEnterprises}</h3>
            <p className="text-xs text-gray-500 mt-1 font-mono">
              Tỷ lệ hợp tác sâu: {stats.totalEnterprises > 0 ? ((stats.activeEnterprises / stats.totalEnterprises) * 100).toFixed(0) : 0}%
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-xs border border-gray-100 group" id="stat-jobs">
          <div className="flex items-center justify-between">
            <span className="text-gray-500 font-medium text-sm">Nhu cầu việc làm</span>
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg group-hover:bg-amber-600 group-hover:text-white transition">
              <Briefcase className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-gray-900">{stats.jobsCount}</h3>
            <p className="text-xs text-gray-500 mt-1">Cơ hôi thực tập & Full-time</p>
          </div>
        </div>

        <div 
          onClick={onNavigateToTasks}
          className="bg-white p-5 rounded-xl shadow-xs border border-gray-100 hover:shadow-md hover:border-amber-100 transition cursor-pointer group"
          id="stat-tasks"
        >
          <div className="flex items-center justify-between">
            <span className="text-gray-500 font-medium text-sm">Công việc tồn đọng</span>
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-lg group-hover:bg-rose-600 group-hover:text-white transition">
              <CheckSquare className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-gray-900">{stats.tasksPending}</h3>
            <p className="text-xs text-gray-500 mt-1 font-mono">Cần hoàn thành sớm</p>
          </div>
        </div>
      </div>

      {/* Main Stats Charts Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Pipeline conversion analysis - Kanban stats */}
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 lg:col-span-4 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900 mb-1">Mức độ hợp tác theo Pipeline</h3>
            <p className="text-xs text-gray-400 mb-6">Mô hình hình phễu từ tiếp cận ban đầu đến triển khai thực tế.</p>
            
            <div className="space-y-4">
              {stats.pipelineStats.map((pipeline) => (
                <div key={pipeline.stage} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-700">{statusLabels[pipeline.stage]}</span>
                    <div className="flex items-center font-mono">
                      <span className="font-bold text-gray-900 mr-1.5">{pipeline.count} DN</span>
                      <span className="text-gray-400">({pipeline.percentage}%)</span>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        pipeline.stage === EnterpriseStatus.TIEM_NANG ? "bg-gray-400" :
                        pipeline.stage === EnterpriseStatus.DANG_TIEP_CAN ? "bg-blue-500" :
                        pipeline.stage === EnterpriseStatus.DANG_TRAO_DOI ? "bg-orange-500" :
                        pipeline.stage === EnterpriseStatus.DA_KY_MOU ? "bg-blue-600" : "bg-emerald-500"
                      }`}
                      style={{ width: `${pipeline.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between text-xs text-gray-500">
            <span>Tổng phễu đã liên kết:</span>
            <span className="font-bold font-mono text-gray-800">{stats.totalEnterprises} thành viên</span>
          </div>
        </div>

        {/* Faculty Partner Performance score mapping */}
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 lg:col-span-5">
          <h3 className="text-base font-bold text-gray-900 mb-1">Bảng xếp hạng Gắn kết giữa Khoa & Doanh nghiệp</h3>
          <p className="text-xs text-gray-400 mb-6">Điểm số tính bằng: 10đ/MOU ký kết, 5đ/Sự kiện tham gia, 2đ/Hồ sơ DN liên kết.</p>

          <div className="space-y-3 max-h-80 overflow-y-auto">
            {stats.engagementLeaderboard.map((leader, idx) => (
              <div 
                key={leader.departmentName} 
                className="flex items-center justify-between p-3.5 rounded-xl border border-gray-50 hover:border-blue-100 hover:bg-blue-50/20 transition"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div className={`h-8 w-8 flex items-center justify-center rounded-full text-xs font-bold font-mono shrink-0 ${
                    idx === 0 ? "bg-amber-100 text-amber-800 border border-amber-200" :
                    idx === 1 ? "bg-slate-100 text-slate-800 border border-slate-200" :
                    idx === 2 ? "bg-orange-100 text-orange-800 border border-orange-200" :
                    "bg-gray-50 text-gray-500"
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{leader.departmentName}</p>
                    <div className="flex items-center space-x-2 mt-0.5 text-xs text-gray-500 font-mono">
                      <span>{leader.mouCount} MOUs</span>
                      <span>•</span>
                      <span>{leader.eventCount} Sự kiện</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right shrink-0 ml-3">
                  <span className="inline-block px-2.5 py-1 bg-blue-50 border border-blue-100 text-blue-700 font-bold font-mono text-xs rounded-lg">
                    {leader.totalScore} điểm
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Enterprise Field Distribution */}
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 lg:col-span-3 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900 mb-1">Phân bố theo Lĩnh vực</h3>
            <p className="text-xs text-gray-400 mb-6 font-mono">Lĩnh vực hoạt động cốt lõi.</p>

            <div className="space-y-4">
              {stats.enterpriseByField.map(item => {
                const percentage = stats.totalEnterprises > 0 
                  ? ((item.count / stats.totalEnterprises) * 100).toFixed(0) 
                  : 0;
                return (
                  <div key={item.field} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600 truncate max-w-[140px] font-medium">{item.field}</span>
                      <span className="font-bold text-gray-900 font-mono">{item.count} DN ({percentage}%)</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-400 rounded-full"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-50 text-center">
            <button 
              onClick={() => onNavigateToEnterprise()}
              className="text-blue-600 text-xs font-semibold hover:text-blue-800 inline-flex items-center hover:underline focus:outline-none"
            >
              Xem chi tiết Danh sách DN
              <ChevronRight className="h-3 w-3 ml-0.5" />
            </button>
          </div>
        </div>

      </div>

      {/* Strategic Partners Quick Panel */}
      <div className="bg-gradient-to-r from-blue-900 to-slate-900 p-6 rounded-2xl text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between">
        <div className="space-y-1.5 mb-4 md:mb-0">
          <div className="flex items-center space-x-2">
            <Award className="h-5 w-5 text-amber-400 shrink-0" />
            <h3 className="text-base font-bold">Quản lý Cam kết và KPIs quan hệ doanh nghiệp</h3>
          </div>
          <p className="text-sm text-blue-100 max-w-xl">
            Hợp tác nhà trường - doanh nghiệp tại HUST hướng tới việc nâng cao tỉ lệ có việc làm đúng ngành của sinh viên sau 6 tháng tốt nghiệp đạt &gt;95%.
          </p>
        </div>
        <div className="flex space-x-3 shrink-0">
          <button 
            onClick={() => onNavigateToEnterprise()}
            className="px-4.5 py-2 bg-blue-600 hover:bg-blue-700 active:transform active:scale-95 transition text-white font-medium text-xs rounded-xl shadow-xs"
          >
            Đánh giá Doanh nghiệp chiến lược
          </button>
          <button 
            onClick={onNavigateToMous}
            className="px-4.5 py-2 bg-white/10 hover:bg-white/15 transition text-white font-medium text-xs rounded-xl"
          >
            Báo cáo Tái ký MOU
          </button>
        </div>
      </div>

    </div>
  );
}
