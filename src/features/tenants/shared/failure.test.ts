import { describe, expect, it } from "vitest"

import { ApiError, type ApiErrorKind } from "@/lib/api/errors"

import {
  BAD_GATEWAY_MESSAGE,
  FORBIDDEN_MESSAGE,
  GENERIC_READ_MESSAGE,
  describeReadFailure,
} from "./failure"

function apiError(
  status: number | null,
  code: string,
  message: string,
  kind: ApiErrorKind = "HTTP"
): ApiError {
  return new ApiError({ code, message, status, kind, correlationId: "ref-1" })
}

describe("describeReadFailure (D13)", () => {
  it("shows the 503 server message as is, with the reference id", () => {
    expect(
      describeReadFailure(apiError(503, "SERVICE_UNAVAILABLE", "Please retry."))
    ).toEqual({ message: "Please retry.", referenceId: "ref-1" })
  })

  it("maps 403 and 502 to fixed copy", () => {
    expect(
      describeReadFailure(apiError(403, "PERMISSION_DENIED", "x")).message
    ).toBe(FORBIDDEN_MESSAGE)
    expect(
      describeReadFailure(apiError(502, "INTERNAL_ERROR", "x")).message
    ).toBe(BAD_GATEWAY_MESSAGE)
  })

  it("never shows the server text of another HTTP error", () => {
    expect(
      describeReadFailure(apiError(500, "INTERNAL_SERVER_ERROR", "stack trace"))
        .message
    ).toBe(GENERIC_READ_MESSAGE)
  })

  it("shows the frontend copy of a client kind", () => {
    expect(
      describeReadFailure(
        apiError(null, "NETWORK", "Tidak dapat terhubung.", "NETWORK")
      ).message
    ).toBe("Tidak dapat terhubung.")
  })

  it("gives generic copy and no reference id for a non-ApiError", () => {
    expect(describeReadFailure(new Error("boom"))).toEqual({
      message: GENERIC_READ_MESSAGE,
      referenceId: null,
    })
  })
})
