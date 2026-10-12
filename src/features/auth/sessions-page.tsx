/**
 * My sessions (ARCH-FE-001 D4.9, D5.4; FE doc 3.4). The signed-in user's own
 * sessions in a client-paged list, with a search box. The current session has
 * a badge and no revoke control: the user logs out instead. "Revoke all
 * others" needs a second step, and it never ends the current session.
 */

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { FormAlert } from "@/components/custom/form-alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  listOwnSessions,
  revokeOtherOwnSessions,
  revokeOwnSession,
} from "@/lib/api/modules/sessions"
import { applyInvalidation } from "@/lib/query/invalidation"
import { queryKeys } from "@/lib/query/keys"
import { routeMeta } from "@/lib/routes-meta"
import { useClientPagedList } from "@/hooks/use-client-paged-list"
import type { Session } from "@/types/session"

import { genericFailure, type FailureNotice } from "./auth-messages"

const SESSIONS_META = routeMeta["account.sessions"]
const PAGE_SIZE = 10
const EMPTY_SESSIONS: readonly Session[] = []
const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  dateStyle: "medium",
  timeStyle: "short",
}

/** Matches the search text against the IP address and the device string. The query is already normalised. */
function matchesSession(session: Session, query: string): boolean {
  return (
    session.ipAddress.toLocaleLowerCase().includes(query) ||
    session.userAgent.toLocaleLowerCase().includes(query)
  )
}

function formatDateTime(value: string | null): string {
  if (value === null) return "-"
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime())
    ? "-"
    : parsed.toLocaleString("id-ID", DATE_FORMAT)
}

export function SessionsPage() {
  const queryClient = useQueryClient()
  const sessionsQuery = useQuery({
    queryKey: queryKeys.sessions.own(),
    queryFn: listOwnSessions,
  })
  const sessions = sessionsQuery.data ?? EMPTY_SESSIONS
  const list = useClientPagedList(sessions, {
    pageSize: PAGE_SIZE,
    matches: matchesSession,
  })

  const [failure, setFailure] = useState<FailureNotice | null>(null)
  const [confirmRevokeAll, setConfirmRevokeAll] = useState(false)

  const revokeOne = useMutation({
    mutationFn: (sessionId: string) => revokeOwnSession(sessionId),
    onMutate: () => setFailure(null),
    onSuccess: () =>
      applyInvalidation(queryClient, { kind: "revokeOwnSessions" }),
    onError: (error) => setFailure(genericFailure(error)),
  })

  const revokeAll = useMutation({
    mutationFn: () => revokeOtherOwnSessions(),
    onMutate: () => {
      setFailure(null)
      setConfirmRevokeAll(false)
    },
    onSuccess: () =>
      applyInvalidation(queryClient, { kind: "revokeOwnSessions" }),
    onError: (error) => setFailure(genericFailure(error)),
  })

  const loadFailure = sessionsQuery.isError
    ? genericFailure(sessionsQuery.error)
    : null

  const busy = revokeOne.isPending || revokeAll.isPending
  const otherSessionCount = sessions.filter(
    (session) => !session.isCurrent
  ).length

  // Defence in depth: the current session is never sent to the revoke call.
  const revokeSession = (session: Session) => {
    if (session.isCurrent) return
    revokeOne.mutate(session.sessionId)
  }

  // Wider than AuthCard: the table has five columns inside the authenticated shell.
  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-xl font-semibold text-foreground">
          {SESSIONS_META.title}
        </h1>
        <p className="text-sm text-muted-foreground">
          {SESSIONS_META.description}
        </p>
      </header>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="session-search">Cari sesi</Label>
        <Input
          id="session-search"
          type="search"
          placeholder="IP atau perangkat"
          value={list.query}
          onChange={(event) => list.setQuery(event.target.value)}
        />
      </div>

      <FormAlert
        message={failure?.message ?? null}
        referenceId={failure?.referenceId ?? null}
      />

      {sessionsQuery.isPending ? (
        <p role="status" className="text-sm text-muted-foreground">
          Memuat sesi...
        </p>
      ) : sessionsQuery.isError && loadFailure !== null ? (
        <FormAlert
          message={loadFailure.message}
          referenceId={loadFailure.referenceId}
        >
          <Button
            variant="outline"
            size="sm"
            className="self-start"
            onClick={() => void sessionsQuery.refetch()}
          >
            Coba lagi
          </Button>
        </FormAlert>
      ) : (
        <Table aria-busy={busy} aria-label="Daftar sesi">
          <TableHeader>
            <TableRow>
              <TableHead>Perangkat</TableHead>
              <TableHead>IP</TableHead>
              <TableHead>Aktivitas terakhir</TableHead>
              <TableHead>Dibuat</TableHead>
              <TableHead>
                <span className="sr-only">Tindakan</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.pageItems.map((session) => (
              <TableRow key={session.sessionId}>
                <TableCell
                  className="max-w-56 truncate"
                  title={session.userAgent}
                >
                  {session.userAgent}
                </TableCell>
                <TableCell>{session.ipAddress}</TableCell>
                <TableCell>{formatDateTime(session.lastActivityAt)}</TableCell>
                <TableCell>{formatDateTime(session.createdAt)}</TableCell>
                <TableCell>
                  {session.isCurrent ? (
                    <Badge variant="secondary">Sesi ini</Badge>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={busy}
                      aria-label={`Cabut sesi dari ${session.ipAddress}`}
                      onClick={() => revokeSession(session)}
                    >
                      Cabut
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {list.total === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground"
                >
                  {list.query === ""
                    ? "Tidak ada sesi."
                    : "Tidak ada sesi yang cocok dengan pencarian."}
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      )}

      {sessionsQuery.isSuccess && list.total > 0 ? (
        <nav
          aria-label="Halaman sesi"
          className="flex flex-wrap items-center justify-between gap-2"
        >
          <p className="text-sm text-muted-foreground">
            Menampilkan {list.from}–{list.to} dari {list.total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={list.page <= 1}
              onClick={() => list.setPage(list.page - 1)}
            >
              Sebelumnya
            </Button>
            <span className="text-sm">
              Halaman {list.page} dari {list.pageCount}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={list.page >= list.pageCount}
              onClick={() => list.setPage(list.page + 1)}
            >
              Berikutnya
            </Button>
          </div>
        </nav>
      ) : null}

      {sessionsQuery.isSuccess ? (
        confirmRevokeAll ? (
          <div
            role="group"
            aria-labelledby="revoke-all-title"
            className="flex flex-col gap-3 rounded-lg border border-border p-3"
          >
            <p id="revoke-all-title" className="text-sm">
              Cabut semua sesi lain? Sesi di perangkat ini tetap aktif.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="destructive"
                disabled={busy}
                onClick={() => revokeAll.mutate()}
              >
                Ya, cabut semua sesi lain
              </Button>
              <Button
                variant="outline"
                onClick={() => setConfirmRevokeAll(false)}
              >
                Batal
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            className="self-start"
            disabled={busy || otherSessionCount === 0}
            onClick={() => setConfirmRevokeAll(true)}
          >
            Cabut semua sesi lain
          </Button>
        )
      ) : null}
    </section>
  )
}
