import { useEffect, useMemo, useRef } from "react"
import {
  AlertTriangle,
  Check,
  ChevronRight,
  CircleDot,
  FileCode2,
  FilePlus2,
  FlaskConical,
  ListChecks,
  Search,
  Sparkles,
  SquareTerminal,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type {
  RichTerminalEvent,
  RichTerminalEventKind,
} from "./terminal-output-parser"
import { appendUniqueTerminalEvents } from "./terminal-output-parser"

interface RichTerminalOutputProps {
  events: RichTerminalEvent[]
  active: boolean
  accentColor: string
  agentName: string
}

const eventAppearance: Record<
  RichTerminalEventKind,
  { label: string; className: string; icon: typeof CircleDot }
> = {
  status: {
    label: "ATENA",
    className: "text-[hsl(var(--muted-foreground))]",
    icon: CircleDot,
  },
  plan: {
    label: "PLANO",
    className: "text-violet-400",
    icon: ListChecks,
  },
  thinking: {
    label: "PENSANDO",
    className: "text-amber-300",
    icon: Sparkles,
  },
  read: { label: "LEITURA", className: "text-sky-400", icon: Search },
  edit: { label: "EDIÇÃO", className: "text-cyan-300", icon: FileCode2 },
  create: {
    label: "CRIADO",
    className: "text-emerald-300",
    icon: FilePlus2,
  },
  command: {
    label: "COMANDO",
    className: "text-blue-300",
    icon: SquareTerminal,
  },
  test: {
    label: "VALIDAÇÃO",
    className: "text-fuchsia-300",
    icon: FlaskConical,
  },
  success: {
    label: "CONCLUÍDO",
    className: "text-emerald-400",
    icon: Check,
  },
  error: {
    label: "ATENÇÃO",
    className: "text-red-400",
    icon: AlertTriangle,
  },
  "diff-add": {
    label: "ADICIONADO",
    className: "text-emerald-400",
    icon: ChevronRight,
  },
  "diff-remove": {
    label: "REMOVIDO",
    className: "text-red-400",
    icon: ChevronRight,
  },
  code: {
    label: "CÓDIGO",
    className: "text-slate-400",
    icon: FileCode2,
  },
  output: {
    label: "SAÍDA",
    className: "text-[hsl(var(--muted-foreground))]",
    icon: ChevronRight,
  },
}

interface EventGroup {
  id: number
  key: string
  kind: RichTerminalEventKind
  label?: string
  events: RichTerminalEvent[]
}

function groupKey(kind: RichTerminalEventKind): string {
  if (kind === "diff-add" || kind === "diff-remove") return "changes"
  if (kind === "code" || kind === "output") return "code"
  return kind
}

export function RichTerminalOutput({
  events,
  active,
  accentColor,
  agentName,
}: RichTerminalOutputProps) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const groups = useMemo(
    () =>
      appendUniqueTerminalEvents([], events).reduce<EventGroup[]>(
        (result, event) => {
          const key = groupKey(event.kind)
          const previous = result.at(-1)
          if (previous?.key === key) {
            previous.events.push(event)
            return result
          }
          result.push({
            id: event.id,
            key,
            kind:
              key === "changes" ? "edit" : key === "code" ? "code" : event.kind,
            label: key === "changes" ? "ALTERAÇÕES" : undefined,
            events: [event],
          })
          return result
        },
        []
      ),
    [events]
  )

  useEffect(() => {
    const viewport = viewportRef.current
    if (viewport) viewport.scrollTop = viewport.scrollHeight
  }, [events])

  return (
    <div
      ref={viewportRef}
      className="h-full overflow-y-auto bg-[#080a0b] px-3 py-3"
      aria-label={`Atividade formatada de ${agentName}`}
    >
      {events.length === 0 ? (
        <div className="flex h-full min-h-36 items-center justify-center">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                active && "atena-live-dot"
              )}
              style={{ backgroundColor: active ? accentColor : undefined }}
            />
            {active ? "Preparando o fluxo do agente" : "Aguardando atividade"}
          </div>
        </div>
      ) : (
        <div className="relative pl-5">
          <div
            className="absolute bottom-2 left-[5px] top-2 w-px opacity-30"
            style={{ backgroundColor: accentColor }}
            aria-hidden="true"
          />
          {groups.map((group, index) => {
            const appearance = eventAppearance[group.kind]
            const Icon = appearance.icon
            const isLatest = index === groups.length - 1
            return (
              <div
                key={group.id}
                className={cn(
                  "atena-rich-event relative grid grid-cols-[5.5rem_minmax(0,1fr)] gap-2 border-b border-white/[0.035] py-1.5",
                  isLatest && active && "bg-white/[0.018]"
                )}
              >
                <span
                  className="absolute -left-5 top-[11px] h-[11px] w-[11px] rounded-full border bg-[#080a0b]"
                  style={{ borderColor: `${accentColor}90` }}
                >
                  {isLatest && active && (
                    <span
                      className="absolute inset-[3px] rounded-full"
                      style={{ backgroundColor: accentColor }}
                    />
                  )}
                </span>
                <span
                  className={cn(
                    "flex items-center gap-1 text-[8px] font-semibold tracking-[0.12em]",
                    appearance.className
                  )}
                >
                  <Icon className="h-3 w-3 shrink-0" />
                  {group.label ?? appearance.label}
                </span>
                <div className="min-w-0 overflow-hidden">
                  {group.events.map((event) => (
                    <code
                      key={event.id}
                      className={cn(
                        "block min-w-0 whitespace-pre-wrap break-words px-1 text-[10px] leading-[1.55] text-[#c7cbd1]",
                        event.kind === "diff-add" &&
                          "bg-emerald-500/[0.06] text-emerald-300",
                        event.kind === "diff-remove" &&
                          "bg-red-500/[0.06] text-red-300",
                        event.kind === "error" && "text-red-300",
                        event.kind === "success" && "text-emerald-300",
                        group.key === "code" &&
                          "border-l border-white/[0.06] bg-white/[0.018] text-[#aeb5bf]"
                      )}
                    >
                      {event.text}
                    </code>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
