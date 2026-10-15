/**
 * Auth view state and session flows (ARCH-FE-001 D4.1, D4.2, D4.5, D4.6, D4.8;
 * ADR-004). The access token stays in the refresh.ts module holder. This
 * provider holds only the view status and the cached `me`.
 *
 * Route guards (TODO-006) read `status` and redirect. This provider does not
 * navigate.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { useQueryClient } from "@tanstack/react-query"

import { setPendingAuthNotice } from "@/features/auth/auth-notice"
import { isUnauthorized } from "@/lib/api/errors"
import {
  getMe,
  login as loginRequest,
  logout as logoutRequest,
  refreshSession,
} from "@/lib/api/modules/auth"
import {
  accountEndReason,
  endSession,
  getAccessToken,
  refreshAccessToken,
  setAccessToken,
  setLogoutHandler,
  type SessionEndReason,
} from "@/lib/api/refresh"
import { applyInvalidation } from "@/lib/query/invalidation"
import { queryKeys } from "@/lib/query/keys"
import type { LoginRequest, Me, PasswordChangeOutcome } from "@/types/auth"

export type AuthStatus =
  "unknown" | "error" | "anonymous" | "authenticated" | "passwordChangeRequired"

export interface AuthContextValue {
  readonly status: AuthStatus
  readonly me: Me | null
  /** Login with loginId and password only (D4.5). Resolves with the status it reached. */
  readonly login: (input: LoginRequest) => Promise<AuthStatus>
  /** Best-effort server logout, then the local session ends and other tabs are told (D4.8). */
  readonly logout: () => Promise<void>
  /** Runs the boot sequence again after an error (D4.2 step 4). */
  readonly retryBoot: () => void
  /** Reloads `me` after a change that alters it, such as a kept-session password change. */
  readonly refreshMe: () => Promise<AuthStatus>
  /** Applies the outcome of change-password (D4.6). */
  readonly completePasswordChange: (
    outcome: PasswordChangeOutcome
  ) => Promise<AuthStatus>
}

interface AuthView {
  readonly status: AuthStatus
  readonly me: Me | null
}

const UNKNOWN_VIEW: AuthView = { status: "unknown", me: null }
const ANONYMOUS_VIEW: AuthView = { status: "anonymous", me: null }
const ERROR_VIEW: AuthView = { status: "error", me: null }

/** D4.8 step 3: the only message on this channel. It carries no token. */
const SESSION_CHANNEL = "sp-session"
const LOGOUT_SIGNAL = "logout"

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { readonly children: ReactNode }) {
  const queryClient = useQueryClient()
  const [view, setView] = useState<AuthView>(UNKNOWN_VIEW)
  const channelRef = useRef<BroadcastChannel | null>(null)
  // True when an endSession ran during the current boot, for any reason. The
  // boot `me` can reject with CancelledError after that end, so boot reads this
  // flag instead of the error alone (REQ-FE-055, TODO-024 UT024-OQ5).
  const bootEndedRef = useRef(false)

  // Ends this tab's session without a server call and without a signal.
  // Used by logout, by a forced end and by a signal from another tab.
  const endLocalSession = useCallback(() => {
    setAccessToken(null)
    void applyInvalidation(queryClient, { kind: "logout" })
    setView(ANONYMOUS_VIEW)
  }, [queryClient])

  // Ends this tab's session and tells the other tabs to end theirs. An account
  // state passes its reason. The notice is stored first, so the login page
  // reads it when the view changes (D4.11, REQ-FE-055). The boot flag is set for
  // every end, so a boot that ends the session is anonymous (TODO-024).
  const endAndAnnounce = useCallback(
    (reason?: SessionEndReason) => {
      bootEndedRef.current = true
      if (reason !== undefined) {
        setPendingAuthNotice(reason)
      }
      endLocalSession()
      channelRef.current?.postMessage({ type: LOGOUT_SIGNAL })
    },
    [endLocalSession]
  )

  // Registers the logout callback with the refresh module (D4.3). Also listens
  // for logout signals from other tabs. The listener never signals back.
  useEffect(() => {
    setLogoutHandler(endAndAnnounce)
    const channel = openSessionChannel(endLocalSession)
    channelRef.current = channel
    return () => {
      setLogoutHandler(null)
      channelRef.current = null
      channel?.close()
    }
  }, [endAndAnnounce, endLocalSession])

  const loadMe = useCallback(
    () =>
      queryClient.fetchQuery({
        queryKey: queryKeys.auth.me(),
        queryFn: getMe,
        staleTime: 0,
      }),
    [queryClient]
  )

  // Boot (D4.2): refresh once, then `me`. Under StrictMode both effect runs
  // share the refresh and the `me` fetch. An account state ends the session
  // once, whichever call raised it: a refresh error ends it in refresh.ts, and
  // a `me` error ends it here (REQ-FE-055).
  const bootSession = useCallback(async (): Promise<AuthView> => {
    bootEndedRef.current = false
    try {
      const token = await refreshAccessToken(null, refreshSession)
      if (token === null) return ANONYMOUS_VIEW
      try {
        return viewOf(await loadMe())
      } catch (error) {
        // StrictMode runs this boot twice and both runs see this error. The
        // first run ends the session and clears the token, so the second run
        // skips the end and does not announce or call the handler again.
        // A `me` 401 with any code ends the session the way a refresh 401 does,
        // with no notice (D4.2, TODO-024). Only a 401 that survived the transport
        // refresh gets here.
        const reason = accountEndReason(error)
        if (getAccessToken() !== null) {
          if (reason !== null) endSession(reason)
          else if (isUnauthorized(error)) endSession()
        }
        throw error
      }
    } catch (error) {
      // A session end during this boot wins over the error. The cache clear of
      // that end cancels `me`, so the error may be a CancelledError.
      if (bootEndedRef.current) return ANONYMOUS_VIEW
      return bootFailureView(error)
    }
  }, [loadMe])

  useEffect(() => {
    let cancelled = false
    void bootSession().then((next) => {
      if (!cancelled) setView(next)
    })
    return () => {
      cancelled = true
    }
  }, [bootSession])

  const retryBoot = useCallback(() => {
    setView(UNKNOWN_VIEW)
    void bootSession().then(setView)
  }, [bootSession])

  // D4.5: no tenant field. The token is set first, then `me` is loaded. A
  // failed `me` clears the token, so no half-open session is left behind.
  const login = useCallback(
    async (input: LoginRequest): Promise<AuthStatus> => {
      const { accessToken } = await loginRequest(input)
      setAccessToken(accessToken)
      try {
        const next = viewOf(await loadMe())
        await applyInvalidation(queryClient, { kind: "login" })
        setView(next)
        return next.status
      } catch (error) {
        setAccessToken(null)
        throw error
      }
    },
    [loadMe, queryClient]
  )

  // D4.8: the server call comes first, and its result is ignored. Then the
  // local session ends and the other tabs are told.
  const logout = useCallback(async (): Promise<void> => {
    await logoutRequest()
    endAndAnnounce()
  }, [endAndAnnounce])

  // A kept-session password change reloads `me` (D4.6). An account state here
  // ends the session the way boot does (REQ-FE-055). The rejection then stops
  // the change-password page from continuing. A refresh inside this call may
  // have ended the session already (refresh.ts clears the token), so the guard
  // skips the second end and announcement, as at boot.
  const refreshMe = useCallback(async (): Promise<AuthStatus> => {
    let next: AuthView
    try {
      next = viewOf(await loadMe())
    } catch (error) {
      const reason = accountEndReason(error)
      if (reason !== null && getAccessToken() !== null) endSession(reason)
      throw error
    }
    setView(next)
    return next.status
  }, [loadMe])

  // D4.6: a kept session takes the rotated token and reloads `me`. An ended
  // session behaves like a logout.
  const completePasswordChange = useCallback(
    async (outcome: PasswordChangeOutcome): Promise<AuthStatus> => {
      if (outcome.kind === "PASSWORD_CHANGED") {
        endAndAnnounce()
        return "anonymous"
      }
      await applyInvalidation(queryClient, {
        kind: "changePassword",
        keepCurrentSession: true,
      })
      setAccessToken(outcome.accessToken)
      return refreshMe()
    },
    [endAndAnnounce, queryClient, refreshMe]
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      status: view.status,
      me: view.me,
      login,
      logout,
      retryBoot,
      refreshMe,
      completePasswordChange,
    }),
    [view, login, logout, retryBoot, refreshMe, completePasswordChange]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/** Reads the auth view state. Must be used inside AuthProvider. */
// eslint-disable-next-line react-refresh/only-export-components -- the hook reads AuthContext, which stays private to this file; a split needs a file outside TODO-005 scope
export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext)
  if (value === null) {
    throw new Error("useAuth must be used inside AuthProvider.")
  }
  return value
}

function viewOf(me: Me): AuthView {
  return {
    status: me.pwdChangeRequired ? "passwordChangeRequired" : "authenticated",
    me,
  }
}

/**
 * The boot view for a failed refresh or `me`. An expired session and an account
 * state both show the login page (the account notice is already stored). Any
 * other failure is the error screen (D4.2 step 4).
 */
function bootFailureView(error: unknown): AuthView {
  return isUnauthorized(error) || accountEndReason(error) !== null
    ? ANONYMOUS_VIEW
    : ERROR_VIEW
}

/** Opens the session channel where BroadcastChannel exists. Returns null otherwise. */
function openSessionChannel(
  onLogoutSignal: () => void
): BroadcastChannel | null {
  if (typeof BroadcastChannel === "undefined") return null
  const channel = new BroadcastChannel(SESSION_CHANNEL)
  channel.onmessage = (event: MessageEvent<unknown>) => {
    if (isLogoutSignal(event.data)) onLogoutSignal()
  }
  return channel
}

function isLogoutSignal(data: unknown): boolean {
  return (
    typeof data === "object" &&
    data !== null &&
    "type" in data &&
    data.type === LOGOUT_SIGNAL
  )
}
