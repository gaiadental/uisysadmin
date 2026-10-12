/**
 * Access gate strategies (ARCH-FE-001 D6.1, D18). Each gate is a pure function
 * over the auth status and the cached `me`, so the truth table is tested
 * without a DOM. Gates combine with AND. The first gate that denies decides
 * the outcome, so list order sets precedence.
 *
 * These gates decide what the UI shows. The backend enforces every permission
 * (FE doc section 4).
 */

import type { AuthStatus } from "@/app/providers/auth-provider"
import type { Me } from "@/types/auth"

/**
 * ALLOW lets the route render. LOGIN goes to the login page. PASSWORD_CHANGE
 * goes to the change page. FORBIDDEN shows the 403 screen.
 */
export type GateResult = "ALLOW" | "LOGIN" | "PASSWORD_CHANGE" | "FORBIDDEN"

export interface GateContext {
  readonly status: AuthStatus
  readonly me: Me | null
}

export interface AccessGate {
  readonly name:
    "authenticated" | "passwordChanged" | "hasPermissions" | "hasRole"
  readonly evaluate: (context: GateContext) => GateResult
}

/**
 * A session exists. `passwordChangeRequired` counts as a session, so that
 * state reaches the change page through passwordChanged and not the login page
 * (REQ-FE-012). D6.1 names only the `authenticated` status; this reading is
 * recorded in the TODO-006 report.
 */
export function authenticated(): AccessGate {
  return {
    name: "authenticated",
    evaluate: ({ status }) =>
      status === "authenticated" || status === "passwordChangeRequired"
        ? "ALLOW"
        : "LOGIN",
  }
}

/** Denies with PASSWORD_CHANGE while `me.pwdChangeRequired` is true. */
export function passwordChanged(): AccessGate {
  return {
    name: "passwordChanged",
    evaluate: ({ me }) => {
      if (me === null) return "LOGIN"
      return me.pwdChangeRequired ? "PASSWORD_CHANGE" : "ALLOW"
    },
  }
}

/** Allows when every key is in `me.permissions`. An empty list always allows. */
export function hasPermissions(keys: readonly string[]): AccessGate {
  return {
    name: "hasPermissions",
    evaluate: ({ me }) => {
      if (me === null) return "LOGIN"
      return keys.every((key) => me.permissions.includes(key))
        ? "ALLOW"
        : "FORBIDDEN"
    },
  }
}

/** Allows when `me.role` equals the role key (D6.2). */
export function hasRole(role: string): AccessGate {
  return {
    name: "hasRole",
    evaluate: ({ me }) => {
      if (me === null) return "LOGIN"
      return me.role === role ? "ALLOW" : "FORBIDDEN"
    },
  }
}

/** Combines gates with AND. Returns the first deny, or ALLOW when none denies. */
export function evaluateGates(
  gates: readonly AccessGate[],
  context: GateContext
): GateResult {
  for (const gate of gates) {
    const result = gate.evaluate(context)
    if (result !== "ALLOW") return result
  }
  return "ALLOW"
}
