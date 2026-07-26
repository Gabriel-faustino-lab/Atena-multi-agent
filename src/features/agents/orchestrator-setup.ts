import type { SquadTemplate } from "./orchestrator-types"

export type SquadRole = "orchestrator" | "frontend" | "backend" | "security"

export interface RoleAssignment {
  role: SquadRole
  cli: string
  model: string
  effort: string
}

export interface OrchestratorSetup {
  version: 2
  assignments: RoleAssignment[]
}

export const roleMeta: Record<
  SquadRole,
  { label: string; description: string }
> = {
  orchestrator: {
    label: "Orquestrador",
    description: "Planeja, delega e consolida as entregas.",
  },
  frontend: {
    label: "Front-end",
    description: "Interface, experiência e integração visual.",
  },
  backend: {
    label: "Back-end",
    description: "Regras de negócio, dados, APIs e integrações.",
  },
  security: {
    label: "Segurança",
    description: "Riscos, permissões, dependências e dados.",
  },
}

export interface CliCatalogEntry {
  id: string
  label: string
  models: Array<{ id: string; label: string; tier?: "free" | "paid" | "go" }>
  manualModel?: boolean
  efforts?: string[]
}

export const cliCatalog: CliCatalogEntry[] = [
  {
    id: "codex",
    label: "Codex",
    models: [
      { id: "gpt-5.6-sol", label: "GPT-5.6 Sol · máxima capacidade" },
      { id: "gpt-5.6-terra", label: "GPT-5.6 Terra · equilibrado" },
      { id: "gpt-5.6-luna", label: "GPT-5.6 Luna · econômico" },
      { id: "gpt-5.5", label: "GPT-5.5" },
      { id: "gpt-5.4", label: "GPT-5.4" },
      { id: "gpt-5.3-codex", label: "GPT-5.3 Codex" },
    ],
    efforts: ["none", "low", "medium", "high", "xhigh", "max"],
  },
  {
    id: "claude",
    label: "Claude Code",
    models: [
      { id: "opus", label: "Opus (mais recente)" },
      { id: "sonnet", label: "Sonnet (mais recente)" },
      { id: "haiku", label: "Haiku (mais recente)" },
      { id: "claude-fable-5", label: "Claude Fable 5" },
      { id: "claude-opus-5", label: "Claude Opus 5" },
      { id: "claude-sonnet-5", label: "Claude Sonnet 5" },
      { id: "claude-opus-4-8", label: "Claude Opus 4.8" },
      { id: "claude-opus-4-7", label: "Claude Opus 4.7" },
      { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6" },
      { id: "claude-haiku-4-5", label: "Claude Haiku 4.5" },
    ],
    efforts: ["low", "medium", "high", "xhigh", "max"],
  },
  {
    id: "opencode",
    label: "OpenCode",
    models: [
      { id: "opencode/big-pickle", label: "Big Pickle", tier: "free" },
      {
        id: "opencode/deepseek-v4-flash-free",
        label: "DeepSeek V4 Flash",
        tier: "free",
      },
      { id: "opencode/mimo-v2.5-free", label: "MiMo-V2.5", tier: "free" },
      { id: "opencode/laguna-s-2.1-free", label: "Laguna S 2.1", tier: "free" },
      {
        id: "opencode/ling-3.0-flash-free",
        label: "Ling 3.0 Flash",
        tier: "free",
      },
      {
        id: "opencode/north-mini-code-free",
        label: "North Mini Code",
        tier: "free",
      },
      {
        id: "opencode/nemotron-3-ultra-free",
        label: "Nemotron 3 Ultra",
        tier: "free",
      },
      { id: "opencode/gpt-5.6-sol", label: "GPT-5.6 Sol · Zen", tier: "paid" },
      {
        id: "opencode/gpt-5.6-terra",
        label: "GPT-5.6 Terra · Zen",
        tier: "paid",
      },
      {
        id: "opencode/gpt-5.6-luna",
        label: "GPT-5.6 Luna · Zen",
        tier: "paid",
      },
      {
        id: "opencode/claude-opus-5",
        label: "Claude Opus 5 · Zen",
        tier: "paid",
      },
      {
        id: "opencode/claude-sonnet-5",
        label: "Claude Sonnet 5 · Zen",
        tier: "paid",
      },
      {
        id: "opencode/claude-opus-4-8",
        label: "Claude Opus 4.8 · Zen",
        tier: "paid",
      },
      {
        id: "opencode/gemini-3.6-flash",
        label: "Gemini 3.6 Flash · Zen",
        tier: "paid",
      },
      {
        id: "opencode/gemini-3.1-pro",
        label: "Gemini 3.1 Pro · Zen",
        tier: "paid",
      },
      { id: "opencode/glm-5.2", label: "GLM-5.2 · Zen", tier: "paid" },
      {
        id: "opencode/kimi-k2.7-code",
        label: "Kimi K2.7 Code · Zen",
        tier: "paid",
      },
      { id: "opencode-go/grok-4.5", label: "Grok 4.5", tier: "go" },
      { id: "opencode-go/glm-5.2", label: "GLM-5.2", tier: "go" },
      { id: "opencode-go/glm-5.1", label: "GLM-5.1", tier: "go" },
      { id: "opencode-go/kimi-k3", label: "Kimi K3", tier: "go" },
      { id: "opencode-go/kimi-k2.7-code", label: "Kimi K2.7 Code", tier: "go" },
      { id: "opencode-go/mimo-v2.5", label: "MiMo-V2.5", tier: "go" },
      { id: "opencode-go/minimax-m3", label: "MiniMax M3", tier: "go" },
      { id: "opencode-go/qwen3.7-max", label: "Qwen3.7 Max", tier: "go" },
      {
        id: "opencode-go/deepseek-v4-pro",
        label: "DeepSeek V4 Pro",
        tier: "go",
      },
      { id: "opencode-go/hy3", label: "Hy3", tier: "go" },
    ],
    efforts: ["none", "minimal", "low", "medium", "high", "xhigh", "max"],
  },
  {
    id: "agy",
    label: "Antigravity",
    models: [
      { id: "Gemini 3.5 Flash (Low)", label: "Gemini 3.5 Flash · Low" },
      { id: "Gemini 3.5 Flash (Medium)", label: "Gemini 3.5 Flash · Medium" },
      { id: "Gemini 3.5 Flash (High)", label: "Gemini 3.5 Flash · High" },
      { id: "Gemini 3.1 Pro (Low)", label: "Gemini 3.1 Pro · Low" },
      { id: "Gemini 3.1 Pro (High)", label: "Gemini 3.1 Pro · High" },
      {
        id: "Claude Sonnet 4.6 (Thinking)",
        label: "Claude Sonnet 4.6 · Thinking",
      },
      { id: "Claude Opus 4.6 (Thinking)", label: "Claude Opus 4.6 · Thinking" },
      { id: "GPT-OSS 120B (Medium)", label: "GPT-OSS 120B · Medium" },
    ],
  },
  { id: "ollama", label: "Ollama", models: [], manualModel: true },
]

export function catalogForCli(cli: string): CliCatalogEntry | undefined {
  return cliCatalog.find((entry) => entry.id === cli.trim().toLowerCase())
}

export function effortsForSelection(cli: string, model: string): string[] {
  const catalog = catalogForCli(cli)
  if (!catalog) return []
  if (catalog.id !== "opencode") return catalog.efforts ?? []
  const normalized = model.toLowerCase()
  if (normalized.includes("/gpt-"))
    return ["none", "minimal", "low", "medium", "high", "xhigh", "max"]
  if (normalized.includes("/claude-")) return ["high", "max"]
  if (normalized.includes("/gemini-")) return ["low", "high"]
  return []
}

export const defaultOrchestratorSetup: OrchestratorSetup = {
  version: 2,
  assignments: (
    ["orchestrator", "frontend", "backend", "security"] as const
  ).map((role) => ({ role, cli: "codex", model: "", effort: "" })),
}

export function parseOrchestratorSetup(raw: string | null): OrchestratorSetup {
  if (!raw) return defaultOrchestratorSetup
  try {
    const parsed = JSON.parse(raw) as {
      version: number
      assignments: Array<Omit<RoleAssignment, "effort"> & { effort?: string }>
    }
    if (parsed.version === 1 && Array.isArray(parsed.assignments)) {
      return {
        version: 2,
        assignments: parsed.assignments.map((item) => ({
          ...item,
          effort: "",
        })),
      }
    }
    const roles = new Set(parsed.assignments?.map((item) => item.role))
    if (
      parsed.version === 2 &&
      parsed.assignments?.length === 4 &&
      Object.keys(roleMeta).every((role) => roles.has(role as SquadRole)) &&
      parsed.assignments.every(
        (item) =>
          typeof item.cli === "string" &&
          item.cli.trim() &&
          typeof item.model === "string" &&
          typeof item.effort === "string"
      )
    )
      return {
        version: 2,
        assignments: parsed.assignments.map((item) => ({
          ...item,
          effort: item.effort ?? "",
        })),
      }
  } catch {
    /* use defaults */
  }
  return defaultOrchestratorSetup
}

export function setupToTemplate(setup: OrchestratorSetup): SquadTemplate {
  return {
    id: "workspace-squad",
    name: "Squad do projeto",
    description: "Equipe configurada ao abrir o workspace",
    builtIn: true,
    steps: setup.assignments.map((assignment, order) => ({
      order,
      agentRole: assignment.role,
      cliTool: (["codex", "claude", "opencode"].includes(
        assignment.cli.toLowerCase()
      )
        ? assignment.cli.toLowerCase()
        : "shell") as "codex" | "claude" | "opencode" | "shell",
      title:
        assignment.role === "orchestrator"
          ? "Planejar e coordenar a execução"
          : `Executar trabalho de ${roleMeta[assignment.role].label.toLowerCase()}`,
      prompt:
        assignment.role === "orchestrator"
          ? "Analise o objetivo, delegue o trabalho e consolide os resultados."
          : roleMeta[assignment.role].description,
      dependsOn: assignment.role === "orchestrator" ? undefined : [0],
    })),
  }
}

function quotePowerShell(value: string): string {
  return `'${value.replace(/'/g, "''")}'`
}

function powerShellUtf8Expression(value: string): string {
  const bytes = new TextEncoder().encode(value)
  let binary = ""
  for (const byte of bytes) binary += String.fromCharCode(byte)
  const encoded = btoa(binary)
  return `[Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('${encoded}'))`
}

function invocation(
  assignment: RoleAssignment,
  promptExpression: string
): string {
  const cli = assignment.cli.trim()
  const normalized = cli.toLowerCase()
  const modelFlag = assignment.model.trim()
    ? ` --model ${quotePowerShell(assignment.model.trim())}`
    : ""
  const effort = assignment.effort.trim()
  const effortFlag = effort ? ` --effort ${quotePowerShell(effort)}` : ""
  const variantFlag =
    effort &&
    effortsForSelection(assignment.cli, assignment.model).includes(effort)
      ? ` --variant ${quotePowerShell(effort)}`
      : ""
  const codexEffort = effort
    ? ` -c ${quotePowerShell(`model_reasoning_effort=${effort}`)}`
    : ""
  if (normalized === "opencode")
    return `opencode run${modelFlag}${variantFlag} --thinking --format default ${promptExpression}`
  if (normalized === "codex")
    return `codex exec${modelFlag}${codexEffort} ${promptExpression}`
  if (normalized === "claude")
    return `claude --print${modelFlag}${effortFlag} ${promptExpression}`
  if (normalized === "agy") return `agy${modelFlag} --print ${promptExpression}`
  if (normalized === "ollama")
    return `ollama run ${quotePowerShell(assignment.model.trim())} ${promptExpression}`
  return `${cli}${modelFlag} ${promptExpression}`
}

function mailboxPath(
  runtimeDirectory: string,
  role: SquadRole,
  extension: "task" | "working" | "result"
): string {
  return `${runtimeDirectory}\\${role}.${extension}.md`
}

export function workerCommand(
  assignment: RoleAssignment,
  runtimeDirectory: string
): string {
  const task = mailboxPath(runtimeDirectory, assignment.role, "task")
  const working = mailboxPath(runtimeDirectory, assignment.role, "working")
  const result = mailboxPath(runtimeDirectory, assignment.role, "result")
  const workerInstructions = [
    "Execute a tarefa de verdade neste projeto.",
    "Inspecione o repositório, edite ou crie os arquivos necessários e valide o resultado com testes ou build quando aplicável.",
    "Não responda apenas com sugestões, plano ou exemplo: implemente as alterações no diretório de trabalho atual.",
    "Mantenha um feedback visual contínuo, natural e conciso no terminal durante toda a execução, como em uma CLI de desenvolvimento convencional.",
    "Mostre o raciocínio operacional permitido, as etapas em andamento, as ferramentas utilizadas e o motivo de cada ação com títulos curtos e bullets legíveis.",
    "Ao criar ou modificar algo, mostre o caminho do arquivo, a ação realizada e os trechos ou diffs relevantes.",
    "Mantenha visível a saída útil da CLI, incluindo comandos executados, patches ou diffs apresentados pelas ferramentas e trechos relevantes escritos no código; não substitua isso por uma mensagem genérica de conclusão.",
    "Mostre os comandos e resultados de testes ou build. Ao encontrar um impedimento real, explique a causa no fluxo sem simular conclusão.",
    "Mostre o progresso conforme acontece; não guarde todo o relato para a resposta final e não exponha detalhes internos da caixa postal do Atena.",
    "Ao terminar, informe objetivamente os arquivos alterados, as validações executadas e qualquer pendência real.",
  ].join(" ")
  const execute = invocation(assignment, "$atenaPrompt")
  return [
    "Clear-Host",
    `New-Item -ItemType Directory -Force -Path ${quotePowerShell(runtimeDirectory)} | Out-Null`,
    `Write-Host ${quotePowerShell(`[Atena] ${roleMeta[assignment.role].label} aguardando delegação...`)}`,
    `while ($true) { if (Test-Path -LiteralPath ${quotePowerShell(task)}) {`,
    `$atenaTask = Get-Content -Raw -LiteralPath ${quotePowerShell(task)}`,
    `Remove-Item -LiteralPath ${quotePowerShell(task)} -Force`,
    `$atenaPrompt = ${powerShellUtf8Expression(`${workerInstructions}\n\nTAREFA DELEGADA:\n`)} + $atenaTask`,
    `Remove-Item -LiteralPath ${quotePowerShell(working)} -Force -ErrorAction SilentlyContinue`,
    `Write-Host ${quotePowerShell(`● ${roleMeta[assignment.role].label} recebeu uma nova tarefa`)} -ForegroundColor Magenta`,
    `Write-Host ${quotePowerShell(`[Atena] Executando ${assignment.cli}${assignment.model ? ` · ${assignment.model}` : ""}...`)} -ForegroundColor Cyan`,
    `Start-Transcript -LiteralPath ${quotePowerShell(working)} -Force | Out-Null`,
    execute,
    `$atenaExitCode = $LASTEXITCODE`,
    `Stop-Transcript | Out-Null`,
    `if ($atenaExitCode -ne 0) { Add-Content -LiteralPath ${quotePowerShell(working)} -Value ${quotePowerShell("[ATENA_WORKER_ERROR] A CLI terminou com erro. Verifique se o provider do modelo está autenticado.")}; Write-Host ${quotePowerShell("✕ A CLI terminou com erro — revise provider, login e modelo.")} -ForegroundColor Red } else { Add-Content -LiteralPath ${quotePowerShell(working)} -Value ${quotePowerShell("[ATENA_WORKER_SUCCESS] A CLI terminou a execução. O orquestrador ainda deve validar os arquivos e testes.")}; Write-Host ${quotePowerShell("✓ Execução finalizada; resultado enviado ao orquestrador")} -ForegroundColor Green }`,
    `Move-Item -LiteralPath ${quotePowerShell(working)} -Destination ${quotePowerShell(result)} -Force`,
    `}; Start-Sleep -Milliseconds 700 }`,
  ].join("; ")
}

export function orchestratorCommand(
  setup: OrchestratorSetup,
  runtimeDirectory: string
): string {
  const [controller, ...workers] = setup.assignments
  const mailboxHelper = `${runtimeDirectory}\\atena-mailbox.ps1`
  const mailboxScript = [
    "param([Parameter(Mandatory=$true)][ValidateSet('delegate','wait')] [string]$Action, [Parameter(Mandatory=$true)] [string]$Role, [string]$Content = '', [int]$TimeoutSeconds = 1800)",
    "$runtime = Split-Path -Parent $MyInvocation.MyCommand.Path",
    "$task = Join-Path $runtime ($Role + '.task.md')",
    "$working = Join-Path $runtime ($Role + '.working.md')",
    "$result = Join-Path $runtime ($Role + '.result.md')",
    "if ($Action -eq 'delegate') { Remove-Item -LiteralPath $result,$working -Force -ErrorAction SilentlyContinue; Set-Content -LiteralPath $task -Value $Content -Encoding UTF8; Write-Host ('[Atena] tarefa enviada para ' + $Role) -ForegroundColor Cyan; exit 0 }",
    "Write-Host ('[Atena] acompanhando ' + $Role + '...') -ForegroundColor DarkGray",
    "$deadline = (Get-Date).AddSeconds($TimeoutSeconds)",
    "while ((Get-Date) -lt $deadline) { if (Test-Path -LiteralPath $result) { try { $output = Get-Content -Raw -LiteralPath $result -ErrorAction Stop; Write-Output $output; exit 0 } catch {} }; Start-Sleep -Milliseconds 700 }",
    "Write-Error ('Tempo limite aguardando ' + $Role); exit 1",
  ].join("\r\n")
  const roster = workers
    .map((worker) => {
      return `- ${roleMeta[worker.role].label} (função: ${worker.role}): ${worker.cli}${worker.model ? ` (${worker.model})` : ""}.`
    })
    .join("\n")
  const prompt = [
    "Você é o orquestrador principal deste projeto dentro do Atena.",
    "Quando o usuário solicitar trabalho, analise e delegue de verdade aos especialistas através dos arquivos de tarefa abaixo. Os terminais dos agentes já estão observando esses arquivos e executarão as CLIs/modelos escolhidos pelo usuário.",
    `Para manter a interface limpa, nunca manipule os arquivos internos diretamente e nunca construa loops PowerShell extensos. Use somente o helper ${mailboxHelper}. Para delegar: & ${quotePowerShell(mailboxHelper)} delegate <função> '<tarefa detalhada>'. Para acompanhar até o fim: & ${quotePowerShell(mailboxHelper)} wait <função>. Esses comandos curtos são a única interface permitida para a caixa postal.`,
    "O helper de espera só retorna quando o agente termina. Verifique se o resultado contém [ATENA_WORKER_SUCCESS] ou [ATENA_WORKER_ERROR].",
    "Uma saída bem-sucedida da CLI não prova que a tarefa foi concluída. Antes de responder ao usuário, inspecione os arquivos realmente criados ou modificados no projeto, confira se atendem ao pedido e execute testes ou build apropriados. Se não houver alterações esperadas, se a implementação estiver parcial ou se a validação falhar, delegue uma correção ao especialista e continue acompanhando. Só declare conclusão após essa validação. Não apenas descreva uma delegação e não troque a CLI ou o modelo configurado.",
    `Crie o diretório se necessário: ${runtimeDirectory}`,
    "Especialistas disponíveis:",
    roster,
    "Apresente brevemente o squad e aguarde a solicitação do usuário.",
  ].join("\n\n")
  const promptSetup = `$atenaPrompt = ${powerShellUtf8Expression(prompt)}`
  const helperSetup = [
    `New-Item -ItemType Directory -Force -Path ${quotePowerShell(runtimeDirectory)} | Out-Null`,
    `Set-Content -LiteralPath ${quotePowerShell(mailboxHelper)} -Value (${powerShellUtf8Expression(mailboxScript)}) -Encoding UTF8`,
    "Clear-Host",
  ].join("; ")
  const normalized = controller.cli.trim().toLowerCase()
  const modelFlag = controller.model.trim()
    ? ` --model ${quotePowerShell(controller.model.trim())}`
    : ""
  const effort = controller.effort.trim()
  const effortFlag = effort ? ` --effort ${quotePowerShell(effort)}` : ""
  const variantFlag =
    effort &&
    effortsForSelection(controller.cli, controller.model).includes(effort)
      ? ` --variant ${quotePowerShell(effort)}`
      : ""
  const codexEffort = effort
    ? ` -c ${quotePowerShell(`model_reasoning_effort=${effort}`)}`
    : ""
  if (normalized === "opencode")
    return `${promptSetup}; ${helperSetup}; opencode${modelFlag}${variantFlag} --prompt $atenaPrompt`
  if (normalized === "codex")
    return `${promptSetup}; ${helperSetup}; codex${modelFlag}${codexEffort} $atenaPrompt`
  if (normalized === "claude")
    return `${promptSetup}; ${helperSetup}; claude${modelFlag}${effortFlag} $atenaPrompt`
  if (normalized === "agy")
    return `${promptSetup}; ${helperSetup}; agy${modelFlag} --print $atenaPrompt`
  if (normalized === "ollama")
    return `${promptSetup}; ${helperSetup}; ollama run ${quotePowerShell(controller.model.trim())} $atenaPrompt`
  return `${promptSetup}; ${helperSetup}; ${controller.cli.trim()}${modelFlag} $atenaPrompt`
}
