import * as React from "react"

/**
 * Router hash sederhana — tanpa dependensi eksternal.
 * Semua state hanya di sisi klien (prototype tanpa backend).
 *
 * Format hash: #/tenant, #/tenant/GAIA, #/katalog/permission, dst.
 */

export type RouteName =
  | "beranda"
  | "tenant.list"
  | "tenant.create"
  | "tenant.detail"
  | "katalog.permission"
  | "katalog.kategori"
  | "katalog.negara"
  | "tim.akun"
  | "tim.peran"
  | "sistem.event"
  | "sistem.sesi"
  | "sistem.housekeeping"
  | "sistem.audit"
  | "sistem.pengaturan"

export type Route = {
  name: RouteName
  path: string
  params: Record<string, string>
}

const ROUTE_TABLE: { name: RouteName; re: RegExp; keys: string[] }[] = [
  { name: "beranda", re: /^\/?$/, keys: [] },
  { name: "tenant.create", re: /^\/tenant\/tambah\/?$/, keys: [] },
  { name: "tenant.detail", re: /^\/tenant\/([^/]+)\/?$/, keys: ["kode"] },
  { name: "tenant.list", re: /^\/tenant\/?$/, keys: [] },
  { name: "katalog.permission", re: /^\/katalog\/permission\/?$/, keys: [] },
  { name: "katalog.kategori", re: /^\/katalog\/kategori\/?$/, keys: [] },
  { name: "katalog.negara", re: /^\/katalog\/negara\/?$/, keys: [] },
  { name: "tim.akun", re: /^\/tim\/akun\/?$/, keys: [] },
  { name: "tim.peran", re: /^\/tim\/peran\/?$/, keys: [] },
  { name: "sistem.event", re: /^\/sistem\/event\/?$/, keys: [] },
  { name: "sistem.sesi", re: /^\/sistem\/sesi\/?$/, keys: [] },
  { name: "sistem.housekeeping", re: /^\/sistem\/housekeeping\/?$/, keys: [] },
  { name: "sistem.audit", re: /^\/sistem\/audit\/?$/, keys: [] },
  { name: "sistem.pengaturan", re: /^\/sistem\/pengaturan\/?$/, keys: [] },
]

function parseHash(): Route {
  const raw = window.location.hash.replace(/^#/, "") || "/"
  const path = raw.split("?")[0]
  for (const entry of ROUTE_TABLE) {
    const m = path.match(entry.re)
    if (m) {
      const params: Record<string, string> = {}
      entry.keys.forEach(
        (k, i) => (params[k] = decodeURIComponent(m[i + 1] ?? ""))
      )
      return { name: entry.name, path, params }
    }
  }
  return { name: "beranda", path: "/", params: {} }
}

export function navigate(path: string) {
  if (window.location.hash.replace(/^#/, "") === path) return
  window.location.hash = path
}

const RouterContext = React.createContext<Route>(parseHash())

export function RouterProvider({ children }: { children: React.ReactNode }) {
  const [route, setRoute] = React.useState<Route>(parseHash)

  React.useEffect(() => {
    const onChange = () => setRoute(parseHash())
    window.addEventListener("hashchange", onChange)
    return () => window.removeEventListener("hashchange", onChange)
  }, [])

  return (
    <RouterContext.Provider value={route}>{children}</RouterContext.Provider>
  )
}

export function useRoute() {
  return React.useContext(RouterContext)
}

type LinkProps = React.ComponentProps<"a"> & { to: string }

export function Link({ to, onClick, ...props }: LinkProps) {
  return (
    <a
      href={`#${to}`}
      onClick={(e) => {
        // biarkan hash navigation bawaan bekerja; cegah hanya modifier klik baru
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
        onClick?.(e)
      }}
      {...props}
    />
  )
}

/** Bangun path dari nama route + params. */
export function pathFor(name: RouteName, params: Record<string, string> = {}) {
  switch (name) {
    case "beranda":
      return "/"
    case "tenant.list":
      return "/tenant"
    case "tenant.create":
      return "/tenant/tambah"
    case "tenant.detail":
      return `/tenant/${encodeURIComponent(params.kode ?? "")}`
    case "katalog.permission":
      return "/katalog/permission"
    case "katalog.kategori":
      return "/katalog/kategori"
    case "katalog.negara":
      return "/katalog/negara"
    case "tim.akun":
      return "/tim/akun"
    case "tim.peran":
      return "/tim/peran"
    case "sistem.event":
      return "/sistem/event"
    case "sistem.sesi":
      return "/sistem/sesi"
    case "sistem.housekeeping":
      return "/sistem/housekeeping"
    case "sistem.audit":
      return "/sistem/audit"
    case "sistem.pengaturan":
      return "/sistem/pengaturan"
  }
}
