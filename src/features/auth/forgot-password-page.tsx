/**
 * Forgot password (`/forgot-password`; ARCH-FE-001 D4.7, FE doc 3.3). Every
 * outcome except a validation error shows the same neutral text, so the page
 * never reveals whether the account exists.
 */

import { useState } from "react"

import { FormAlert } from "@/components/custom/form-alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { forgotPassword } from "@/lib/api/modules/auth"
import { useZodForm } from "@/lib/forms/zod-form"
import { routeMeta } from "@/lib/routes-meta"

import {
  classifyForgotError,
  FORGOT_NEUTRAL_MESSAGE,
  type FailureNotice,
} from "./auth-messages"
import { AppLink } from "./components/app-link"
import { AuthCard } from "./components/auth-card"
import { FieldError } from "./components/field-error"
import { forgotPasswordSchema } from "./schema"

const FORGOT_META = routeMeta["auth.forgot-password"]

export function ForgotPasswordPage() {
  const form = useZodForm(forgotPasswordSchema, { loginId: "" })
  const { errors, isSubmitting } = form.formState
  const [validation, setValidation] = useState<FailureNotice | null>(null)
  const [neutral, setNeutral] = useState(false)

  const onSubmit = form.handleSubmit(async ({ loginId }) => {
    setValidation(null)
    setNeutral(false)
    try {
      await forgotPassword(loginId)
      setNeutral(true)
    } catch (error) {
      const outcome = classifyForgotError(error)
      if (outcome.kind === "validation") {
        setValidation({
          message: outcome.message,
          referenceId: outcome.referenceId,
        })
      } else {
        setNeutral(true)
      }
    }
  })

  return (
    <AuthCard title={FORGOT_META.title} description={FORGOT_META.description}>
      <FormAlert
        message={validation?.message ?? null}
        referenceId={validation?.referenceId ?? null}
      />

      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="forgot-login-id">Login ID</Label>
          <Input
            id="forgot-login-id"
            type="text"
            inputMode="email"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            aria-invalid={errors.loginId !== undefined}
            aria-describedby={
              errors.loginId ? "forgot-login-id-error" : undefined
            }
            {...form.register("loginId")}
          />
          <FieldError
            id="forgot-login-id-error"
            message={errors.loginId?.message}
          />
        </div>

        <Button type="submit" disabled={isSubmitting}>
          Kirim link reset
        </Button>
      </form>

      {neutral ? (
        <p role="status" className="text-sm text-foreground">
          {FORGOT_NEUTRAL_MESSAGE}
        </p>
      ) : null}

      <AppLink to="/login">Kembali ke halaman masuk</AppLink>
    </AuthCard>
  )
}
