import { IconTrash } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"

interface RowDeleteButtonProps {
  /** Accessible name, for example "Hapus peran Support". */
  readonly label: string
  readonly disabled?: boolean
  readonly onClick: () => void
}

/**
 * The delete control of a table row or an action group. It is a quiet icon
 * button set apart from the edit control by a divider, and it turns red only
 * on hover or focus. The click only opens the confirm dialog, which does the
 * real gating.
 */
export function RowDeleteButton({
  label,
  disabled = false,
  onClick,
}: RowDeleteButtonProps) {
  return (
    <>
      <span aria-hidden="true" className="mx-2 h-5 w-px bg-border" />
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={label}
        title={label}
        disabled={disabled}
        className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive focus-visible:bg-destructive/10 focus-visible:text-destructive"
        onClick={onClick}
      >
        <IconTrash aria-hidden="true" />
      </Button>
    </>
  )
}
