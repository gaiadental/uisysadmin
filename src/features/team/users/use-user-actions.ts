/**
 * The confirmed actions on a system user: suspend, deactivate, reactivate
 * and reset password (REQ-FE-039, REQ-FE-054; ARCH-FE-001 D6.4, D12.1). Suspend,
 * deactivate and reset password ask first; reactivate does not. One
 * action runs at a time, and the in-flight guard is a ref, so a double click
 * cannot send two requests (create-like sends are not idempotent, SP-BG-11).
 * Every success invalidates the system user keys through the D12.1 map.
 */

import { useCallback, useRef, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { useDialogs, type ConfirmRequest } from "@/components/dialogs/dialogs"
import type { WriteFailure } from "@/features/tenants/create/write-failure"
import {
  changeSystemUserStatus,
  resetSystemUserPassword,
} from "@/lib/api/modules/system-users"
import { applyInvalidation } from "@/lib/query/invalidation"
import type { SystemUser } from "@/types/system-user"

import { describeUserWriteFailure } from "./user-failure"

export type UserActionKind =
  "suspend" | "deactivate" | "reactivate" | "resetPassword"

export interface PendingAction {
  readonly userId: string
  readonly kind: UserActionKind
}

export const RESET_PASSWORD_SUCCESS =
  "Password sementara sudah dikirim ke e-mail user."

function confirmFor(
  kind: UserActionKind,
  user: SystemUser
): ConfirmRequest | null {
  switch (kind) {
    case "suspend":
      return {
        title: `Tangguhkan akun ${user.loginId}?`,
        description:
          "Blokir sementara akun ini, misalnya saat cuti atau investigasi. Semua sesinya diakhiri. Bisa diaktifkan kembali.",
        confirmLabel: "Tangguhkan",
        tone: "destructive",
      }
    case "deactivate":
      return {
        title: `Nonaktifkan akun ${user.loginId}?`,
        description:
          "Untuk anggota yang sudah tidak bertugas. Semua sesinya diakhiri. Bisa diaktifkan kembali bila diperlukan.",
        confirmLabel: "Nonaktifkan",
        tone: "destructive",
      }
    case "resetPassword":
      return {
        title: `Reset password ${user.loginId}?`,
        description:
          "Password sementara akan dikirim ke e-mail user. Password lama tidak berlaku lagi.",
        confirmLabel: "Reset password",
        tone: "default",
      }
    case "reactivate":
      return null
  }
}

export interface UserActions {
  readonly run: (kind: UserActionKind, user: SystemUser) => Promise<void>
  readonly pending: PendingAction | null
  readonly failure: WriteFailure | null
  readonly clearFailure: () => void
}

export function useUserActions(): UserActions {
  const queryClient = useQueryClient()
  const { confirm } = useDialogs()
  const [pending, setPending] = useState<PendingAction | null>(null)
  const [failure, setFailure] = useState<WriteFailure | null>(null)
  const inFlight = useRef(false)

  const run = useCallback(
    async (kind: UserActionKind, user: SystemUser) => {
      if (inFlight.current) return
      setFailure(null)
      const request = confirmFor(kind, user)
      if (request !== null && !(await confirm(request))) return
      if (inFlight.current) return
      inFlight.current = true
      setPending({ userId: user.id, kind })
      try {
        switch (kind) {
          case "suspend":
            await changeSystemUserStatus(user.id, "SUSPENDED")
            toast.success("Akun ditangguhkan.")
            break
          case "deactivate":
            await changeSystemUserStatus(user.id, "DEACTIVATED")
            toast.success("Akun dinonaktifkan.")
            break
          case "reactivate":
            await changeSystemUserStatus(user.id, "ACTIVE")
            toast.success("Akun diaktifkan kembali.")
            break
          case "resetPassword":
            await resetSystemUserPassword(user.id)
            toast.success(RESET_PASSWORD_SUCCESS)
            break
        }
        await applyInvalidation(queryClient, {
          kind: "systemUserWrite",
          userId: user.id,
        })
      } catch (error) {
        setFailure(describeUserWriteFailure(error))
      } finally {
        inFlight.current = false
        setPending(null)
      }
    },
    [confirm, queryClient]
  )

  const clearFailure = useCallback(() => setFailure(null), [])
  return { run, pending, failure, clearFailure }
}
