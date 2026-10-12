/**
 * Reset password (`/reset-password`; ARCH-FE-001 D4.7, FE doc 3.3). The page
 * reads `token` from the query string once, then replaces the URL with the
 * same path and no query, so the token leaves the address bar and history. The
 * token is never logged or stored.
 *
 * With no token, or with a token the server rejects, the page shows the
 * invalid-link message and a link to forgot password. While the request is in
 * flight the submit control is disabled (SP-BG-11).
 */

import { useEffect, useState } from "react"

import { navigateTo } from "@/app/router"
import { FormAlert } from "@/components/custom/form-alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { resetPassword } from "@/lib/api/modules/auth"
import { useZodForm } from "@/lib/forms/zod-form"
import { routeMeta } from "@/lib/routes-meta"

import {
  classifyResetError,
  RESET_INVALID_LINK_MESSAGE,
  type FailureNotice,
} from "./auth-messages"
import { setPendingAuthNotice } from "./auth-notice"
import { AppLink } from "./components/app-link"
import { AuthCard } from "./components/auth-card"
import { FieldError } from "./components/field-error"
import { resetPasswordSchema } from "./schema"

const RESET_META = routeMeta["auth.reset-password"]
const TOKEN_PARAM = "token"

/** Reads the token from the query string. Changes nothing. */
function readResetToken(): string {
  return (
    new URLSearchParams(window.location.search).get(TOKEN_PARAM) ?? ""
  ).trim()
}

/** Removes the query string from the address bar (D4.7). Does nothing when there is no query. */
function removeQueryFromAddressBar(): void {
  if (window.location.search === "") return
  window.history.replaceState(null, "", window.location.pathname)
}

export function ResetPasswordPage() {
  // A state initializer reads the token once per mount. The URL is cleaned up
  // in an effect, which StrictMode may run twice without harm.
  const [token] = useState(readResetToken)
  useEffect(() => {
    removeQueryFromAddressBar()
  }, [])

  const form = useZodForm(resetPasswordSchema, {
    newPassword: "",
    newPasswordConfirmation: "",
  })
  const { errors, isSubmitting } = form.formState
  const [alert, setAlert] = useState<FailureNotice | null>(null)
  const [invalidLink, setInvalidLink] = useState<{
    readonly referenceId: string | null
  } | null>(null)

  const hasToken = token !== ""
  const showInvalidLink = !hasToken || invalidLink !== null

  const onSubmit = form.handleSubmit(async (values) => {
    setAlert(null)
    try {
      await resetPassword({
        resetToken: token,
        newPassword: values.newPassword,
        newPasswordConfirmation: values.newPasswordConfirmation,
      })
      setPendingAuthNotice("passwordReset")
      navigateTo("/login", { replace: true })
    } catch (error) {
      const outcome = classifyResetError(error)
      if (outcome.kind === "invalidToken") {
        setInvalidLink({ referenceId: outcome.referenceId })
      } else if (outcome.kind === "policy") {
        form.setError("newPassword", {
          type: "server",
          message: outcome.message,
        })
      } else {
        setAlert({ message: outcome.message, referenceId: outcome.referenceId })
      }
    }
  })

  return (
    <AuthCard title={RESET_META.title} description={RESET_META.description}>
      {showInvalidLink ? (
        <FormAlert
          message={RESET_INVALID_LINK_MESSAGE}
          referenceId={invalidLink?.referenceId ?? null}
        >
          <AppLink to="/forgot-password">Minta tautan atur ulang baru</AppLink>
        </FormAlert>
      ) : (
        <>
          <FormAlert
            message={alert?.message ?? null}
            referenceId={alert?.referenceId ?? null}
          />

          <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="reset-new-password">Password baru</Label>
              <Input
                id="reset-new-password"
                type="password"
                autoComplete="new-password"
                aria-invalid={errors.newPassword !== undefined}
                aria-describedby={
                  errors.newPassword ? "reset-new-password-error" : undefined
                }
                {...form.register("newPassword")}
              />
              <FieldError
                id="reset-new-password-error"
                message={errors.newPassword?.message}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="reset-confirmation">
                Konfirmasi password baru
              </Label>
              <Input
                id="reset-confirmation"
                type="password"
                autoComplete="new-password"
                aria-invalid={errors.newPasswordConfirmation !== undefined}
                aria-describedby={
                  errors.newPasswordConfirmation
                    ? "reset-confirmation-error"
                    : undefined
                }
                {...form.register("newPasswordConfirmation")}
              />
              <FieldError
                id="reset-confirmation-error"
                message={errors.newPasswordConfirmation?.message}
              />
            </div>

            <Button type="submit" disabled={isSubmitting}>
              Simpan password baru
            </Button>
          </form>
        </>
      )}
    </AuthCard>
  )
}
