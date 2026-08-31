export type DeleteTargetType = "TENANT" | "PERMISSION" | "COUNTRY"
export type QueueStatus = "SCHEDULED" | "ON_HOLD"

export type DeletionQueueItem = {
  id: string
  targetType: DeleteTargetType
  targetRef: string // kode / key / iso2, font-mono
  requestedBy: string
  requestedAt: string // ISO
  runAt: string // ISO — jadwal eksekusi permanen
  status: QueueStatus
  reason: string
}

/** SISTEM › Housekeeping — antrean hapus permanen. */
export const deletionQueue: DeletionQueueItem[] = [
  {
    id: "dq_01",
    targetType: "TENANT",
    targetRef: "OLDCLINIC",
    requestedBy: "Irfan W.",
    requestedAt: "2026-08-18T09:48:00Z",
    runAt: "2026-09-01T00:00:00Z",
    status: "SCHEDULED",
    reason: "Tenant nonaktif > 180 hari",
  },
  {
    id: "dq_02",
    targetType: "TENANT",
    targetRef: "DEMO2024",
    requestedBy: "Rizky A.",
    requestedAt: "2026-08-25T04:30:00Z",
    runAt: "2026-09-08T00:00:00Z",
    status: "SCHEDULED",
    reason: "Data uji coba",
  },
  {
    id: "dq_03",
    targetType: "PERMISSION",
    targetRef: "report.legacy_export",
    requestedBy: "Dewi K.",
    requestedAt: "2026-08-26T10:00:00Z",
    runAt: "2026-09-02T00:00:00Z",
    status: "ON_HOLD",
    reason: "Masih terikat 1 tenant — menunggu pelepasan",
  },
]

export type SchedulerRunOutcome = "OK" | "PARTIAL" | "FAILED"

export type SchedulerRun = {
  id: string
  job: string // enum snake_case, font-mono
  startedAt: string
  durationMs: number
  outcome: SchedulerRunOutcome
  itemsProcessed: number
  itemsFailed: number
}

/** SISTEM › Housekeeping — riwayat scheduler. */
export const schedulerRuns: SchedulerRun[] = [
  { id: "sr_01", job: "purge_expired_sessions", startedAt: "2026-08-29T03:00:00Z", durationMs: 1840, outcome: "OK", itemsProcessed: 312, itemsFailed: 0 },
  { id: "sr_02", job: "compact_audit_log", startedAt: "2026-08-29T03:05:00Z", durationMs: 9120, outcome: "OK", itemsProcessed: 20480, itemsFailed: 0 },
  { id: "sr_03", job: "run_deletion_queue", startedAt: "2026-08-29T03:10:00Z", durationMs: 640, outcome: "OK", itemsProcessed: 0, itemsFailed: 0 },
  { id: "sr_04", job: "reindex_permission_bindings", startedAt: "2026-08-28T03:05:00Z", durationMs: 5230, outcome: "PARTIAL", itemsProcessed: 51, itemsFailed: 1 },
  { id: "sr_05", job: "purge_expired_sessions", startedAt: "2026-08-28T03:00:00Z", durationMs: 1750, outcome: "OK", itemsProcessed: 289, itemsFailed: 0 },
  { id: "sr_06", job: "run_deletion_queue", startedAt: "2026-08-27T03:10:00Z", durationMs: 12400, outcome: "FAILED", itemsProcessed: 0, itemsFailed: 1 },
]
