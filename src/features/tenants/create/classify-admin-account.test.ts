import { describe, expect, it } from "vitest"

import {
  ACCOUNT_WARNING_MESSAGE,
  SUCCESS_MESSAGE,
  SYNC_WARNING_MESSAGE,
  classifyAdminAccount,
} from "./classify-admin-account"

describe("classifyAdminAccount (D8.2, five combinations)", () => {
  it("CREATED + SYNCED is a success without retry", () => {
    expect(
      classifyAdminAccount({ status: "CREATED", tenantStatusSync: "SYNCED" })
    ).toEqual({ kind: "success", message: SUCCESS_MESSAGE, needsRetry: false })
  })

  it("CREATED + FAILED is a sync warning with retry", () => {
    expect(
      classifyAdminAccount({ status: "CREATED", tenantStatusSync: "FAILED" })
    ).toEqual({
      kind: "sync-warning",
      message: SYNC_WARNING_MESSAGE,
      needsRetry: true,
    })
  })

  it("CREATED + absent sync is a sync warning with retry", () => {
    expect(
      classifyAdminAccount({ status: "CREATED", tenantStatusSync: null })
    ).toEqual({
      kind: "sync-warning",
      message: SYNC_WARNING_MESSAGE,
      needsRetry: true,
    })
  })

  it("FAILED + absent sync is an account warning with retry", () => {
    expect(
      classifyAdminAccount({ status: "FAILED", tenantStatusSync: null })
    ).toEqual({
      kind: "account-warning",
      message: ACCOUNT_WARNING_MESSAGE,
      needsRetry: true,
    })
  })

  it("FAILED + a present sync is still an account warning with retry", () => {
    for (const sync of ["SYNCED", "FAILED"] as const) {
      expect(
        classifyAdminAccount({ status: "FAILED", tenantStatusSync: sync }).kind
      ).toBe("account-warning")
    }
  })
})
