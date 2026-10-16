import { describe, expect, it } from "vitest"

import { ApiError } from "@/lib/api/errors"

import {
  describeRolePermissionsFailure,
  describeRoleWriteFailure,
  PERMISSION_SCOPE_MESSAGE,
} from "./role-failure"

const SERVER_TEXT = "Permission appointment:view is tenant scope on a system role"

function httpError(status: number, code: string): ApiError {
  return new ApiError({
    code,
    message: SERVER_TEXT,
    status,
    kind: "HTTP",
    correlationId: "ref-scope-1",
  })
}

describe("describeRolePermissionsFailure (REQ-FE-057, TODO-027)", () => {
  it("gives fixed copy and the reference id for 400 PERMISSION_SCOPE_NOT_ALLOWED", () => {
    const failure = describeRolePermissionsFailure(
      httpError(400, "PERMISSION_SCOPE_NOT_ALLOWED")
    )

    expect(failure).toEqual({
      message: "Permission ini tidak dapat diberikan pada peran ini.",
      referenceId: "ref-scope-1",
    })
    expect(failure.message).toBe(PERMISSION_SCOPE_MESSAGE)
    expect(failure.message).not.toContain(SERVER_TEXT)
  })

  it("does not use the scope copy for a 409 with the same code", () => {
    const error = httpError(409, "PERMISSION_SCOPE_NOT_ALLOWED")

    expect(describeRolePermissionsFailure(error)).toEqual(
      describeRoleWriteFailure(error)
    )
  })

  it("falls back to the role write copy for another 400 code", () => {
    const error = httpError(400, "SOMETHING_ELSE")

    expect(describeRolePermissionsFailure(error)).toEqual(
      describeRoleWriteFailure(error)
    )
  })

  it("falls back to the role write copy for a non-API error", () => {
    const error = new Error("boom")

    expect(describeRolePermissionsFailure(error)).toEqual(
      describeRoleWriteFailure(error)
    )
  })
})
