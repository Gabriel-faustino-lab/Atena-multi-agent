import { describe, expect, it } from "vitest"
import { extractTokenUsage } from "./terminal-token-usage"

describe("terminal token usage", () => {
  it("reads compact input and output counters", () => {
    expect(extractTokenUsage("128k in · 190k out")).toEqual({
      input: 128_000,
      output: 190_000,
      total: undefined,
    })
  })

  it("reads JSON counters emitted by CLIs", () => {
    expect(
      extractTokenUsage('{"input_tokens":1234,"output_tokens":567}')
    ).toEqual({ input: 1234, output: 567, total: undefined })
  })
})
