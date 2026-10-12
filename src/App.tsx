/**
 * Picks the layout from the session state and renders the router (ARCH-FE-001
 * D10). A signed-in user gets the authenticated shell. Anyone else, including
 * a user whose state is still being checked, gets the public layout. The route
 * guard decides what each route shows.
 */

import { useEffect, useRef } from "react"

import { LOGIN_PATH } from "@/app/guards/route-guard"
import { AuthenticatedLayout } from "@/app/layouts/authenticated-layout"
import { PublicLayout } from "@/app/layouts/public-layout"
import { useAuth } from "@/app/providers/auth-provider"
import { AppRouter, navigateTo, splitHref, useLocationHref } from "@/app/router"

const ROOT_PATH = "/"

/** After a route change, focus goes to the page heading (ARCH-FE-001 D16). */
function focusPageHeading(): void {
  const heading = document.querySelector<HTMLElement>("main h1")
  if (heading === null) return
  if (!heading.hasAttribute("tabindex")) heading.setAttribute("tabindex", "-1")
  heading.focus()
}

export default function App() {
  const { status } = useAuth()
  const { pathname } = splitHref(useLocationHref())
  const lastPathRef = useRef(pathname)

  useEffect(() => {
    if (lastPathRef.current === pathname) return
    lastPathRef.current = pathname
    focusPageHeading()
  }, [pathname])

  // A signed-out visitor at the root path goes to login. The root route is the dashboard.
  const signedOutAtRoot = pathname === ROOT_PATH && status === "anonymous"
  useEffect(() => {
    if (signedOutAtRoot) navigateTo(LOGIN_PATH, { replace: true })
  }, [signedOutAtRoot])

  if (status === "authenticated" || status === "passwordChangeRequired") {
    return (
      <AuthenticatedLayout>
        <AppRouter />
      </AuthenticatedLayout>
    )
  }

  return <PublicLayout>{signedOutAtRoot ? null : <AppRouter />}</PublicLayout>
}
