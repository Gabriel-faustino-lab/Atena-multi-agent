import { useCallback, useState } from "react"
import { Folder, Plus, X } from "lucide-react"
import { ThemeProvider } from "@/lib/theme"
import { ToastProvider } from "@/components/ui/toast"
import { WindowTitlebar } from "@/components/layout/window-titlebar"
import { UpdateManager } from "@/components/update-manager"
import { WorkspaceSelection } from "@/features/workspaces/workspace-selection"
import { WorkspaceView } from "@/features/workspaces/workspace-view"
import { OrchestratorSetupDialog } from "@/features/agents/orchestrator-setup-dialog"
import {
  defaultOrchestratorSetup,
  parseOrchestratorSetup,
  type OrchestratorSetup,
} from "@/features/agents/orchestrator-setup"
import { useWorkspaces } from "@/features/workspaces/use-workspaces"
import { getSetting } from "@/lib/db"
import type { Workspace } from "@/types"

interface OpenWorkspaceSession {
  workspace: Workspace
  setup: OrchestratorSetup
}

function AppContent() {
  const { workspaces, loading, create, remove } = useWorkspaces()
  const [openSessions, setOpenSessions] = useState<OpenWorkspaceSession[]>([])
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(
    null
  )
  const [workspacePickerOpen, setWorkspacePickerOpen] = useState(true)
  const [pendingWorkspace, setPendingWorkspace] = useState<Workspace | null>(
    null
  )
  const [pendingSetup, setPendingSetup] = useState<OrchestratorSetup>(
    defaultOrchestratorSetup
  )
  const handleCreate = useCallback(
    async (name: string, path: string, description: string) => {
      try {
        await create(name, path, description)
      } catch (err) {
        console.error("Failed to create workspace:", err)
      }
    },
    [create]
  )

  const handleOpen = useCallback(async (workspace: Workspace) => {
    setPendingSetup(defaultOrchestratorSetup)
    setPendingWorkspace(workspace)
    try {
      const saved = await getSetting(`orchestrator.setup.${workspace.id}`)
      setPendingSetup(parseOrchestratorSetup(saved))
    } catch {
      setPendingSetup(defaultOrchestratorSetup)
    }
  }, [])

  const handleStart = useCallback(
    (setup: OrchestratorSetup) => {
      if (!pendingWorkspace) return
      setOpenSessions((current) => {
        const existing = current.find(
          (session) => session.workspace.id === pendingWorkspace.id
        )
        if (existing) return current
        return [...current, { workspace: pendingWorkspace, setup }]
      })
      setActiveWorkspaceId(pendingWorkspace.id)
      setWorkspacePickerOpen(false)
      setPendingWorkspace(null)
    },
    [pendingWorkspace]
  )

  const handleRemove = useCallback(
    async (id: string) => {
      try {
        await remove(id)
      } catch (err) {
        console.error("Failed to delete workspace:", err)
      }
    },
    [remove]
  )

  const closeWorkspace = useCallback((workspaceId: string) => {
    setOpenSessions((current) => {
      const closingIndex = current.findIndex(
        (session) => session.workspace.id === workspaceId
      )
      const next = current.filter(
        (session) => session.workspace.id !== workspaceId
      )
      setActiveWorkspaceId((activeId) => {
        if (activeId !== workspaceId) return activeId
        const fallback =
          next[Math.min(Math.max(closingIndex, 0), next.length - 1)]
        return fallback?.workspace.id ?? null
      })
      if (next.length === 0) setWorkspacePickerOpen(true)
      return next
    })
  }, [])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          Carregando...
        </p>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {openSessions.length > 0 && (
        <nav
          className="flex h-9 shrink-0 items-stretch border-b border-[hsl(var(--border))] bg-[hsl(var(--panel))]"
          aria-label="Projetos abertos"
        >
          <div className="flex min-w-0 flex-1 overflow-x-auto">
            {openSessions.map(({ workspace }) => {
              const active =
                !workspacePickerOpen && activeWorkspaceId === workspace.id
              return (
                <div
                  key={workspace.id}
                  className={`group flex min-w-36 max-w-56 items-center border-r border-[hsl(var(--border))] ${
                    active
                      ? "bg-[hsl(var(--background))] text-[hsl(var(--foreground))] shadow-[inset_0_2px_0_hsl(var(--accent))]"
                      : "text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--panel-elevated))]"
                  }`}
                >
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-center gap-2 px-3 text-left"
                    onClick={() => {
                      setActiveWorkspaceId(workspace.id)
                      setWorkspacePickerOpen(false)
                    }}
                    aria-current={active ? "page" : undefined}
                  >
                    <Folder className="h-3 w-3 shrink-0 text-[hsl(var(--accent))]" />
                    <span className="truncate text-[10px] font-medium">
                      {workspace.name}
                    </span>
                  </button>
                  <button
                    type="button"
                    className="mr-1 flex h-6 w-6 shrink-0 items-center justify-center opacity-50 transition-colors hover:bg-[hsl(var(--danger)/0.15)] hover:text-[hsl(var(--danger))] hover:opacity-100"
                    onClick={() => closeWorkspace(workspace.id)}
                    aria-label={`Fechar ${workspace.name}`}
                    title={`Fechar ${workspace.name} e seus terminais`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )
            })}
          </div>
          <button
            type="button"
            className={`flex w-10 shrink-0 items-center justify-center border-l border-[hsl(var(--border))] transition-colors hover:bg-[hsl(var(--panel-elevated))] hover:text-[hsl(var(--accent))] ${
              workspacePickerOpen
                ? "bg-[hsl(var(--background))] text-[hsl(var(--accent))]"
                : "text-[hsl(var(--muted-foreground))]"
            }`}
            onClick={() => setWorkspacePickerOpen(true)}
            aria-label="Abrir outro projeto"
            title="Abrir outro projeto"
          >
            <Plus className="h-4 w-4" />
          </button>
        </nav>
      )}

      <div className="relative isolate min-h-0 flex-1 overflow-hidden">
        <div
          className={`absolute inset-0 z-20 bg-[hsl(var(--background))] ${workspacePickerOpen ? "block" : "hidden"}`}
          aria-hidden={!workspacePickerOpen}
        >
          <WorkspaceSelection
            workspaces={workspaces}
            onCreate={handleCreate}
            onOpen={handleOpen}
            onRemove={handleRemove}
          />
        </div>

        {openSessions.map((session) => {
          const active =
            !workspacePickerOpen && activeWorkspaceId === session.workspace.id
          return (
            <div
              key={session.workspace.id}
              className={`absolute inset-0 z-0 ${active ? "block" : "hidden"}`}
              aria-hidden={!active}
            >
              <WorkspaceView
                workspace={session.workspace}
                initialSetup={session.setup}
                onBack={() => closeWorkspace(session.workspace.id)}
              />
            </div>
          )
        })}
      </div>

      <OrchestratorSetupDialog
        open={pendingWorkspace !== null}
        workspaceName={pendingWorkspace?.name ?? ""}
        initialValue={pendingSetup}
        onCancel={() => setPendingWorkspace(null)}
        onStart={handleStart}
      />
    </div>
  )
}

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <div className="flex h-screen flex-col overflow-hidden bg-[hsl(var(--background))]">
          <WindowTitlebar />
          <div className="min-h-0 flex-1">
            <AppContent />
          </div>
        </div>
        <UpdateManager />
      </ToastProvider>
    </ThemeProvider>
  )
}

export default App
