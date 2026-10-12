import { fireEvent, within } from "@testing-library/react"

import { CONFIRM_WORD } from "@/components/dialogs/dialogs"

/**
 * Confirms a `permanent` dialog the way a user must: type the confirmation
 * word, then press the red button.
 */
export function confirmPermanent(
  dialog: HTMLElement,
  name: string | RegExp = "Hapus"
): void {
  fireEvent.change(within(dialog).getByRole("textbox"), {
    target: { value: CONFIRM_WORD },
  })
  fireEvent.click(within(dialog).getByRole("button", { name }))
}
