/**
 * Login (`/login`; ARCH-FE-001 D4.5, FE doc 3.3). The form sends loginId and
 * password only (no tenant field). A 429 locks the submit button for 60
 * seconds with a visible countdown. After a successful login the page sends
 * the user on: to the password change when one is required (REQ-FE-012), or
 * to the landing page.
 */

import { IconEye, IconEyeOff } from "@tabler/icons-react"
import { useEffect, useState } from "react"

import { PASSWORD_CHANGE_PATH } from "@/app/guards/route-guard"
import { navigateTo } from "@/app/router"
import { useAuth } from "@/app/providers/auth-provider"
import { FormAlert } from "@/components/custom/form-alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useZodForm } from "@/lib/forms/zod-form"
import { cn } from "@/lib/utils"
import { routeMeta } from "@/lib/routes-meta"

import {
  classifyLoginError,
  LOGIN_CREDENTIALS_MESSAGE,
  LOGIN_LOCK_SECONDS,
  LOGIN_RATE_LIMIT_MESSAGE,
  noticeText,
  type LoginFailure,
} from "./auth-messages"
import {
  clearPendingAuthNotice,
  peekPendingAuthNotice,
  type AuthNotice,
} from "./auth-notice"
import { AppLink } from "./components/app-link"
import { FieldError } from "./components/field-error"
import { LoginLogo, LoginShell } from "./components/login-shell"
import { loginSchema } from "./schema"
import { useCountdown } from "./use-countdown"

const LOGIN_META = routeMeta["auth.login"]

const FIELD_CLASS =
  "h-10 rounded-xl border-slate-500 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-500"

export function LoginPage() {
  const auth = useAuth()
  // Read once on mount, then cleared. The initializer only reads, so a second
  // StrictMode run sees the same notice.
  const [notice] = useState<AuthNotice | null>(peekPendingAuthNotice)
  useEffect(() => {
    clearPendingAuthNotice()
  }, [])

  const form = useZodForm(loginSchema, { loginId: "", password: "" })
  const { errors, isSubmitting } = form.formState
  const [failure, setFailure] = useState<LoginFailure | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const lock = useCountdown()
  const locked = lock.remaining > 0

  const onSubmit = form.handleSubmit(async (values) => {
    setFailure(null)
    try {
      const status = await auth.login(values)
      navigateTo(
        status === "passwordChangeRequired" ? PASSWORD_CHANGE_PATH : "/",
        { replace: true }
      )
    } catch (error) {
      const outcome = classifyLoginError(error)
      setFailure(outcome)
      // The login ID is kept. The password is cleared on a wrong credential (D4.5).
      if (outcome.kind === "credentials") form.setValue("password", "")
      if (outcome.kind === "rateLimited") lock.start(LOGIN_LOCK_SECONDS)
    }
  })

  const alert = failureAlert(failure)

  return (
    <LoginShell>
      <div className="flex flex-col gap-6">
        <LoginLogo />

        <header className="flex flex-col gap-2 text-center">
          <h1 className="font-heading text-[28px] leading-tight font-bold text-slate-900">
            {LOGIN_META.title}
          </h1>
          <p className="text-sm text-slate-600">{LOGIN_META.description}</p>
        </header>

        {notice !== null ? (
          <p
            role="status"
            className="rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground"
          >
            {noticeText(notice)}
          </p>
        ) : null}

        <FormAlert message={alert.message} referenceId={alert.referenceId} />

        <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="login-id" className="text-sm text-slate-900">
              Email atau telepon
            </Label>
            <Input
              id="login-id"
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="Masukkan email sysadmin"
              className={FIELD_CLASS}
              aria-invalid={errors.loginId !== undefined}
              aria-describedby={errors.loginId ? "login-id-error" : undefined}
              {...form.register("loginId")}
            />
            <FieldError id="login-id-error" message={errors.loginId?.message} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="login-password" className="text-sm text-slate-900">
              Kata sandi
            </Label>
            <div className="relative">
              <Input
                id="login-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Masukkan kata sandi"
                className={cn(FIELD_CLASS, "pr-11")}
                aria-invalid={errors.password !== undefined}
                aria-describedby={
                  errors.password ? "login-password-error" : undefined
                }
                {...form.register("password")}
              />
              <button
                type="button"
                aria-label={
                  showPassword
                    ? "Sembunyikan kata sandi"
                    : "Tampilkan kata sandi"
                }
                aria-pressed={showPassword}
                onClick={() => setShowPassword((visible) => !visible)}
                className="absolute inset-y-0 right-1 my-auto flex size-9 items-center justify-center rounded-lg text-slate-600 outline-none hover:text-slate-900 focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {showPassword ? (
                  <IconEyeOff className="size-5" aria-hidden="true" />
                ) : (
                  <IconEye className="size-5" aria-hidden="true" />
                )}
              </button>
            </div>
            <FieldError
              id="login-password-error"
              message={errors.password?.message}
            />
            <div className="flex justify-end">
              <AppLink to="/forgot-password" className="text-teal-700">
                Lupa kata sandi?
              </AppLink>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || locked}
            className="mt-2 h-10 rounded-xl border-0 bg-gradient-to-b from-[#5f9ea0] to-[#2c6a69] text-sm font-semibold text-white shadow-md inset-shadow-[0_1px_0_rgb(255_255_255/0.35)] shadow-teal-900/25 hover:brightness-110"
          >
            {locked ? `Coba lagi dalam ${lock.remaining} detik` : "Lanjutkan"}
          </Button>
        </form>
      </div>
    </LoginShell>
  )
}

/** The form alert for a login failure. The lock needs no text of its own: the button shows the countdown. */
function failureAlert(failure: LoginFailure | null): {
  readonly message: string | null
  readonly referenceId: string | null
} {
  if (failure === null) return { message: null, referenceId: null }
  switch (failure.kind) {
    case "credentials":
      return { message: LOGIN_CREDENTIALS_MESSAGE, referenceId: null }
    case "rateLimited":
      return { message: LOGIN_RATE_LIMIT_MESSAGE, referenceId: null }
    case "notice":
      return { message: failure.message, referenceId: failure.referenceId }
  }
}
