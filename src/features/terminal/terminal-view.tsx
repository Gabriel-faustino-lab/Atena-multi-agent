import {
  useEffect,
  useRef,
  useCallback,
  useReducer,
  useState,
  type ReactNode,
} from "react"
import { Terminal } from "@xterm/xterm"
import { FitAddon } from "@xterm/addon-fit"
import { WebLinksAddon } from "@xterm/addon-web-links"
import "@xterm/xterm/css/xterm.css"
import {
  spawnProcess,
  writeToProcess,
  resizeProcess,
  killProcess,
  attachProcess,
  onProcessOutput,
  onProcessExit,
} from "@/lib/pty"
import {
  detectCli,
  initialTerminalState,
  stripAnsi,
  transitionTerminal,
  type TerminalEvent,
  type TerminalState,
} from "@/features/terminal/terminal-domain"
import { createSession, updateSession, addSessionLog } from "@/lib/db"
import {
  compactTokens,
  extractTokenUsage,
  type TokenUsage,
} from "./terminal-token-usage"
import { RichTerminalOutput } from "./rich-terminal-output"
import {
  appendUniqueTerminalEvents,
  terminalChunkToEvents,
  type RichTerminalEvent,
} from "./terminal-output-parser"
import { useTheme } from "@/lib/theme"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Square,
  Trash2,
  Copy,
  RotateCw,
  Terminal as TerminalIcon,
  X,
} from "lucide-react"

interface TerminalViewProps {
  agentId?: string
  agentName: string
  command?: string
  workingDir: string
  workspaceId?: string
  onClose?: () => void
  onActivityChange?: (activity: TerminalActivity) => void
  accentColor?: string
  cliIcon?: ReactNode
  autoFocus?: boolean
}

export type TerminalStatus = "open" | "idle" | "running" | "stopped"

export interface TerminalActivity {
  status: TerminalStatus
  cli: string
  resumeCommand?: string
}

export function TerminalView({
  agentId,
  agentName,
  command,
  workingDir,
  workspaceId,
  onClose,
  onActivityChange,
  accentColor = "#8B949E",
  cliIcon,
  autoFocus = true,
}: TerminalViewProps) {
  const termRef = useRef<HTMLDivElement>(null)
  const termInstanceRef = useRef<Terminal | null>(null)
  const fitRef = useRef<FitAddon | null>(null)
  const processIdRef = useRef<string | null>(null)
  const sessionIdRef = useRef<string | null>(null)
  const unlistenRef = useRef<Array<() => void>>([])
  const dataDisposableRef = useRef<{ dispose: () => void } | null>(null)
  const disposedRef = useRef(false)
  const inputBufferRef = useRef("")
  const pendingInputRef = useRef("")
  const outputTailRef = useRef("")
  const agentTaskActiveRef = useRef(false)
  const terminalStateRef = useRef<TerminalState>(initialTerminalState)
  const inputEscapeStateRef = useRef<"none" | "escape" | "csi" | "osc">("none")
  const [terminalState, dispatchTerminalEvent] = useReducer(
    transitionTerminal,
    initialTerminalState
  )
  const [tokenUsage, setTokenUsage] = useState<TokenUsage | null>(null)
  const [agentTaskActive, setAgentTaskActive] = useState(false)
  const [taskElapsedSeconds, setTaskElapsedSeconds] = useState(0)
  const [activityLine, setActivityLine] = useState("terminal pronto")
  const [outputLevels, setOutputLevels] = useState<number[]>(() =>
    Array.from({ length: 12 }, () => 2)
  )
  const [viewMode, setViewMode] = useState<"atena" | "raw">(() =>
    /orquestrador|orchestrator/i.test(agentName) ? "raw" : "atena"
  )
  const [richEvents, setRichEvents] = useState<RichTerminalEvent[]>([])
  const richOutputRemainderRef = useRef("")
  const richOutputIdRef = useRef(1)
  const richOutputReadyRef = useRef(false)
  const outputUiTimerRef = useRef<number | null>(null)
  const pendingActivityLineRef = useRef("")
  const pendingOutputSizeRef = useRef(0)
  const { theme } = useTheme()
  const isRunning =
    terminalState.processId !== null && terminalState.status !== "stopping"

  const focusTerminal = useCallback(() => {
    requestAnimationFrame(() => {
      if (!disposedRef.current) {
        termInstanceRef.current?.focus()
      }
    })
  }, [])

  const sendTerminalEvent = useCallback(
    (event: TerminalEvent) => {
      const nextState = transitionTerminal(terminalStateRef.current, event)
      if (nextState === terminalStateRef.current) return

      terminalStateRef.current = nextState
      dispatchTerminalEvent(event)
      const status: TerminalStatus =
        nextState.status === "idle"
          ? "idle"
          : nextState.status === "stopping" ||
              nextState.status === "stopped" ||
              nextState.status === "failed"
            ? "stopped"
            : nextState.status === "open" ||
                (nextState.status === "starting" &&
                  nextState.cli === "PowerShell")
              ? "open"
              : "running"
      onActivityChange?.({
        status,
        cli: nextState.cli,
        resumeCommand: nextState.resumeCommand,
      })
    },
    [onActivityChange]
  )

  const getTerminalTheme = useCallback(() => {
    if (theme.isDark) {
      return {
        background: "#0a0a0a",
        foreground: "#e0e0e0",
        cursor: "#39c5cf",
        selectionBackground: "#264f78",
        black: "#0a0a0a",
        red: "#f85149",
        green: "#39c5cf",
        yellow: "#d29922",
        blue: "#58a6ff",
        magenta: "#bc8cff",
        cyan: "#39c5cf",
        white: "#e0e0e0",
        brightBlack: "#6e7681",
        brightRed: "#ff7b72",
        brightGreen: "#56d364",
        brightYellow: "#e3b341",
        brightBlue: "#79c0ff",
        brightMagenta: "#d2a8ff",
        brightCyan: "#56d4dd",
        brightWhite: "#f0f6fc",
      }
    }
    return {
      background: "#ffffff",
      foreground: "#24292f",
      cursor: "#0969da",
      selectionBackground: "#ddf4ff",
      black: "#24292f",
      red: "#cf222e",
      green: "#116329",
      yellow: "#4d2d00",
      blue: "#0969da",
      magenta: "#8250df",
      cyan: "#1b7c83",
      white: "#6e7781",
      brightBlack: "#57606a",
      brightRed: "#a40e26",
      brightGreen: "#1a7f37",
      brightYellow: "#633c01",
      brightBlue: "#218bff",
      brightMagenta: "#a475f9",
      brightCyan: "#3192aa",
      brightWhite: "#8c959f",
    }
  }, [theme])

  const startShell = useCallback(async () => {
    if (processIdRef.current) return
    const term = termInstanceRef.current
    if (!term || disposedRef.current) return

    // Create session for logging
    if (workspaceId && agentId) {
      try {
        const session = await createSession(
          workspaceId,
          agentId,
          `${agentName} — ${new Date().toLocaleString()}`
        )
        sessionIdRef.current = session.id
      } catch (err) {
        console.error("Failed to create session:", err)
      }
    }

    try {
      const initialCli = command?.trim() ? detectCli(command) : "PowerShell"
      const initialResumeCommand = /^(claude|codex|opencode)$/i.test(initialCli)
        ? command?.trim() || initialCli.toLowerCase()
        : ""
      sendTerminalEvent({
        type: "START",
        cli: initialCli,
        resumeCommand: initialResumeCommand,
      })
      // Always spawn an interactive shell; if command is set, it gets sent to the shell
      const info = await spawnProcess(command || "", workingDir, agentId)
      if (disposedRef.current || termInstanceRef.current !== term) {
        killProcess(info.id).catch(() => {})
        return
      }
      processIdRef.current = info.id
      sendTerminalEvent({ type: "ATTACHED", processId: info.id })
      if (autoFocus) focusTerminal()
      resizeProcess(info.id, term.rows, term.cols).catch(() => {})

      if (pendingInputRef.current) {
        const pendingInput = pendingInputRef.current
        pendingInputRef.current = ""
        writeToProcess(info.id, pendingInput).catch((err) => {
          console.error("Failed to flush pending PTY input:", err)
        })
      }

      if (sessionIdRef.current) {
        addSessionLog(
          sessionIdRef.current,
          "info",
          command ? `$ ${command}` : "$ shell"
        ).catch(() => {})
      }

      const unlistenOutput = await onProcessOutput(info.id, (data) => {
        if (disposedRef.current) return
        term.write(data)
        const plainOutput = stripAnsi(data)
        const parsedOutput = terminalChunkToEvents(
          richOutputRemainderRef.current,
          data,
          richOutputIdRef.current
        )
        richOutputRemainderRef.current = parsedOutput.remainder
        richOutputIdRef.current = parsedOutput.nextId
        const readyEventIndex = parsedOutput.events.findIndex((event) =>
          /^\[Atena\].*aguardando delega/i.test(event.text.trim())
        )
        if (!richOutputReadyRef.current && readyEventIndex >= 0) {
          richOutputReadyRef.current = true
        }
        const visibleEvents = richOutputReadyRef.current
          ? parsedOutput.events.slice(Math.max(0, readyEventIndex))
          : []
        if (visibleEvents.length > 0) {
          setRichEvents((events) =>
            appendUniqueTerminalEvents(events, visibleEvents)
          )
        }
        outputTailRef.current = `${outputTailRef.current}${plainOutput}`.slice(
          -4000
        )
        pendingOutputSizeRef.current += plainOutput.length
        const meaningfulLine = plainOutput
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(
            (line) =>
              line.length > 2 &&
              !/^PS\s+.*>$/i.test(line) &&
              !/^\[[\d;?]*[a-z]$/i.test(line)
          )
          .at(-1)
        if (meaningfulLine) pendingActivityLineRef.current = meaningfulLine
        if (outputUiTimerRef.current === null) {
          outputUiTimerRef.current = window.setTimeout(() => {
            const volume = pendingOutputSizeRef.current
            pendingOutputSizeRef.current = 0
            if (pendingActivityLineRef.current) {
              setActivityLine(pendingActivityLineRef.current.slice(0, 180))
              pendingActivityLineRef.current = ""
            }
            setOutputLevels((levels) => [
              ...levels.slice(1),
              Math.max(
                3,
                Math.min(18, 3 + Math.round(Math.log2(volume + 1) * 2))
              ),
            ])
            outputUiTimerRef.current = null
          }, 120)
        }
        if (
          /recebeu uma nova tarefa|\[Atena\]\s+Executando/i.test(plainOutput)
        ) {
          agentTaskActiveRef.current = true
          setAgentTaskActive(true)
        }
        if (
          /Execução finalizada|terminou com erro|falha na tarefa/i.test(
            plainOutput
          )
        ) {
          agentTaskActiveRef.current = false
          setAgentTaskActive(false)
        }
        const usage = extractTokenUsage(outputTailRef.current)
        if (usage) setTokenUsage(usage)
        const hasKnownInteractiveCli = /^(claude|codex|opencode)$/i.test(
          terminalStateRef.current.cli
        )
        if (!hasKnownInteractiveCli) {
          if (/claude\s+code/i.test(outputTailRef.current)) {
            sendTerminalEvent({ type: "ACTIVITY", cli: "claude" })
          } else if (
            /(?:openai\s+codex|codex\s+cli)/i.test(outputTailRef.current)
          ) {
            sendTerminalEvent({ type: "ACTIVITY", cli: "codex" })
          } else if (/\bopencode\b/i.test(outputTailRef.current)) {
            sendTerminalEvent({ type: "ACTIVITY", cli: "opencode" })
          }
        }
        if (/(?:^|[\r\n])PS [^\r\n>]*>\s*$/.test(outputTailRef.current)) {
          inputBufferRef.current = ""
          sendTerminalEvent({ type: "PROMPT" })
        }
        if (sessionIdRef.current) {
          addSessionLog(sessionIdRef.current, "output", data).catch(() => {})
        }
      })

      const unlistenExit = await onProcessExit(info.id, () => {
        if (disposedRef.current) return
        term.write("\r\n\x1b[31m[exit]\x1b[0m\r\n")
        processIdRef.current = null
        sendTerminalEvent({ type: "EXITED" })
        if (sessionIdRef.current) {
          updateSession(sessionIdRef.current, { status: "finished" }).catch(
            () => {}
          )
        }
      })

      unlistenRef.current = [unlistenOutput, unlistenExit]

      const attached = await attachProcess(info.id)
      if (disposedRef.current || termInstanceRef.current !== term) return
      if (attached.scrollback) {
        term.write(attached.scrollback)
        const plainScrollback = stripAnsi(attached.scrollback)
        outputTailRef.current = plainScrollback.slice(-500)
        if (/claude\s+code/i.test(outputTailRef.current)) {
          sendTerminalEvent({ type: "ACTIVITY", cli: "claude" })
        } else if (
          /(?:openai\s+codex|codex\s+cli)/i.test(outputTailRef.current)
        ) {
          sendTerminalEvent({ type: "ACTIVITY", cli: "codex" })
        } else if (/\bopencode\b/i.test(outputTailRef.current)) {
          sendTerminalEvent({ type: "ACTIVITY", cli: "opencode" })
        }
        if (/(?:^|[\r\n])PS [^\r\n>]*>\s*$/.test(outputTailRef.current)) {
          sendTerminalEvent({ type: "PROMPT" })
        }
      }
    } catch (err) {
      if (!disposedRef.current) {
        term.write(`\x1b[31merr: ${err}\x1b[0m\r\n`)
        sendTerminalEvent({ type: "FAILED", error: String(err) })
      }
      if (sessionIdRef.current) {
        addSessionLog(sessionIdRef.current, "error", String(err)).catch(
          () => {}
        )
        updateSession(sessionIdRef.current, { status: "error" }).catch(() => {})
      }
    }
  }, [
    command,
    workingDir,
    agentId,
    workspaceId,
    agentName,
    focusTerminal,
    autoFocus,
    sendTerminalEvent,
  ])

  // Initialize terminal + auto-start shell
  useEffect(() => {
    if (!termRef.current || termInstanceRef.current) return
    disposedRef.current = false

    const term = new Terminal({
      fontSize: 13,
      fontFamily:
        "'JetBrains Mono', 'Cascadia Code', 'Fira Code', Consolas, monospace",
      cursorBlink: true,
      theme: getTerminalTheme() as any,
      allowProposedApi: true,
      convertEol: false,
    })

    const fit = new FitAddon()
    term.loadAddon(fit)
    term.loadAddon(new WebLinksAddon())

    term.open(termRef.current)
    fit.fit()

    termInstanceRef.current = term
    fitRef.current = fit

    // Write header
    term.write(`\x1b[36m${agentName}\x1b[0m`)
    term.write("\r\n\r\n")

    // Pipe user input to process
    dataDisposableRef.current = term.onData((data) => {
      if (terminalStateRef.current.status !== "running") {
        for (const character of data) {
          if (inputEscapeStateRef.current === "csi") {
            if (character >= "@" && character <= "~") {
              inputEscapeStateRef.current = "none"
            }
            continue
          }
          if (inputEscapeStateRef.current === "osc") {
            if (character === "\u0007") inputEscapeStateRef.current = "none"
            continue
          }
          if (inputEscapeStateRef.current === "escape") {
            inputEscapeStateRef.current =
              character === "[" ? "csi" : character === "]" ? "osc" : "none"
            continue
          }
          if (character === "\u001b") {
            inputEscapeStateRef.current = "escape"
            continue
          }
          if (character === "\r" || character === "\n") {
            const commandLine = inputBufferRef.current.trim()
            if (commandLine) {
              const cli = detectCli(commandLine)
              const resumeCommand = /^(claude|codex|opencode)$/i.test(cli)
                ? commandLine
                : ""
              sendTerminalEvent({
                type: "ACTIVITY",
                cli,
                resumeCommand,
              })
            }
            inputBufferRef.current = ""
          } else if (character === "\u0003") {
            inputBufferRef.current = ""
          } else if (character === "\u007f") {
            inputBufferRef.current = inputBufferRef.current.slice(0, -1)
          } else if (character >= " " && character !== "\u001b") {
            inputBufferRef.current += character
          }
        }
      }

      if (processIdRef.current) {
        writeToProcess(processIdRef.current, data).catch((err) => {
          console.error("Failed to write to PTY:", err)
        })
        if (sessionIdRef.current) {
          addSessionLog(sessionIdRef.current, "command", data).catch(() => {})
        }
      } else {
        pendingInputRef.current = `${pendingInputRef.current}${data}`.slice(
          -8192
        )
      }
    })

    term.onResize(({ rows, cols }) => {
      if (processIdRef.current) {
        resizeProcess(processIdRef.current, rows, cols).catch(() => {})
      }
    })

    // Deferring one task prevents React StrictMode's probe mount from spawning a duplicate PTY.
    const startTimer = window.setTimeout(() => startShell(), 0)
    if (autoFocus) focusTerminal()

    return () => {
      window.clearTimeout(startTimer)
      if (outputUiTimerRef.current !== null) {
        window.clearTimeout(outputUiTimerRef.current)
        outputUiTimerRef.current = null
      }
      disposedRef.current = true
      pendingInputRef.current = ""
      dataDisposableRef.current?.dispose()
      dataDisposableRef.current = null
      unlistenRef.current.forEach((fn) => fn())
      unlistenRef.current = []
      if (processIdRef.current) {
        killProcess(processIdRef.current).catch(() => {})
        processIdRef.current = null
      }
      try {
        term.dispose()
      } catch {}
      termInstanceRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!agentTaskActive) {
      setTaskElapsedSeconds(0)
      return
    }
    const startedAt = Date.now()
    setTaskElapsedSeconds(0)
    const interval = window.setInterval(() => {
      setTaskElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000))
    }, 1000)
    return () => window.clearInterval(interval)
  }, [agentTaskActive])

  // Update theme when it changes
  useEffect(() => {
    if (termInstanceRef.current) {
      termInstanceRef.current.options.theme = getTerminalTheme() as any
    }
  }, [theme, getTerminalTheme])

  // Resize handler
  useEffect(() => {
    const handleResize = () => {
      fitRef.current?.fit()
      const terminal = termInstanceRef.current
      if (terminal && processIdRef.current) {
        resizeProcess(processIdRef.current, terminal.rows, terminal.cols).catch(
          () => {}
        )
      }
    }
    const observer = new ResizeObserver(handleResize)
    if (termRef.current) observer.observe(termRef.current)
    window.addEventListener("resize", handleResize)
    return () => {
      observer.disconnect()
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  const stopProcess = useCallback(async () => {
    if (processIdRef.current) {
      sendTerminalEvent({ type: "STOP" })
      await killProcess(processIdRef.current)
      processIdRef.current = null
      sendTerminalEvent({ type: "EXITED" })
      if (!disposedRef.current) {
        termInstanceRef.current?.write("\r\n\x1b[33m[killed]\x1b[0m\r\n")
      }
      if (sessionIdRef.current) {
        updateSession(sessionIdRef.current, { status: "stopped" }).catch(
          () => {}
        )
      }
    }
  }, [sendTerminalEvent])

  const clearTerminal = useCallback(() => {
    if (!disposedRef.current) {
      termInstanceRef.current?.clear()
      focusTerminal()
    }
  }, [focusTerminal])

  const copyLogs = useCallback(() => {
    const term = termInstanceRef.current
    if (term && !disposedRef.current) {
      const selection = term.getSelection()
      if (selection) {
        navigator.clipboard.writeText(selection)
      }
    }
  }, [])

  const restartShell = useCallback(async () => {
    if (disposedRef.current) return
    await stopProcess()
    unlistenRef.current.forEach((fn) => fn())
    unlistenRef.current = []
    if (!disposedRef.current) {
      termInstanceRef.current?.write("\r\n\x1b[36m[restart]\x1b[0m\r\n\r\n")
    }
    await startShell()
    focusTerminal()
  }, [stopProcess, startShell, focusTerminal])

  const modelName =
    command
      ?.match(/--model\s+(?:'([^']+)'|"([^"]+)"|(\S+))/)
      ?.slice(1)
      .find(Boolean) ?? "modelo padrão"
  const activityLabel = agentTaskActive
    ? "desenvolvendo"
    : command?.includes("aguardando delegação")
      ? "aguardando tarefa"
      : terminalState.status === "running"
        ? "executando tarefa"
        : terminalState.status === "starting"
          ? "iniciando agente"
          : terminalState.status === "failed"
            ? "execução bloqueada"
            : terminalState.status === "stopping"
              ? "encerrando"
              : terminalState.status === "stopped"
                ? "agente encerrado"
                : "aguardando tarefa"

  const showLiveActivity = agentTaskActive || terminalState.status === "running"

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[hsl(var(--panel))]">
      <div className="flex h-9 shrink-0 items-center border-b border-[hsl(var(--border))] bg-[hsl(var(--panel-elevated))] px-1">
        <div className="flex h-full min-w-0 items-center gap-2 px-1.5">
          <span
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-white shadow-sm"
            style={{
              backgroundColor: `${accentColor}18`,
              borderColor: `${accentColor}70`,
              color: accentColor,
            }}
          >
            {cliIcon ?? <TerminalIcon className="h-3.5 w-3.5" />}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span
                className="truncate text-[10px] font-semibold"
                style={{ color: accentColor }}
              >
                {agentName}
              </span>
              <span
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                  isRunning
                    ? "bg-[hsl(var(--success))] shadow-[0_0_8px_hsl(var(--success))]"
                    : "bg-[hsl(var(--muted))]"
                }`}
                title={isRunning ? "Process running" : "Process stopped"}
              />
            </div>
            <p className="max-w-52 truncate text-[8px] text-[hsl(var(--muted-foreground))]">
              {modelName}
            </p>
          </div>
        </div>
        <span className="min-w-0 flex-1 truncate px-2 text-right text-[8px] text-[hsl(var(--muted-foreground))]">
          {workingDir}
        </span>
        <span
          className="shrink-0 border-l border-[hsl(var(--border))] px-2 text-[9px] tabular-nums text-[hsl(var(--accent))]"
          title={
            tokenUsage
              ? `Tokens — entrada: ${tokenUsage.input ?? "não informado"}, saída: ${tokenUsage.output ?? "não informado"}`
              : "A CLI ainda não informou o consumo de tokens"
          }
        >
          {tokenUsage?.input !== undefined || tokenUsage?.output !== undefined
            ? `${tokenUsage.input !== undefined ? compactTokens(tokenUsage.input) : "—"} in · ${tokenUsage.output !== undefined ? compactTokens(tokenUsage.output) : "—"} out`
            : tokenUsage?.total !== undefined
              ? `${compactTokens(tokenUsage.total)} tokens`
              : "— tokens"}
        </span>
        <div className="mr-1 flex h-5 shrink-0 overflow-hidden border border-[hsl(var(--border))] bg-[hsl(var(--background))]">
          {(["atena", "raw"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              className={cn(
                "px-1.5 text-[8px] font-semibold uppercase tracking-[0.08em] transition-colors",
                viewMode === mode
                  ? "bg-[hsl(var(--panel-elevated))] text-[hsl(var(--foreground))]"
                  : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
              )}
              onClick={() => setViewMode(mode)}
              aria-pressed={viewMode === mode}
            >
              {mode}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={restartShell}
            disabled={isRunning}
            title="restart"
          >
            <RotateCw className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={stopProcess}
            disabled={!isRunning}
            title="stop"
          >
            <Square className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={copyLogs}
            title="copy"
          >
            <Copy className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={clearTerminal}
            title="clear"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 hover:text-[hsl(var(--danger))]"
              onClick={onClose}
              title="close pane"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
      <div className="relative min-h-0 flex-1 overflow-hidden">
        {showLiveActivity && (
          <div
            className="atena-terminal-scan pointer-events-none absolute inset-x-0 top-0 z-10 h-px"
            style={{ backgroundColor: accentColor, color: accentColor }}
            aria-hidden="true"
          />
        )}
        <div
          className={cn(
            "absolute inset-0",
            viewMode === "raw" ? "visible" : "invisible"
          )}
          aria-hidden={viewMode !== "raw"}
        >
          <div
            ref={termRef}
            className="h-full min-h-0 overflow-hidden px-2 pt-2"
            onMouseDown={focusTerminal}
            onClick={focusTerminal}
          />
        </div>
        {viewMode === "atena" && (
          <RichTerminalOutput
            events={richEvents}
            active={showLiveActivity}
            accentColor={accentColor}
            agentName={agentName}
          />
        )}
      </div>
      <div className="flex h-8 shrink-0 items-center gap-2 overflow-hidden border-t border-[hsl(var(--border))] bg-[hsl(var(--background)/0.72)] px-2.5">
        <span
          className={`h-1.5 w-1.5 shrink-0 rounded-full ${
            terminalState.status === "failed"
              ? "bg-[hsl(var(--danger))]"
              : showLiveActivity
                ? "atena-live-dot bg-[hsl(var(--success))]"
                : "bg-[hsl(var(--muted-foreground))]"
          }`}
        />
        <span className="shrink-0 text-[8px] font-semibold uppercase tracking-[0.14em] text-[hsl(var(--muted-foreground))]">
          {activityLabel}
          {agentTaskActive ? ` · ${taskElapsedSeconds}s` : ""}
        </span>
        <span className="min-w-0 flex-1 truncate border-l border-[hsl(var(--border))] pl-2 text-[8px] text-[hsl(var(--muted-foreground)/0.8)]">
          {showLiveActivity ? activityLine : "feedback ao vivo"}
        </span>
        <div
          className="flex h-4 shrink-0 items-end gap-px"
          aria-label={
            showLiveActivity
              ? "Saída do agente em tempo real"
              : "Sem saída recente"
          }
        >
          {outputLevels.map((level, index) => (
            <span
              key={index}
              className="atena-output-bar w-[2px] origin-bottom opacity-75"
              style={{
                height: showLiveActivity ? level : 2,
                backgroundColor: showLiveActivity
                  ? accentColor
                  : "hsl(var(--muted-foreground))",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
