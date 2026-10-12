import type { ReactNode } from "react"

// Drop-in assets. Put a photo at src/assets/login/background.(jpg|png|webp)
// and a logo at src/assets/login/logo.(svg|png|webp). The glob returns nothing
// until a file exists, so a missing file never causes a 404.
const BACKGROUND_FILES = import.meta.glob<string>(
  "/src/assets/login/background.{jpg,jpeg,png,webp,avif}",
  { eager: true, query: "?url", import: "default" }
)
const LOGO_FILES = import.meta.glob<string>(
  "/src/assets/login/logo.{svg,png,webp}",
  { eager: true, query: "?url", import: "default" }
)

const BACKGROUND_SRC = Object.values(BACKGROUND_FILES)[0]
const LOGO_SRC = Object.values(LOGO_FILES)[0]

/** Full-viewport teal backdrop with the optional photo under a teal wash, and the card centred on it. */
export function LoginShell({ children }: { readonly children: ReactNode }) {
  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-teal-800 px-4 py-10">
      {BACKGROUND_SRC !== undefined ? (
        <img
          src={BACKGROUND_SRC}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 size-full object-cover"
        />
      ) : null}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-teal-800/85"
      />
      <div className="relative w-full max-w-[376px] rounded-[28px] bg-white px-7 py-8 shadow-2xl shadow-black/30">
        {children}
      </div>
    </div>
  )
}

/** The brand logo from src/assets/login, or a plain text wordmark until one is added. */
export function LoginLogo() {
  if (LOGO_SRC !== undefined) {
    return (
      <img
        src={LOGO_SRC}
        alt="GAIA Dental Clinic"
        className="mx-auto h-14 w-auto"
      />
    )
  }
  return (
    <div className="mx-auto flex w-fit flex-col items-center text-teal-900">
      <span className="font-heading text-4xl leading-none font-medium tracking-[0.3em] indent-[0.3em]">
        GAIA
      </span>
      <span className="mt-1 text-[11px] tracking-[0.2em] indent-[0.2em]">
        DENTAL CLINIC
      </span>
    </div>
  )
}
