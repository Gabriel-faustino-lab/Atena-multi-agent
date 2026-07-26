import { useEffect, useState } from "react"
import { Bot, Braces, Cpu, Server, ShieldCheck, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import {
  catalogForCli,
  cliCatalog,
  defaultOrchestratorSetup,
  effortsForSelection,
  roleMeta,
  type OrchestratorSetup,
  type SquadRole,
} from "./orchestrator-setup"

interface Props {
  open: boolean
  workspaceName: string
  initialValue?: OrchestratorSetup
  onCancel: () => void
  onStart: (setup: OrchestratorSetup) => void
}

const roleIcons: Record<SquadRole, typeof Cpu> = {
  orchestrator: Cpu,
  frontend: Braces,
  backend: Server,
  security: ShieldCheck,
}

export function OrchestratorSetupDialog({
  open,
  workspaceName,
  initialValue = defaultOrchestratorSetup,
  onCancel,
  onStart,
}: Props) {
  const [setup, setSetup] = useState(initialValue)
  const [customCliRoles, setCustomCliRoles] = useState<Set<SquadRole>>(
    new Set()
  )
  const [customModelRoles, setCustomModelRoles] = useState<Set<SquadRole>>(
    new Set()
  )

  useEffect(() => {
    setSetup(initialValue)
    setCustomCliRoles(
      new Set(
        initialValue.assignments
          .filter((assignment) => !catalogForCli(assignment.cli))
          .map((assignment) => assignment.role)
      )
    )
    setCustomModelRoles(
      new Set(
        initialValue.assignments
          .filter((assignment) => {
            const catalog = catalogForCli(assignment.cli)
            return Boolean(
              catalog &&
              !catalog.manualModel &&
              assignment.model &&
              !catalog.models.some((model) => model.id === assignment.model)
            )
          })
          .map((assignment) => assignment.role)
      )
    )
  }, [initialValue, open])

  function update(
    role: SquadRole,
    values: Partial<{ cli: string; model: string; effort: string }>
  ) {
    setSetup((current) => ({
      ...current,
      assignments: current.assignments.map((item) =>
        item.role === role
          ? {
              ...item,
              ...values,
              model:
                values.cli !== undefined && values.cli !== item.cli
                  ? ""
                  : (values.model ?? item.model),
              effort:
                values.cli !== undefined && values.cli !== item.cli
                  ? ""
                  : (values.effort ?? item.effort),
            }
          : item
      ),
    }))
  }

  function setCustom(
    setter: React.Dispatch<React.SetStateAction<Set<SquadRole>>>,
    role: SquadRole,
    enabled: boolean
  ) {
    setter((current) => {
      const next = new Set(current)
      if (enabled) next.add(role)
      else next.delete(role)
      return next
    })
  }

  const valid = setup.assignments.every(
    (assignment) =>
      assignment.cli.trim() &&
      (catalogForCli(assignment.cli)?.manualModel
        ? assignment.model.trim()
        : true)
  )

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onCancel()}>
      <DialogContent className="max-h-[calc(100vh-32px)] w-[calc(100vw-32px)] max-w-4xl overflow-x-hidden overflow-y-auto p-0">
        <DialogHeader className="border-b border-[hsl(var(--border))] px-5 py-4">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-[hsl(var(--accent))]">
            <Sparkles className="h-3 w-3" /> preparar execução
          </div>
          <DialogTitle className="mt-1 text-base">
            Monte o squad do projeto
          </DialogTitle>
          <DialogDescription>
            Escolha uma CLI e um modelo compatível para cada função em{" "}
            {workspaceName}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2.5 px-4 py-4 sm:px-5">
          {setup.assignments.map((assignment, index) => {
            const meta = roleMeta[assignment.role]
            const Icon = roleIcons[assignment.role]
            const primary = assignment.role === "orchestrator"
            const catalog = catalogForCli(assignment.cli)
            const customCli = customCliRoles.has(assignment.role)
            const customModel =
              customModelRoles.has(assignment.role) || catalog?.manualModel
            const effortOptions = effortsForSelection(
              assignment.cli,
              assignment.model
            )

            return (
              <fieldset
                key={assignment.role}
                className={cn(
                  "min-w-0 border p-3 sm:p-4",
                  primary
                    ? "border-[hsl(var(--accent)/0.55)] bg-[hsl(var(--accent)/0.06)]"
                    : "border-[hsl(var(--border))] bg-[hsl(var(--background)/0.35)]"
                )}
              >
                <legend className="sr-only">
                  Configuração de {meta.label}
                </legend>
                <div className="flex min-w-0 items-start gap-3">
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center border",
                      primary
                        ? "border-[hsl(var(--accent)/0.5)] text-[hsl(var(--accent))]"
                        : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-[9px] text-[hsl(var(--muted))]">
                        0{index + 1}
                      </span>
                      <p className="text-xs font-semibold">{meta.label}</p>
                      {primary && (
                        <span className="border border-[hsl(var(--accent)/0.4)] px-1.5 py-0.5 text-[8px] uppercase tracking-wider text-[hsl(var(--accent))]">
                          controlador
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[10px] leading-relaxed text-[hsl(var(--muted-foreground))]">
                      {meta.description}
                    </p>
                  </div>
                </div>

                <div className="mt-3 grid min-w-0 gap-3 sm:grid-cols-[minmax(120px,0.8fr)_minmax(190px,1.4fr)_minmax(105px,0.7fr)] sm:items-end">
                  <label className="grid min-w-0 gap-1.5 text-[9px] uppercase tracking-wider text-[hsl(var(--muted))]">
                    CLI
                    {customCli ? (
                      <Input
                        autoFocus
                        className="h-8 text-xs normal-case"
                        value={assignment.cli}
                        onChange={(event) =>
                          update(assignment.role, { cli: event.target.value })
                        }
                        placeholder="ex.: aider, gemini"
                      />
                    ) : (
                      <Select
                        className="h-8 text-xs normal-case"
                        value={assignment.cli}
                        onChange={(event) => {
                          const custom = event.target.value === "__custom__"
                          setCustom(setCustomCliRoles, assignment.role, custom)
                          setCustom(setCustomModelRoles, assignment.role, false)
                          update(assignment.role, {
                            cli: custom ? "" : event.target.value,
                          })
                        }}
                      >
                        {cliCatalog.map((entry) => (
                          <option key={entry.id} value={entry.id}>
                            {entry.label}
                          </option>
                        ))}
                        <option value="__custom__">Outra CLI...</option>
                      </Select>
                    )}
                  </label>

                  <label className="grid min-w-0 gap-1.5 text-[9px] uppercase tracking-wider text-[hsl(var(--muted))]">
                    Modelo de IA
                    {customModel || customCli ? (
                      <Input
                        className="h-8 text-xs normal-case"
                        value={assignment.model}
                        onChange={(event) =>
                          update(assignment.role, { model: event.target.value })
                        }
                        placeholder={
                          catalog?.manualModel
                            ? "modelo instalado localmente"
                            : "identificador do modelo"
                        }
                      />
                    ) : (
                      <Select
                        className="h-8 text-xs normal-case"
                        value={assignment.model}
                        onChange={(event) => {
                          const custom = event.target.value === "__custom__"
                          setCustom(
                            setCustomModelRoles,
                            assignment.role,
                            custom
                          )
                          update(assignment.role, {
                            model: custom ? "" : event.target.value,
                            effort: "",
                          })
                        }}
                      >
                        <option value="">Padrão automático</option>
                        {catalog?.id === "opencode" ? (
                          <>
                            <optgroup label="OpenCode Zen · gratuitos">
                              {catalog.models
                                .filter((model) => model.tier === "free")
                                .map((model) => (
                                  <option key={model.id} value={model.id}>
                                    {model.label}
                                  </option>
                                ))}
                            </optgroup>
                            <optgroup label="OpenCode Zen · pagos por uso">
                              {catalog.models
                                .filter((model) => model.tier === "paid")
                                .map((model) => (
                                  <option key={model.id} value={model.id}>
                                    {model.label}
                                  </option>
                                ))}
                            </optgroup>
                            <optgroup label="OpenCode Go · assinatura">
                              {catalog.models
                                .filter((model) => model.tier === "go")
                                .map((model) => (
                                  <option key={model.id} value={model.id}>
                                    {model.label}
                                  </option>
                                ))}
                            </optgroup>
                          </>
                        ) : (
                          catalog?.models.map((model) => (
                            <option key={model.id} value={model.id}>
                              {model.label}
                            </option>
                          ))
                        )}
                        <option value="__custom__">Outro modelo...</option>
                      </Select>
                    )}
                  </label>

                  <label className="grid min-w-0 gap-1.5 text-[9px] uppercase tracking-wider text-[hsl(var(--muted))]">
                    Esforço
                    <Select
                      className="h-8 text-xs normal-case"
                      value={assignment.effort}
                      disabled={effortOptions.length === 0}
                      title={
                        effortOptions.length === 0
                          ? "Esta CLI não oferece um controle de esforço padronizado"
                          : "Controla profundidade, custo e tempo de raciocínio"
                      }
                      onChange={(event) =>
                        update(assignment.role, { effort: event.target.value })
                      }
                    >
                      <option value="">Automático</option>
                      {effortOptions.map((effort) => (
                        <option key={effort} value={effort}>
                          {effort === "none"
                            ? "Nenhum"
                            : effort === "minimal"
                              ? "Mínimo"
                              : effort === "low"
                                ? "Baixo"
                                : effort === "medium"
                                  ? "Médio"
                                  : effort === "high"
                                    ? "Alto"
                                    : effort === "xhigh"
                                      ? "Extra alto"
                                      : "Máximo"}
                        </option>
                      ))}
                    </Select>
                  </label>
                </div>
              </fieldset>
            )
          })}
        </div>

        <DialogFooter className="flex-wrap items-center border-t border-[hsl(var(--border))] px-4 py-3 sm:px-5">
          <div className="mr-auto hidden items-center gap-1.5 text-[9px] text-[hsl(var(--muted-foreground))] sm:flex">
            <Bot className="h-3 w-3" /> modelos personalizados continuam
            disponíveis
          </div>
          <Button variant="ghost" onClick={onCancel}>
            Voltar
          </Button>
          <Button onClick={() => onStart(setup)} disabled={!valid}>
            <Cpu className="h-3.5 w-3.5" /> Iniciar orquestrador
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
