/**
 * Table compound (ARCH-FE-001 D11, Composition pattern). A screen composes the
 * parts it needs:
 *
 *   <TableCard>
 *     <TableCard.Header title="Tenant" count={12} />
 *     <TableCard.Toolbar>...filters...</TableCard.Toolbar>
 *     <TableCard.Body>...<Table>...</Table>...</TableCard.Body>
 *     <TableCard.Footer><TablePagination pagination={...} /></TableCard.Footer>
 *   </TableCard>
 *
 * Ordering rule: Header, Toolbar, Body, Footer, each at most once. The root
 * also accepts `title`, `count`, `description` and `actions` as a shorthand for
 * a Header, so existing screens keep working.
 */

import * as React from "react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"

interface TableCardContextValue {
  /** Id of the header title. The body region is labelled by it. */
  readonly titleId: string
  readonly registerTitle: (present: boolean) => void
  readonly hasTitle: boolean
}

const TableCardContext = React.createContext<TableCardContextValue | null>(null)

function useTableCardContext(part: string): TableCardContextValue {
  const context = React.useContext(TableCardContext)
  if (context === null) {
    throw new Error(`${part} must be rendered inside <TableCard>.`)
  }
  return context
}

interface TableCardHeaderProps {
  title?: string
  /** Angka di badge kanan judul (font-mono). */
  count?: number
  description?: string
  actions?: React.ReactNode
}

function TableCardHeader({
  title,
  count,
  description,
  actions,
}: TableCardHeaderProps) {
  const { titleId, registerTitle } = useTableCardContext("TableCard.Header")
  const hasTitle = title !== undefined && title !== ""
  React.useEffect(() => {
    registerTitle(hasTitle)
    return () => registerTitle(false)
  }, [hasTitle, registerTitle])

  if (!hasTitle && actions === undefined) return null
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3.5">
      <div className="space-y-0.5">
        <div className="flex items-center gap-2">
          {hasTitle ? (
            <span id={titleId} className="font-heading text-base font-semibold">
              {title}
            </span>
          ) : null}
          {typeof count === "number" ? (
            <Badge variant="outline" className="font-mono">
              {count}
            </Badge>
          ) : null}
        </div>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex items-center gap-2">{actions}</div>
      ) : null}
    </div>
  )
}

/** Filter and search controls above the table. */
function TableCardToolbar({
  className,
  ...props
}: React.ComponentProps<"div">) {
  useTableCardContext("TableCard.Toolbar")
  return (
    <div
      role="search"
      className={cn(
        "flex flex-col gap-2 border-b border-border px-4 py-3 sm:flex-row sm:flex-wrap sm:items-end",
        className
      )}
      {...props}
    />
  )
}

/** Scrolls sideways on a narrow screen. Holds the table or a loading, empty or error message. */
function TableCardBody({ className, ...props }: React.ComponentProps<"div">) {
  const { titleId, hasTitle } = useTableCardContext("TableCard.Body")
  return (
    <div
      role="region"
      aria-labelledby={hasTitle ? titleId : undefined}
      // A scrollable region must be reachable by keyboard (WCAG 2.1.1).
      tabIndex={0}
      className={cn("overflow-x-auto", className)}
      {...props}
    />
  )
}

/** Holds the pagination bar. */
function TableCardFooter({ ...props }: React.ComponentProps<"div">) {
  useTableCardContext("TableCard.Footer")
  return <div {...props} />
}

type TableCardProps = TableCardHeaderProps & {
  children: React.ReactNode
  className?: string
}

export function TableCard({
  title,
  count,
  description,
  actions,
  children,
  className,
}: TableCardProps) {
  const titleId = React.useId()
  const [hasTitle, setHasTitle] = React.useState(false)
  const value = React.useMemo<TableCardContextValue>(
    () => ({ titleId, registerTitle: setHasTitle, hasTitle }),
    [titleId, hasTitle]
  )
  const shorthand =
    title !== undefined || actions !== undefined ? (
      <TableCardHeader
        {...(title !== undefined ? { title } : {})}
        {...(count !== undefined ? { count } : {})}
        {...(description !== undefined ? { description } : {})}
        {...(actions !== undefined ? { actions } : {})}
      />
    ) : null
  return (
    <TableCardContext.Provider value={value}>
      <Card className={cn("gap-0 overflow-x-auto py-0", className)}>
        {shorthand}
        {children}
      </Card>
    </TableCardContext.Provider>
  )
}

TableCard.Header = TableCardHeader
TableCard.Toolbar = TableCardToolbar
TableCard.Body = TableCardBody
TableCard.Footer = TableCardFooter
