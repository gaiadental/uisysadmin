import { describe, expect, it } from "vitest"
import {
  ApiError,
  contractError,
  httpError,
  isUnauthorized,
  networkError,
  nonJsonError,
  timeoutError,
} from "./errors"

describe("ApiError", () => {
  it("is an Error that carries code, status, kind and correlationId", () => {
    const error = new ApiError({
      code: "RESOURCE_NOT_FOUND",
      message: "Tenant not found.",
      status: 404,
      kind: "HTTP",
      correlationId: "ref-404",
    })

    expect(error).toBeInstanceOf(Error)
    expect(error.name).toBe("ApiError")
    expect(error.message).toBe("Tenant not found.")
    expect(error.code).toBe("RESOURCE_NOT_FOUND")
    expect(error.status).toBe(404)
    expect(error.kind).toBe("HTTP")
    expect(error.correlationId).toBe("ref-404")
  })
})

describe("httpError", () => {
  it("takes code and message from the server body", () => {
    const error = httpError(
      403,
      { code: "PASSWORD_CHANGE_REQUIRED", message: "Change password." },
      "ref-1"
    )

    expect(error).toMatchObject({
      code: "PASSWORD_CHANGE_REQUIRED",
      message: "Change password.",
      status: 403,
      kind: "HTTP",
      correlationId: "ref-1",
    })
  })

  it("falls back to the HTTP kind when the body has no usable code", () => {
    const error = httpError(500, { code: "", message: "" }, null)

    expect(error.code).toBe("HTTP")
    expect(error.message).toBe("Permintaan gagal. Coba lagi.")
    expect(error.status).toBe(500)
  })

  it("ignores bodies that are not JSON objects, so no body text leaks", () => {
    const fromString = httpError(502, "upstream stack trace", null)
    const fromArray = httpError(502, [{ code: "X", message: "Y" }], null)

    expect(fromString.code).toBe("HTTP")
    expect(fromString.message).not.toContain("stack trace")
    expect(fromArray.code).toBe("HTTP")
    expect(fromArray.message).toBe("Permintaan gagal. Coba lagi.")
  })
})

describe("client-side error kinds", () => {
  it("uses the kind as the code for NETWORK, TIMEOUT and NON_JSON", () => {
    expect(networkError("ref-n")).toMatchObject({
      code: "NETWORK",
      kind: "NETWORK",
      status: null,
      correlationId: "ref-n",
    })
    expect(timeoutError("ref-t")).toMatchObject({
      code: "TIMEOUT",
      kind: "TIMEOUT",
      status: null,
    })
    expect(nonJsonError(502, "ref-j")).toMatchObject({
      code: "NON_JSON",
      kind: "NON_JSON",
      status: 502,
    })
  })

  it("maps a contract mismatch to kind CONTRACT", () => {
    expect(contractError(200, null)).toMatchObject({
      code: "CONTRACT",
      kind: "CONTRACT",
      status: 200,
    })
  })

  it("never puts a stack trace in a client-side message", () => {
    const messages = [
      networkError(null).message,
      timeoutError(null).message,
      nonJsonError(500, null).message,
      contractError(200, null).message,
    ]

    for (const message of messages) {
      expect(message.length).toBeGreaterThan(0)
      expect(message).not.toMatch(/at \w+ \(|Error:/)
    }
  })
})

describe("isUnauthorized", () => {
  it("is true only for an ApiError with status 401", () => {
    expect(isUnauthorized(httpError(401, { code: "X" }, null))).toBe(true)
    expect(isUnauthorized(nonJsonError(401, null))).toBe(true)
    expect(isUnauthorized(httpError(403, { code: "X" }, null))).toBe(false)
    expect(isUnauthorized(new Error("401"))).toBe(false)
    expect(isUnauthorized(undefined)).toBe(false)
  })
})
