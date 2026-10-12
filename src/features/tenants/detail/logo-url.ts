/**
 * Logo render check (ARCH-FE-001 D9, D15). A tenant logo is shown as an image
 * only when its scheme is https (http in development), checked at render
 * time. Any other value, including a malformed one, is not rendered.
 */

/** The URL to use as an image source, or null when it must not be rendered. */
export function safeLogoSrc(
  url: string | null,
  allowHttp: boolean = import.meta.env.DEV
): string | null {
  if (url === null || url.trim() === "") return null
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return null
  }
  if (parsed.protocol === "https:") return parsed.href
  if (allowHttp && parsed.protocol === "http:") return parsed.href
  return null
}
