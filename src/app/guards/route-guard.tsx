/**
 * Route guard (ARCH-FE-001 D6.1, D6.5, D10, REQ-FE-012). Maps gate outcomes to
 * redirects and status screens. The decision is a pure function
 * (`resolveRouteAccess`). `RouteGuard` only renders it and performs the
 * redirect through the `onRedirect` prop, so this file does not import the
 * router.
 *
 * `resolveRouteAccess` is also the visibility rule of the navigation config
 * (D6.3, `app/navigation.ts`). A route and its sidebar item therefore share one
 * decision.
 *
 * Auth states `unknown` (boot running) and `error` (boot failed) never
 * redirect. The session is not known to have ended (D4.2 step 4).
 */

import { useEffect, type ReactNode } from "react"

import { useAuth, type AuthStatus } from "@/app/providers/auth-provider"
import {
  ForbiddenScreen,
  NotFoundScreen,
  RouteLoadingScreen,
  ServiceUnavailableScreen,
} from "@/components/custom/status-screens"
import {
  authenticated,
  evaluateGates,
  passwordChanged,
  type AccessGate,
  type GateResult,
} from "@/lib/access/gates"
import type { Me } from "@/types/auth"

export const LOGIN_PATH = "/login"
export const PASSWORD_CHANGE_PATH = "/account/password"
export const HOME_PATH = "/"

/**
 * What a route needs. `public` needs no session. A `session` route needs the
 * Authenticated gate, and PasswordChanged unless it is `exempt`. `exempt` is
 * only for the change-password page, which stays reachable while a change is
 * required (REQ-FE-012). `gates` run after those two, in order. A `public`
 * route with `guestOnly` sends an authenticated user to the home path
 * (REQ-FE-056).
 */
export type RouteAccess =
  | { readonly kind: "public"; readonly guestOnly?: boolean }
  | {
      readonly kind: "session"
      readonly passwordChange: "enforced" | "exempt"
      readonly gates: readonly AccessGate[]
    }

type RouteDecision =
  | { readonly kind: "render" }
  | { readonly kind: "redirect"; readonly to: string }
  | { readonly kind: "forbidden" }
  | { readonly kind: "notFound" }
  | { readonly kind: "booting" }
  | { readonly kind: "unavailable" }

export interface RouteDecisionInput {
  /** The matched route, or null for a path no route matches. */
  readonly access: RouteAccess | null
  readonly status: AuthStatus
  readonly me: Me | null
}

const REDIRECT_PATH: Record<
  Exclude<GateResult, "ALLOW" | "FORBIDDEN">,
  string
> = {
  LOGIN: LOGIN_PATH,
  PASSWORD_CHANGE: PASSWORD_CHANGE_PATH,
}

/** Decides what the guard shows for one route and one auth state. */
// eslint-disable-next-line react-refresh/only-export-components -- the pure decision is shared with navigation.ts (D6.3); a split needs a file outside TODO-006 and TODO-007 scope
export function resolveRouteAccess({
  access,
  status,
  me,
}: RouteDecisionInput): RouteDecision {
  if (status === "unknown") return { kind: "booting" }
  if (status === "error") return { kind: "unavailable" }

  const isChangePage =
    access?.kind === "session" && access.passwordChange === "exempt"
  // REQ-FE-012: while a change is required, only the change page is reachable.
  // This applies to public and unknown paths too.
  if (status === "passwordChangeRequired" && !isChangePage) {
    return { kind: "redirect", to: PASSWORD_CHANGE_PATH }
  }

  if (access === null) return { kind: "notFound" }
  if (access.kind === "public") {
    if (access.guestOnly === true && status === "authenticated") {
      return { kind: "redirect", to: HOME_PATH }
    }
    return { kind: "render" }
  }

  const gates: AccessGate[] = [
    authenticated(),
    ...(access.passwordChange === "enforced" ? [passwordChanged()] : []),
    ...access.gates,
  ]
  const outcome = evaluateGates(gates, { status, me })
  if (outcome === "ALLOW") return { kind: "render" }
  if (outcome === "FORBIDDEN") return { kind: "forbidden" }
  return { kind: "redirect", to: REDIRECT_PATH[outcome] }
}

export interface RouteGuardProps {
  readonly access: RouteAccess | null
  /** Performs the redirect. The router passes a replace navigation. */
  readonly onRedirect: (to: string) => void
  readonly children: ReactNode
}

/** Renders the route when allowed. Otherwise redirects or shows a status screen. */
export function RouteGuard({ access, onRedirect, children }: RouteGuardProps) {
  const { status, me, retryBoot } = useAuth()
  const decision = resolveRouteAccess({ access, status, me })
  const redirectTo = decision.kind === "redirect" ? decision.to : null

  useEffect(() => {
    if (redirectTo !== null) onRedirect(redirectTo)
  }, [redirectTo, onRedirect])

  switch (decision.kind) {
    case "render":
      return <>{children}</>
    case "redirect":
      return null
    case "forbidden":
      return <ForbiddenScreen />
    case "notFound":
      return <NotFoundScreen />
    case "booting":
      return <RouteLoadingScreen />
    case "unavailable":
      return <ServiceUnavailableScreen onRetry={retryBoot} />
  }
}
