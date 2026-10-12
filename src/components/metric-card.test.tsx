// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"

import { IconBuilding } from "@tabler/icons-react"

import { MetricCard } from "./metric-card"

afterEach(cleanup)

describe("MetricCard state (REQ-FE-037)", () => {
  it("shows the value by default and no status or alert", () => {
    render(<MetricCard label="Tenant" value={12} icon={IconBuilding} />)

    expect(screen.getByText("Tenant")).toBeInTheDocument()
    expect(screen.getByText("12")).toBeInTheDocument()
    expect(screen.queryByRole("status")).toBeNull()
    expect(screen.queryByRole("alert")).toBeNull()
  })

  it("shows 0 when ready", () => {
    render(<MetricCard label="Negara" value={0} state="ready" />)

    expect(screen.getByText("0")).toBeInTheDocument()
  })

  it("loading announces a status and hides the value", () => {
    render(<MetricCard label="Tenant" value={12} state="loading" />)

    expect(screen.getByRole("status")).toHaveTextContent("Memuat")
    expect(screen.queryByText("12")).toBeNull()
    expect(screen.queryByRole("alert")).toBeNull()
  })

  it("error announces an alert and hides the value", () => {
    render(<MetricCard label="Tenant" value={12} state="error" />)

    expect(screen.getByRole("alert")).toHaveTextContent("Gagal dimuat")
    expect(screen.queryByText("12")).toBeNull()
    expect(screen.queryByRole("status")).toBeNull()
  })

  it("keeps the label and the hint in every state", () => {
    const { rerender } = render(
      <MetricCard label="Tenant" value={1} state="loading" hint="Semua" />
    )
    expect(screen.getByText("Tenant")).toBeInTheDocument()
    expect(screen.getByText("Semua")).toBeInTheDocument()

    rerender(<MetricCard label="Tenant" value={1} state="error" hint="Semua" />)
    expect(screen.getByText("Tenant")).toBeInTheDocument()
    expect(screen.getByText("Semua")).toBeInTheDocument()
  })
})
