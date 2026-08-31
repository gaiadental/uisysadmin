/** Utilitas format — semua keluaran ditujukan untuk ditampilkan `font-mono`. */

const NOW = new Date("2026-08-29T10:00:00Z").getTime()

/** Waktu relatif ringkas: "3h lalu", "2mgg lalu", "5bln lalu". */
export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime()
  const diff = NOW - then
  const s = Math.round(diff / 1000)
  if (s < 60) return `${s}d lalu`
  const m = Math.round(s / 60)
  if (m < 60) return `${m}m lalu`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}j lalu`
  const d = Math.round(h / 24)
  if (d < 14) return `${d}h lalu`
  const w = Math.round(d / 7)
  if (w < 9) return `${w}mgg lalu`
  const mo = Math.round(d / 30)
  if (mo < 24) return `${mo}bln lalu`
  const y = Math.round(d / 365)
  return `${y}thn lalu`
}

/** Tanggal absolut: "2024-02-11". */
export function isoDate(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10)
}

/** Tanggal + jam: "2024-02-11 03:12". */
export function isoDateTime(iso: string): string {
  return new Date(iso).toISOString().slice(0, 16).replace("T", " ")
}

/** Ukuran penyimpanan dari MB. */
export function storageSize(mb: number): string {
  if (mb < 1024) return `${mb.toFixed(0)} MB`
  return `${(mb / 1024).toFixed(1)} GB`
}

/** Angka dengan pemisah ribuan (tabular). */
export function num(n: number): string {
  return n.toLocaleString("id-ID")
}
