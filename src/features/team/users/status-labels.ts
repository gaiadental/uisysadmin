import type { SystemUserStatus } from "@/types/system-user"

/** Display labels of the three contract statuses (FE doc 5.1). */
export const USER_STATUS_LABELS: Readonly<Record<SystemUserStatus, string>> = {
  ACTIVE: "Aktif",
  SUSPENDED: "Ditangguhkan",
  DEACTIVATED: "Dinonaktifkan",
}
