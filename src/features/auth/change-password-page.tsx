/**
 * Change password (`/account/password`; ARCH-FE-001 D4.6, FE doc 3.3). The
 * page serves the forced change (`passwordChangeRequired`) and the voluntary
 * one. Both `keepCurrentSession` outcomes are handled:
 *  - true: the rotated token replaces the stored one (completePasswordChange),
 *    and the forced change ends on the landing page;
 *  - false: every session ends, so the user is sent to login with a notice.
 *
 * Error placement follows D4.6: a wrong current password and a policy failure
 * sit under their field, and a validation failure is a form alert. A 401 here
 * never refreshes (D4.4), which the HTTP client enforces.
 */

import { useState } from "react"

import { useAuth } from "@/app/providers/auth-provider"
import { navigateTo } from "@/app/router"
import { FormAlert } from "@/components/custom/form-alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { changePassword as changePasswordRequest } from "@/lib/api/modules/auth"
import { useZodForm } from "@/lib/forms/zod-form"
import { routeMeta } from "@/lib/routes-meta"

import {
  classifyChangePasswordError,
  type FailureNotice,
} from "./auth-messages"
import { setPendingAuthNotice } from "./auth-notice"
import { AuthCard } from "./components/auth-card"
import { FieldError } from "./components/field-error"
import { changePasswordSchema } from "./schema"

const CHANGE_META = routeMeta["auth.change-password"]

const DEFAULT_VALUES = {
  currentPassword: "",
  newPassword: "",
  newPasswordConfirmation: "",
  keepCurrentSession: true,
} as const

export function ChangePasswordPage() {
  const auth = useAuth()
  const forced = auth.status === "passwordChangeRequired"

  const form = useZodForm(changePasswordSchema, { ...DEFAULT_VALUES })
  const { errors, isSubmitting } = form.formState
  const [alert, setAlert] = useState<FailureNotice | null>(null)
  const [saved, setSaved] = useState(false)

  const onSubmit = form.handleSubmit(async (values) => {
    setAlert(null)
    setSaved(false)
    try {
      const outcome = await changePasswordRequest({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
        newPasswordConfirmation: values.newPasswordConfirmation,
        keepCurrentSession: values.keepCurrentSession,
      })
      if (outcome.kind === "PASSWORD_CHANGED") {
        // Set before the session ends, so the login page can show it on arrival.
        setPendingAuthNotice("passwordChanged")
      }
      await auth.completePasswordChange(outcome)
      if (outcome.kind === "SESSION_KEPT") {
        if (forced) {
          navigateTo("/", { replace: true })
        } else {
          form.reset({ ...DEFAULT_VALUES })
          setSaved(true)
        }
      }
    } catch (error) {
      const failure = classifyChangePasswordError(error)
      if (failure.kind === "currentPassword") {
        form.setError("currentPassword", {
          type: "server",
          message: failure.message,
        })
      } else if (failure.kind === "newPassword") {
        form.setError("newPassword", {
          type: "server",
          message: failure.message,
        })
      } else {
        setAlert({ message: failure.message, referenceId: failure.referenceId })
      }
    }
  })

  return (
    <AuthCard
      title={CHANGE_META.title}
      description={
        forced
          ? "Anda harus mengubah password sebelum dapat melanjutkan."
          : CHANGE_META.description
      }
    >
      <FormAlert
        message={alert?.message ?? null}
        referenceId={alert?.referenceId ?? null}
      />

      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="current-password">Password saat ini</Label>
          <Input
            id="current-password"
            type="password"
            autoComplete="current-password"
            aria-invalid={errors.currentPassword !== undefined}
            aria-describedby={
              errors.currentPassword ? "current-password-error" : undefined
            }
            {...form.register("currentPassword")}
          />
          <FieldError
            id="current-password-error"
            message={errors.currentPassword?.message}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new-password">Password baru</Label>
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            aria-invalid={errors.newPassword !== undefined}
            aria-describedby={
              errors.newPassword ? "new-password-error" : undefined
            }
            {...form.register("newPassword")}
          />
          <FieldError
            id="new-password-error"
            message={errors.newPassword?.message}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new-password-confirmation">
            Konfirmasi password baru
          </Label>
          <Input
            id="new-password-confirmation"
            type="password"
            autoComplete="new-password"
            aria-invalid={errors.newPasswordConfirmation !== undefined}
            aria-describedby={
              errors.newPasswordConfirmation
                ? "new-password-confirmation-error"
                : undefined
            }
            {...form.register("newPasswordConfirmation")}
          />
          <FieldError
            id="new-password-confirmation-error"
            message={errors.newPasswordConfirmation?.message}
          />
        </div>

        <div className="flex items-start gap-2">
          <input
            id="keep-current-session"
            type="checkbox"
            className="mt-0.5 size-4 accent-primary"
            aria-describedby="keep-current-session-hint"
            {...form.register("keepCurrentSession")}
          />
          <div className="flex flex-col gap-0.5">
            <Label htmlFor="keep-current-session">
              Tetap masuk di sesi ini
            </Label>
            <p
              id="keep-current-session-hint"
              className="text-xs text-muted-foreground"
            >
              Jika tidak dicentang, semua sesi, termasuk sesi ini, diakhiri dan
              Anda harus masuk lagi.
            </p>
          </div>
        </div>

        <Button type="submit" disabled={isSubmitting}>
          Simpan password
        </Button>
      </form>

      {saved ? (
        <p role="status" className="text-sm text-foreground">
          Password berhasil diubah.
        </p>
      ) : null}

      {forced ? (
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            void auth.logout()
          }}
        >
          Keluar
        </Button>
      ) : null}
    </AuthCard>
  )
}
