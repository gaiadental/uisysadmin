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

import { isUnauthorized } from "@/lib/api/errors"
import {
  getMe,
  login as loginRequest,
  logout as logoutRequest,
  refreshSession,
} from "@/lib/api/modules/auth"
import {
  refreshAccessToken,
  setAccessToken,
  setLogoutHandler,
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

  // Ends this tab's session without a server call and without a signal.
  // Used by logout, by a forced end and by a signal from another tab.
  const endLocalSession = useCallback(() => {
    setAccessToken(null)
    void applyInvalidation(queryClient, { kind: "logout" })
    setView(ANONYMOUS_VIEW)
  }, [queryClient])

  // Ends this tab's session and tells the other tabs to end theirs.
  const endAndAnnounce = useCallback(() => {
    endLocalSession()
    channelRef.current?.postMessage({ type: LOGOUT_SIGNAL })
  }, [endLocalSession])

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
  // share the refresh and the `me` fetch.
  const bootSession = useCallback(async (): Promise<AuthView> => {
    try {
      const token = await refreshAccessToken(null, refreshSession)
      if (token === null) return ANONYMOUS_VIEW
      return viewOf(await loadMe())
    } catch (error) {
      return isUnauthorized(error) ? ANONYMOUS_VIEW : ERROR_VIEW
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

  const refreshMe = useCallback(async (): Promise<AuthStatus> => {
    const next = viewOf(await loadMe())
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
