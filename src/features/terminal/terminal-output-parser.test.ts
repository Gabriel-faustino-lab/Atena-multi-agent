import { describe, expect, it } from "vitest"
import {
  appendUniqueTerminalEvents,
  classifyTerminalLine,
  cleanTerminalText,
  terminalChunkToEvents,
} from "./terminal-output-parser"

describe("terminal output parser", () => {
  it("classifies common agent operations", () => {
    expect(classifyTerminalLine("Updated src/App.tsx")).toBe("edit")
    expect(classifyTerminalLine("Created src/components/Hero.tsx")).toBe(
      "create"
    )
    expect(classifyTerminalLine("$ npm run build")).toBe("test")
    expect(classifyTerminalLine("✓ 39 tests passed")).toBe("success")
    expect(classifyTerminalLine("Error: build failed")).toBe("error")
    expect(classifyTerminalLine("+ const ready = true")).toBe("diff-add")
    expect(classifyTerminalLine('<section class="hero">')).toBe("code")
  })

  it("removes ANSI control sequences", () => {
    expect(cleanTerminalText("\u001b[36mCreated file\u001b[0m")).toBe(
      "Created file"
    )
  })

  it("keeps incomplete streaming lines for the next chunk", () => {
    const first = terminalChunkToEvents("", "Updated src/", 1)
    expect(first.events).toEqual([])
    const second = terminalChunkToEvents(first.remainder, "App.tsx\r\n", 1)
    expect(second.events[0]).toMatchObject({
      id: 1,
      kind: "edit",
      text: "Updated src/App.tsx",
    })
  })

  it("ignores terminal repaints of the same line", () => {
    const waiting = {
      id: 1,
      kind: "status" as const,
      text: "[Atena] Front-end aguardando delegação...",
    }
    expect(
      appendUniqueTerminalEvents(
        [waiting],
        [
          { ...waiting, id: 2 },
          { ...waiting, id: 3 },
        ]
      )
    ).toEqual([waiting])
  })
})
