/**
 * "Sesi aktif" tab of the system user detail (REQ-FE-032; ARCH-FE-001 D4.10,
 * D12.1). The tab itself is shown only with `sessions:view`. "Force logout"
 * needs `sessions:revoke`, asks for confirmation, is hidden for the own
 * account, and invalidates `['admin','sessions', userId]`.
 */

import { useRef, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { useAuth } from "@/app/providers/auth-provider"
import { FormAlert } from "@/components/custom/form-alert"
import { useDialogs } from "@/components/dialogs/dialogs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TablePagination } from "@/components/table-pagination"
import type { WriteFailure } from "@/features/tenants/create/write-failure"
import { describeReadFailure } from "@/features/tenants/shared/failure"
import { useClientPagedList } from "@/hooks/use-client-paged-list"
import { forceLogoutUser, listUserSessions } from "@/lib/api/modules/sessions"
import { applyInvalidation } from "@/lib/query/invalidation"
import { queryKeys } from "@/lib/query/keys"
import type { Session } from "@/types/session"

import { canForceLogout } from "./access"
import { formatDateTime } from "./format"
import { describeUserWriteFailure } from "./user-failure"

const PAGE_SIZE = 10
const EMPTY_SESSIONS: readonly Session[] = []

/** The tab has no search box, so every session matches. */
function matchesAll(): boolean {
  return true
}

interface UserSessionsTabProps {
  readonly userId: string
  readonly loginId: string
  readonly isSelf: boolean
}

export function UserSessionsTab({
  userId,
  loginId,
  isSelf,
}: UserSessionsTabProps) {
  const queryClient = useQueryClient()
  const { confirm } = useDialogs()
  const { me } = useAuth()
  const showForceLogout = canForceLogout(me?.permissions ?? [], isSelf)
  const [pending, setPending] = useState(false)
  const [failure, setFailure] = useState<WriteFailure | null>(null)
  const inFlight = useRef(false)

  const query = useQuery({
    queryKey: queryKeys.adminSessions.ofUser(userId),
    queryFn: () => listUserSessions(userId),
  })
  const sessions = query.data ?? EMPTY_SESSIONS
  const list = useClientPagedList(sessions, {
    pageSize: PAGE_SIZE,
    matches: matchesAll,
  })
  const readFailure = query.isError ? describeReadFailure(query.error) : null

  const forceLogout = async () => {
    if (inFlight.current) return
    setFailure(null)
    const confirmed = await confirm({
      title: `Paksa keluar ${loginId}?`,
      description:
        "Semua sesi aktif akun ini akan diakhiri. User harus masuk lagi.",
      confirmLabel: "Paksa keluar",
      tone: "destructive",
    })
    if (!confirmed || inFlight.current) return
    inFlight.current = true
    setPending(true)
    try {
      await forceLogoutUser(userId)
      await applyInvalidation(queryClient, { kind: "forceLogout", userId })
      toast.success("Semua sesi akun diakhiri.")
    } catch (error) {
      setFailure(describeUserWriteFailure(error))
    } finally {
      inFlight.current = false
      setPending(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-medium">Sesi aktif</h2>
        {showForceLogout ? (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={pending || query.isPending}
            onClick={() => void forceLogout()}
          >
            {pending ? "Memproses..." : "Paksa keluar"}
          </Button>
        ) : null}
      </div>
      <FormAlert
        message={failure?.message ?? null}
        referenceId={failure?.referenceId ?? null}
      />
      {query.isPending ? (
        <>
          <span role="status" className="sr-only">
            Memuat sesi...
          </span>
          <div aria-hidden="true" className="flex flex-col gap-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </>
      ) : readFailure !== null ? (
        <FormAlert
          message={readFailure.message}
          referenceId={readFailure.referenceId}
        >
          <div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void query.refetch()}
            >
              Coba lagi
            </Button>
          </div>
        </FormAlert>
      ) : (
        <Table aria-label="Sesi aktif akun" aria-busy={query.isFetching}>
          <TableHeader>
            <TableRow>
              <TableHead>Perangkat</TableHead>
              <TableHead>IP</TableHead>
              <TableHead>Aktivitas terakhir</TableHead>
              <TableHead>Dibuat</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.total === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-muted-foreground"
                >
                  Tidak ada sesi aktif.
                </TableCell>
              </TableRow>
            ) : (
              list.pageItems.map((session) => (
                <TableRow key={session.sessionId}>
                  <TableCell
                    className="max-w-56 truncate"
                    title={session.userAgent}
                  >
                    {session.userAgent}
                    {session.isCurrent ? (
                      <Badge variant="secondary" className="ml-2">
                        Sesi ini
                      </Badge>
                    ) : null}
                  </TableCell>
                  <TableCell>{session.ipAddress}</TableCell>
                  <TableCell>
                    {session.lastActivityAt === null
                      ? "—"
                      : formatDateTime(session.lastActivityAt)}
                  </TableCell>
                  <TableCell>{formatDateTime(session.createdAt)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}
      {query.isSuccess ? (
        <TablePagination pagination={list} unit="sesi" />
      ) : null}
    </div>
  )
}
