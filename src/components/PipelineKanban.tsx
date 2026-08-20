import React, { useState, useEffect } from "react";
import { Enterprise, EnterpriseStatus, EnterprisePriority } from "../types/crm.ts";
import { ArrowLeft, ArrowRight, ArrowRightLeft, Building2, Eye, Shield, Tag, Star } from "lucide-react";

interface PipelineKanbanProps {
  token: string;
  enterprises: Enterprise[];
  onUpdateEnterpriseStatus: (id: string, newStatus: EnterpriseStatus) => void;
  onViewEnterpriseDetails: (id: string) => void;
}

export default function PipelineKanban({ token, enterprises, onUpdateEnterpriseStatus, onViewEnterpriseDetails }: PipelineKanbanProps) {
  // Define active pipeline stages
  const stages: { code: EnterpriseStatus; title: string; color: string; desc: string }[] = [
    { code: EnterpriseStatus.TIEM_NANG, title: "Tiềm năng", color: "border-t-4 border-t-slate-400 bg-slate-50/50", desc: "DN đề đề xuất hoặc tìm thấy qua cổng thông tin" },
    { code: EnterpriseStatus.DANG_TIEP_CAN, title: "Tiếp cận", color: "border-t-4 border-t-cyan-500 bg-cyan-50/30", desc: "Đang gọi điện, email, gửi thư mời hợp tác" },
    { code: EnterpriseStatus.DANG_TRAO_DOI, title: "Trao đổi", color: "border-t-4 border-t-orange-500 bg-orange-50/30", desc: "Thương lượng điều khoản, thảo luận quyền lợi" },
    { code: EnterpriseStatus.DA_KY_MOU, title: "Ký kết MOU", color: "border-t-4 border-t-blue-600 bg-blue-50/30", desc: "Xong văn bản, cam kết hợp tác lâu dài" },
    { code: EnterpriseStatus.DANG_TRIEN_KHAI, title: "Triển khai", color: "border-t-4 border-t-emerald-600 bg-emerald-50/30", desc: "Đưa sinh viên thực tập, mở workshop, tài trợ" }
  ];

  // Helper to shift enterprise stage
  const moveStage = (enterprise: Enterprise, step: number) => {
    const currentIndex = stages.findIndex(s => s.code === enterprise.status);
    if (currentIndex === -1) return;
    const nextIndex = currentIndex + step;
    if (nextIndex >= 0 && nextIndex < stages.length) {
      onUpdateEnterpriseStatus(enterprise.id, stages[nextIndex].code);
    }
  };

  const priorityColors: Record<EnterprisePriority, string> = {
    [EnterprisePriority.CHIEN_LUOC]: "bg-red-50 text-red-700 border border-red-200",
    [EnterprisePriority.QUAN_TRONG]: "bg-purple-50 text-purple-700 border border-purple-200",
    [EnterprisePriority.TIEM_NANG]: "bg-blue-50 text-blue-700 border border-blue-200",
    [EnterprisePriority.THUONG]: "bg-gray-100 text-gray-700 border border-gray-200"
  };

  const priorityLabels: Record<EnterprisePriority, string> = {
    [EnterprisePriority.CHIEN_LUOC]: "Chiến lược",
    [EnterprisePriority.QUAN_TRONG]: "Quan trọng",
    [EnterprisePriority.TIEM_NANG]: "Tiềm năng",
    [EnterprisePriority.THUONG]: "Thông thường"
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Kanban Info header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-gray-900 flex items-center">
            <ArrowRightLeft className="mr-2 h-5 w-5 text-blue-600" />
            Bảng điều phối Pipeline Quan hệ Doanh nghiệp
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Chuyển dịch các mốc tương tác bằng phím điều chỉnh nhanh trên thẻ hoặc lựa chọn thay đổi trong chi tiết doanh nghiệp.
          </p>
        </div>
        <div className="mt-3 md:mt-0 flex space-x-1.5 font-mono text-xs">
          <span className="px-2.5 py-1 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg">
            Tổng số: {enterprises.length} DN
          </span>
        </div>
      </div>

      {/* Board Columns rendering */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => {
          const matchingEnts = enterprises.filter(e => e.status === stage.code);
          return (
            <div 
              key={stage.code} 
              className={`flex flex-col rounded-2xl min-w-[240px] max-h-[700px] border border-gray-100 ${stage.color} p-3.5`}
            >
              {/* Column Header */}
              <div className="mb-3.5 shrink-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-800">{stage.title}</h3>
                  <span className="px-2.5 py-0.5 font-mono text-xs font-bold bg-white text-gray-700 rounded-lg shadow-2xs border border-gray-200/50">
                    {matchingEnts.length}
                  </span>
                </div>
                <p className="text-[10px] text-gray-400 mt-1 leading-normal">{stage.desc}</p>
              </div>

              {/* Cards list */}
              <div className="space-y-3 overflow-y-auto pr-1 flex-1 min-h-[250px]">
                {matchingEnts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 border border-dashed border-gray-200 rounded-xl text-gray-400">
                    <p className="text-[10px]">Trống</p>
                  </div>
                ) : (
                  matchingEnts.map((enterprise) => (
                    <div 
                      key={enterprise.id}
                      className="bg-white p-3.5 rounded-xl border border-gray-200/60 shadow-xs hover:shadow-xs hover:border-blue-200 transition group flex flex-col justify-between"
                      id={`kanban-card-${enterprise.code}`}
                    >
                      {/* Card Meta details */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold text-gray-400 break-all bg-gray-50 px-1 py-0.5 rounded">
                            {enterprise.code}
                          </span>
                          <span className={`text-[9px] font-semibold font-mono px-1.5 py-0.5 rounded ${priorityColors[enterprise.priority]}`}>
                            {priorityLabels[enterprise.priority]}
                          </span>
                        </div>

                        <div>
                          <h4 
                            onClick={() => onViewEnterpriseDetails(enterprise.id)}
                            className="text-xs font-bold text-gray-800 hover:text-blue-600 transition cursor-pointer line-clamp-2"
                          >
                            {enterprise.shortName || enterprise.name}
                          </h4>
                          <p className="text-[10px] text-gray-500 mt-1 line-clamp-1 font-mono">
                            {enterprise.field}
                          </p>
                        </div>

                        {/* Optional Tags summary */}
                        {enterprise.tags && enterprise.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {enterprise.tags.slice(0, 2).map(t => (
                              <span key={t} className="text-[9px] text-blue-500 bg-blue-50 px-1 rounded flex items-center">
                                <Tag className="h-2 w-2 mr-0.5" />
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Card Lower buttons & transition triggers */}
                      <div className="mt-4 pt-3.5 border-t border-gray-50 flex items-center justify-between">
                        <button 
                          onClick={() => onViewEnterpriseDetails(enterprise.id)}
                          className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition focus:outline-none"
                          title="Xem chi tiết"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        
                        <div className="flex space-x-1">
                          {/* Shift stage back */}
                          <button 
                            disabled={stages.findIndex(s => s.code === stage.code) === 0}
                            onClick={() => moveStage(enterprise, -1)}
                            className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition disabled:opacity-30 disabled:hover:bg-transparent focus:outline-none"
                            title="Lùi một bước"
                          >
                            <ArrowLeft className="h-3.5 w-3.5" />
                          </button>

                          {/* Shift stage forward */}
                          <button 
                            disabled={stages.findIndex(s => s.code === stage.code) === stages.length - 1}
                            onClick={() => moveStage(enterprise, 1)}
                            className="p-1 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition disabled:opacity-30 disabled:hover:bg-transparent focus:outline-none"
                            title="Tiến một bước"
                          >
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
