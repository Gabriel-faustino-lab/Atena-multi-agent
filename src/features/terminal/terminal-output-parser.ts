export type RichTerminalEventKind =
  | "status"
  | "plan"
  | "thinking"
  | "read"
  | "edit"
  | "create"
  | "command"
  | "test"
  | "success"
  | "error"
  | "diff-add"
  | "diff-remove"
  | "code"
  | "output"

export interface RichTerminalEvent {
  id: number
  kind: RichTerminalEventKind
  text: string
}

export function appendUniqueTerminalEvents(
  current: RichTerminalEvent[],
  incoming: RichTerminalEvent[],
  limit = 400
): RichTerminalEvent[] {
  const merged = [...current]
  for (const event of incoming) {
    const previous = merged.at(-1)
    const sameText =
      previous?.text.trim().replace(/\s+/g, " ") ===
      event.text.trim().replace(/\s+/g, " ")
    if (sameText && previous?.kind === event.kind) continue
    merged.push(event)
  }
  return merged.slice(-limit)
}

const ANSI_PATTERN = new RegExp(
  [
    String.raw`\u001B\][^\u0007]*(?:\u0007|\u001B\\)`,
    String.raw`\u001B\[[0-?]*[ -/]*[@-~]`,
    String.raw`\u001B[@-_]`,
  ].join("|"),
  "g"
)

export function cleanTerminalText(value: string): string {
  return Array.from(value.replace(ANSI_PATTERN, ""))
    .filter((character) => {
      const code = character.charCodeAt(0)
      return code > 26 || code === 9 || code === 10 || code === 13
    })
    .join("")
}

export function classifyTerminalLine(line: string): RichTerminalEventKind {
  const text = line.trim()
  if (/^\+\+\+|^@@|^\+[^+]/.test(text)) return "diff-add"
  if (/^---|^-[^-]/.test(text)) return "diff-remove"
  if (/\b(error|failed|failure|falhou|erro|exception|fatal)\b/i.test(text))
    return "error"
  if (
    /\b(passed|success|succeeded|conclu[ií]d|finalizad|feito)\b|^[✓✔]/i.test(
      text
    )
  )
    return "success"
  if (/\b(test|vitest|jest|playwright|build|lint|typecheck|tsc)\b/i.test(text))
    return "test"
  if (
    /\b(created?|creating|criou|criando|new file|added file|write file)\b/i.test(
      text
    )
  )
    return "create"
  if (
    /\b(updated?|editing|edited|modify|modified|patch|alterad|editando)\b/i.test(
      text
    )
  )
    return "edit"
  if (
    /\b(read|reading|opened?|inspect|grep|glob|search|listando|lendo)\b/i.test(
      text
    )
  )
    return "read"
  if (
    /^(?:[$❯›>]|ran\b|running\b|execut(?:ando|ed)\b)|\b(shell|bash|powershell)\b/i.test(
      text
    )
  )
    return "command"
  if (
    /\b(plan|todo|task|etapa|step|delegad|recebeu uma nova tarefa)\b/i.test(
      text
    )
  )
    return "plan"
  if (
    /\b(thinking|working|analyzing|reasoning|pensando|analisando|desenvolvendo)\b/i.test(
      text
    )
  )
    return "thinking"
  if (/^\[Atena\]|aguardando|iniciando agente/i.test(text)) return "status"
  if (
    /^(?:<\/?[a-z]|[{}]|\.[a-z_-][\w-]*\s*\{|[#.]?[a-z_-][\w-]*\s*[:=])/i.test(
      text
    )
  )
    return "code"
  return "output"
}

export function terminalChunkToEvents(
  previousRemainder: string,
  chunk: string,
  firstId: number
): { events: RichTerminalEvent[]; remainder: string; nextId: number } {
  const normalized = cleanTerminalText(previousRemainder + chunk).replace(
    /\r(?!\n)/g,
    "\n"
  )
  const lines = normalized.split(/\r?\n/)
  const remainder = lines.pop() ?? ""
  let nextId = firstId
  const events = lines
    .map((line) => line.trimEnd())
    .filter((line) => line.trim().length > 1)
    .map((text) => ({
      id: nextId++,
      kind: classifyTerminalLine(text),
      text,
    }))

  return { events, remainder, nextId }
}
