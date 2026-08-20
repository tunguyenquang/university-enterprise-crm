// ==========================================
// RBAC - bản đồ vai trò -> quyền (nguồn duy nhất)
// ==========================================
// Dùng chung cho cả hai backend (JSON & Prisma) và cho middleware phân quyền.

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  "r-admin": [
    "view_all_enterprises", "create_enterprise", "edit_enterprise", "delete_enterprise",
    "manage_contacts", "manage_interactions", "manage_mou", "manage_jobs", "manage_events",
    "view_dashboard", "manage_users", "manage_master_data",
  ],
  "r-leader": ["view_all_enterprises", "view_dashboard"],
  "r-qhdn-mgr": [
    "view_all_enterprises", "create_enterprise", "edit_enterprise", "manage_contacts",
    "manage_interactions", "manage_mou", "manage_jobs", "manage_events", "view_dashboard",
  ],
  "r-qhdn-staff": [
    "view_all_enterprises", "create_enterprise", "edit_enterprise", "manage_contacts",
    "manage_interactions", "manage_mou", "manage_jobs", "manage_events", "view_dashboard",
  ],
  "r-faculty": [
    "view_assigned_enterprises", "create_enterprise", "edit_enterprise", "manage_contacts",
    "manage_interactions", "view_dashboard",
  ],
  "r-student": ["view_all_enterprises", "manage_contacts", "manage_jobs", "manage_events", "view_dashboard"],
  "r-startup": ["view_all_enterprises", "manage_interactions", "manage_events", "view_dashboard"],
};

export function getPermissionsForRole(roleId: string): string[] {
  return ROLE_PERMISSIONS[roleId] || [];
}
