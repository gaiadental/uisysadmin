// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import {
  CONFIRM_WORD,
  DialogsProvider,
  useDialogs,
  type ConfirmRequest,
} from "./dialogs"

const PERMANENT: ConfirmRequest = {
  title: "Hapus peran Support?",
  description: "Peran akan dihapus dari platform.",
  impact: ["Tindakan ini tidak bisa dibatalkan."],
  confirmLabel: "Hapus",
  tone: "destructive",
  permanent: true,
}

const REVERSIBLE: ConfirmRequest = {
  title: "Nonaktifkan tenant",
  description: "Tenant dinonaktifkan.",
  confirmLabel: "Nonaktifkan",
  tone: "destructive",
}

function Opener({
  request,
  onResult,
}: {
  readonly request: ConfirmRequest
  readonly onResult: (confirmed: boolean) => void
}) {
  const { confirm } = useDialogs()
  return (
    <button type="button" onClick={() => void confirm(request).then(onResult)}>
      Buka
    </button>
  )
}

function open(request: ConfirmRequest, onResult = vi.fn()) {
  render(
    <DialogsProvider>
      <Opener request={request} onResult={onResult} />
    </DialogsProvider>
  )
  fireEvent.click(screen.getByRole("button", { name: "Buka" }))
  return onResult
}

afterEach(cleanup)

const word = (value: string) =>
  fireEvent.change(screen.getByRole("textbox"), { target: { value } })

describe("permanent confirm dialog", () => {
  it("starts with focus on Batal, not on the destructive button", async () => {
    open(PERMANENT)
    await screen.findByRole("dialog")

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Batal" })).toHaveFocus()
    )
  })

  it("lists the impact lines and shows the word to type", async () => {
    open(PERMANENT)
    await screen.findByRole("dialog")

    expect(
      screen.getByText("Tindakan ini tidak bisa dibatalkan.")
    ).toBeInTheDocument()
    expect(screen.getByLabelText(/Ketik delete untuk menghapus/)).toBe(
      screen.getByRole("textbox")
    )
  })

  it("keeps the red button disabled until the word is typed", async () => {
    open(PERMANENT)
    await screen.findByRole("dialog")
    const button = screen.getByRole("button", { name: "Hapus" })

    expect(button).toBeDisabled()
    word("dele")
    expect(button).toBeDisabled()
    word("remove")
    expect(button).toBeDisabled()
    word(CONFIRM_WORD)
    expect(button).toBeEnabled()
  })

  it("accepts the word in any case and with surrounding spaces", async () => {
    open(PERMANENT)
    await screen.findByRole("dialog")

    word("  DeLeTe ")

    expect(screen.getByRole("button", { name: "Hapus" })).toBeEnabled()
  })

  it("does not confirm while the word does not match", async () => {
    const onResult = open(PERMANENT)
    await screen.findByRole("dialog")
    word("nope")

    fireEvent.click(screen.getByRole("button", { name: "Hapus" }))
    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Enter" })

    expect(onResult).not.toHaveBeenCalled()
  })

  it("confirms with the button once the word is typed", async () => {
    const onResult = open(PERMANENT)
    await screen.findByRole("dialog")
    word(CONFIRM_WORD)

    fireEvent.click(screen.getByRole("button", { name: "Hapus" }))

    await waitFor(() => expect(onResult).toHaveBeenCalledWith(true))
  })

  it("confirms with Enter in the field once the word is typed", async () => {
    const onResult = open(PERMANENT)
    await screen.findByRole("dialog")
    word(CONFIRM_WORD)

    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Enter" })

    await waitFor(() => expect(onResult).toHaveBeenCalledWith(true))
  })

  it("cancels with Batal", async () => {
    const onResult = open(PERMANENT)
    await screen.findByRole("dialog")

    fireEvent.click(screen.getByRole("button", { name: "Batal" }))

    await waitFor(() => expect(onResult).toHaveBeenCalledWith(false))
  })
})

describe("reversible confirm dialog", () => {
  it("stays one step with no field and focus on Batal", async () => {
    const onResult = open(REVERSIBLE)
    await screen.findByRole("dialog")

    expect(screen.queryByRole("textbox")).toBeNull()
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Batal" })).toHaveFocus()
    )
    fireEvent.click(screen.getByRole("button", { name: "Nonaktifkan" }))
    await waitFor(() => expect(onResult).toHaveBeenCalledWith(true))
  })
})
