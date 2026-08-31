import * as React from "react"

export type Pagination<T> = {
  page: number
  setPage: (p: number) => void
  pageCount: number
  pageItems: T[]
  from: number // indeks 1-based item pertama di halaman
  to: number // indeks 1-based item terakhir di halaman
  total: number
  pageSize: number
}

/**
 * Paginasi sisi-klien untuk tabel.
 * Halaman otomatis kembali ke 1 bila jumlah item menyusut (mis. setelah filter).
 */
export function usePagination<T>(items: T[], pageSize = 10): Pagination<T> {
  const [page, setPage] = React.useState(1)
  const total = items.length
  const pageCount = Math.max(1, Math.ceil(total / pageSize))

  React.useEffect(() => {
    if (page > pageCount) setPage(pageCount)
  }, [page, pageCount])

  const current = Math.min(page, pageCount)
  const start = (current - 1) * pageSize
  const pageItems = items.slice(start, start + pageSize)

  return {
    page: current,
    setPage,
    pageCount,
    pageItems,
    from: total === 0 ? 0 : start + 1,
    to: Math.min(start + pageSize, total),
    total,
    pageSize,
  }
}
