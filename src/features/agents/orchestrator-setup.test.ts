import { describe, expect, it } from "vitest"
import {
  catalogForCli,
  defaultOrchestratorSetup,
  effortsForSelection,
  orchestratorCommand,
  parseOrchestratorSetup,
  workerCommand,
  type OrchestratorSetup,
} from "./orchestrator-setup"

describe("orchestrator setup", () => {
  it("accepts arbitrary CLI and model values", () => {
    const setup: OrchestratorSetup = {
      version: 2,
      assignments: defaultOrchestratorSetup.assignments.map((item) =>
        item.role === "frontend"
          ? { ...item, cli: "custom-agent", model: "vendor/new-model" }
          : item
      ),
    }

    expect(parseOrchestratorSetup(JSON.stringify(setup))).toEqual(setup)
  })

  it("provides built-in model catalogs for the standard CLIs", () => {
    expect(catalogForCli("codex")?.models).toContainEqual(
      expect.objectContaining({ id: "gpt-5.6-sol" })
    )
    expect(catalogForCli("claude")?.models).toContainEqual(
      expect.objectContaining({ id: "claude-opus-5" })
    )
    expect(catalogForCli("opencode")?.models).toContainEqual(
      expect.objectContaining({ id: "opencode-go/glm-5.2", tier: "go" })
    )
    expect(catalogForCli("opencode")?.models).toContainEqual(
      expect.objectContaining({
        id: "opencode/deepseek-v4-flash-free",
        tier: "free",
      })
    )
    expect(catalogForCli("agy")?.models).toContainEqual(
      expect.objectContaining({ id: "Gemini 3.1 Pro (High)" })
    )
    expect(catalogForCli("ollama")?.manualModel).toBe(true)
  })

  it("starts an OpenCode worker with the selected provider model", () => {
    const worker = {
      role: "frontend" as const,
      cli: "opencode",
      model: "opencode-go/glm-5.2",
      effort: "high",
    }

    const command = workerCommand(worker, "C:\\project\\.atena\\orchestration")

    expect(command).toContain(
      "opencode run --model 'opencode-go/glm-5.2' --thinking --format default $atenaPrompt"
    )
    expect(command).not.toContain("--variant")
    expect(command).toContain("frontend.task.md")
    expect(command).toContain("frontend.result.md")
    expect(command).toContain("frontend.working.md")
    expect(command).toContain("Move-Item")
    expect(command).toContain("Start-Transcript")
    expect(command).toContain("Stop-Transcript")
    expect(command).not.toContain("Tee-Object")
    expect(command.startsWith("Clear-Host; ")).toBe(true)
  })

  it("passes the selected effort to Codex and Claude", () => {
    const codex = workerCommand(
      {
        role: "backend",
        cli: "codex",
        model: "gpt-5.6-terra",
        effort: "xhigh",
      },
      "C:\\project\\.atena\\orchestration"
    )
    const claude = workerCommand(
      {
        role: "security",
        cli: "claude",
        model: "claude-opus-5",
        effort: "max",
      },
      "C:\\project\\.atena\\orchestration"
    )

    expect(codex).toContain("-c 'model_reasoning_effort=xhigh'")
    expect(claude).toContain("--effort 'max'")
  })

  it("only sends OpenCode variants supported by the selected family", () => {
    expect(effortsForSelection("opencode", "opencode/gpt-5.6-sol")).toContain(
      "max"
    )
    expect(effortsForSelection("opencode", "opencode/claude-opus-5")).toEqual([
      "high",
      "max",
    ])
    expect(
      effortsForSelection("opencode", "opencode/gemini-3.6-flash")
    ).toEqual(["low", "high"])
    expect(effortsForSelection("opencode", "opencode-go/glm-5.2")).toEqual([])

    const command = workerCommand(
      {
        role: "frontend",
        cli: "opencode",
        model: "opencode-go/glm-5.2",
        effort: "max",
      },
      "C:\\project\\.atena\\orchestration"
    )
    expect(command).not.toContain("--variant")
  })

  it.each([
    {
      cli: "agy",
      model: "Gemini 3.1 Pro (High)",
      expected: "agy --model 'Gemini 3.1 Pro (High)' --print $atenaPrompt",
    },
    {
      cli: "ollama",
      model: "qwen3-coder",
      expected: "ollama run 'qwen3-coder' $atenaPrompt",
    },
    {
      cli: "custom-agent",
      model: "vendor/model",
      expected: "custom-agent --model 'vendor/model' $atenaPrompt",
    },
  ])("builds a live worker command for $cli", ({ cli, model, expected }) => {
    const command = workerCommand(
      { role: "security", cli, model, effort: "" },
      "C:\\project\\.atena\\orchestration"
    )
    expect(command).toContain(expected)
    expect(command).toContain("[ATENA_WORKER_ERROR]")
    expect(command).toContain("[ATENA_WORKER_SUCCESS]")
    expect(command).toContain("recebeu uma nova tarefa")
    expect(command).toContain("Execução finalizada")
    expect(command).toContain(`[Atena] Executando ${cli}`)
  })

  it("instructs the controller to delegate through visible worker mailboxes", () => {
    const command = orchestratorCommand(
      defaultOrchestratorSetup,
      "C:\\project\\.atena\\orchestration"
    )

    const encodedPrompt = command.match(/FromBase64String\('([^']+)'\)/)?.[1]
    const decodedPrompt = new TextDecoder().decode(
      Uint8Array.from(atob(encodedPrompt ?? ""), (character) =>
        character.charCodeAt(0)
      )
    )

    expect(command).toContain("codex")
    expect(decodedPrompt).toContain("Front-end (função: frontend)")
    expect(decodedPrompt).toContain("atena-mailbox.ps1")
    expect(decodedPrompt).toContain("delegate <função>")
    expect(decodedPrompt).toContain("wait <função>")
    expect(decodedPrompt).toContain("inspecione os arquivos")
    expect(command).toContain("Set-Content -LiteralPath")
    expect(command).toContain("Clear-Host")
    expect(command).toContain("FromBase64String")
    expect(command).not.toContain("\n")
  })
})
