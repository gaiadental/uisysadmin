import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
} from "@tabler/icons-react"

import { cn } from "@/lib/utils"
import { IconButton } from "@/components/icon-button"

/**
 * What the bar reads. Both the client hook (`usePagination`) and a server page
 * (D5.4) provide it, so one bar serves both. `from` and `to` are 1-based row
 * indexes, 0 when there are no rows.
 */
export type PaginationView = {
  page: number
  setPage: (page: number) => void
  pageCount: number
  from: number
  to: number
  total: number
}

type TablePaginationProps = {
  pagination: PaginationView
  /** Sembunyikan bila hanya satu halaman (default: true). */
  hideWhenSingle?: boolean
  className?: string
  /** Kata benda untuk label jumlah, mis. "permission", "tenant". */
  unit?: string
}

/** Bar paginasi untuk diletakkan di dalam Card, setelah <Table>. */
export function TablePagination({
  pagination,
  hideWhenSingle = true,
  className,
  unit = "baris",
}: TablePaginationProps) {
  const { page, setPage, pageCount, from, to, total } = pagination
  if (hideWhenSingle && pageCount <= 1) return null

  return (
    <nav
      aria-label={`Paginasi ${unit}`}
      className={cn(
        "flex items-center justify-between gap-2 border-t border-border bg-muted/40 px-3 py-2",
        className
      )}
    >
      <span className="font-mono text-xs text-muted-foreground tabular-nums">
        {from}–{to} / {total} {unit}
      </span>
      <div className="flex items-center gap-0.5">
        <IconButton
          icon={IconChevronsLeft}
          label="Halaman pertama"
          disabled={page <= 1}
          onClick={() => setPage(1)}
        />
        <IconButton
          icon={IconChevronLeft}
          label="Halaman sebelumnya"
          disabled={page <= 1}
          onClick={() => setPage(page - 1)}
        />
        <span className="px-1.5 font-mono text-xs tabular-nums">
          {page} / {pageCount}
        </span>
        <IconButton
          icon={IconChevronRight}
          label="Halaman berikutnya"
          disabled={page >= pageCount}
          onClick={() => setPage(page + 1)}
        />
        <IconButton
          icon={IconChevronsRight}
          label="Halaman terakhir"
          disabled={page >= pageCount}
          onClick={() => setPage(pageCount)}
        />
      </div>
    </nav>
  )
}
