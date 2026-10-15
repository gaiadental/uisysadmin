import { describe, expect, it } from "vitest"

import { ApiError } from "@/lib/api/errors"

import { GENERIC_WRITE_MESSAGE } from "@/features/tenants/create/write-failure"

import {
  CONFLICT_MESSAGE,
  describeGuardFailure,
  LAST_PRINCIPAL_MESSAGE,
  PROTECTED_ACCOUNT_MESSAGE,
  PROTECTED_ROLE_MESSAGE,
  ROLE_IN_USE_MESSAGE,
  SELF_ACTION_MESSAGE,
  SERVICE_UNAVAILABLE_MESSAGE,
} from "./guard-failure"

const SERVER_TEXT = "Server wording that must never reach the screen."

function httpError(
  status: number,
  code: string,
  message = SERVER_TEXT,
  correlationId: string | null = "corr-1"
): ApiError {
  return new ApiError({ code, message, status, kind: "HTTP", correlationId })
}

describe("describeGuardFailure", () => {
  it.each([
    [409, "SELF_ACTION_NOT_ALLOWED", SELF_ACTION_MESSAGE],
    [409, "LAST_SYSTEM_PRINCIPAL", LAST_PRINCIPAL_MESSAGE],
    [409, "SYSTEM_ROLE_IN_USE", ROLE_IN_USE_MESSAGE],
    [503, "SERVICE_UNAVAILABLE", SERVICE_UNAVAILABLE_MESSAGE],
  ] as const)("%s %s returns its fixed copy", (status, code, copy) => {
    for (const context of ["role", "account"] as const) {
      const result = describeGuardFailure(httpError(status, code), context)
      expect(result).toEqual({ message: copy, referenceId: "corr-1" })
      expect(result?.message).not.toContain(SERVER_TEXT)
    }
  })

  it("returns different copy for PLATFORM_ROLE_PROTECTED by context", () => {
    const error = httpError(403, "PLATFORM_ROLE_PROTECTED")
    const role = describeGuardFailure(error, "role")
    const account = describeGuardFailure(error, "account")
    expect(role?.message).toBe(PROTECTED_ROLE_MESSAGE)
    expect(account?.message).toBe(PROTECTED_ACCOUNT_MESSAGE)
    expect(role?.message).not.toBe(account?.message)
    expect(role?.message).not.toContain(SERVER_TEXT)
    expect(account?.message).not.toContain(SERVER_TEXT)
  })

  it("uses the role copy for 403 ROLE_GUARD_VIOLATION on role pages only", () => {
    const error = httpError(403, "ROLE_GUARD_VIOLATION")
    expect(describeGuardFailure(error, "role")).toEqual({
      message: PROTECTED_ROLE_MESSAGE,
      referenceId: "corr-1",
    })
    // Not specified for account pages: falls through to the caller's mapping.
    expect(describeGuardFailure(error, "account")).toBeNull()
    expect(
      describeGuardFailure(httpError(409, "ROLE_GUARD_VIOLATION"), "role")?.message
    ).toBe(CONFLICT_MESSAGE)
  })

  it("ignores the message text: same status and code give the same copy", () => {
    const first = describeGuardFailure(
      httpError(409, "LAST_SYSTEM_PRINCIPAL", "one"),
      "account"
    )
    const second = describeGuardFailure(
      httpError(409, "LAST_SYSTEM_PRINCIPAL", "completely different"),
      "account"
    )
    expect(first).toEqual(second)
    // Message text that looks like another code does not change the branch.
    expect(
      describeGuardFailure(
        httpError(409, "LAST_SYSTEM_PRINCIPAL", "SELF_ACTION_NOT_ALLOWED"),
        "account"
      )?.message
    ).toBe(LAST_PRINCIPAL_MESSAGE)
  })

  it("passes the correlation id through, including null", () => {
    expect(
      describeGuardFailure(
        httpError(409, "SELF_ACTION_NOT_ALLOWED", SERVER_TEXT, null),
        "account"
      )?.referenceId
    ).toBeNull()
    expect(
      describeGuardFailure(
        httpError(409, "SELF_ACTION_NOT_ALLOWED", SERVER_TEXT, "abc-123"),
        "account"
      )?.referenceId
    ).toBe("abc-123")
  })

  it("falls through for a known code with the wrong status", () => {
    expect(
      describeGuardFailure(httpError(400, "SELF_ACTION_NOT_ALLOWED"), "account")
    ).toBeNull()
    expect(
      describeGuardFailure(httpError(500, "SERVICE_UNAVAILABLE"), "account")
    ).toBeNull()
    expect(
      describeGuardFailure(httpError(409, "PLATFORM_ROLE_PROTECTED"), "role")
        ?.message
    ).toBe(CONFLICT_MESSAGE)
    expect(
      describeGuardFailure(httpError(404, "PLATFORM_ROLE_PROTECTED"), "role")
    ).toBeNull()
  })

  it("uses fixed conflict copy for an unrecognised 409 code", () => {
    const result = describeGuardFailure(
      httpError(409, "SOMETHING_NEW"),
      "account"
    )
    expect(result).toEqual({ message: CONFLICT_MESSAGE, referenceId: "corr-1" })
    expect(result?.message).not.toContain(SERVER_TEXT)
  })

  it("uses the SERVICE_UNAVAILABLE copy for an unrecognised 503 code", () => {
    const result = describeGuardFailure(httpError(503, "SOMETHING_NEW"), "role")
    expect(result).toEqual({
      message: SERVICE_UNAVAILABLE_MESSAGE,
      referenceId: "corr-1",
    })
  })

  it("uses the generic copy for an HTTP error without a status", () => {
    const error = new ApiError({
      code: "SOMETHING_NEW",
      message: SERVER_TEXT,
      status: null,
      kind: "HTTP",
      correlationId: "corr-1",
    })
    expect(describeGuardFailure(error, "account")).toEqual({
      message: GENERIC_WRITE_MESSAGE,
      referenceId: "corr-1",
    })
  })

  it("leaves the codes with their own handling alone", () => {
    expect(
      describeGuardFailure(httpError(409, "SYSTEM_USER_LOGIN_EXISTS"), "account")
    ).toBeNull()
    expect(
      describeGuardFailure(httpError(409, "SYSTEM_ROLE_KEY_EXISTS"), "role")
    ).toBeNull()
  })

  it("leaves other statuses and non-HTTP errors to the caller", () => {
    expect(describeGuardFailure(httpError(400, "VALIDATION"), "role")).toBeNull()
    expect(describeGuardFailure(httpError(500, "BOOM"), "role")).toBeNull()
    expect(
      describeGuardFailure(
        new ApiError({
          code: "NETWORK",
          message: "x",
          status: null,
          kind: "NETWORK",
          correlationId: null,
        }),
        "role"
      )
    ).toBeNull()
    expect(describeGuardFailure(new Error("x"), "role")).toBeNull()
  })
})
