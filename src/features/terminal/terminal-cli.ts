import {
  Box,
  Braces,
  Boxes,
  Cog,
  FileCode2,
  GitBranch,
  Package,
  SquareTerminal,
  Terminal,
} from "lucide-react"
import type { ComponentType, SVGProps } from "react"
import {
  AntigravityIcon,
  ClaudeCodeIcon,
  CodexIcon,
  OllamaIcon,
  OpenCodeIcon,
} from "./cli-brand-icons"

type CliIcon = ComponentType<SVGProps<SVGSVGElement>>

export interface CliAppearance {
  label: string
  color: string
  icon: CliIcon
}

const CLI_APPEARANCES: Array<[string[], CliAppearance]> = [
  [
    ["claude", "claude-code", "claudecode"],
    { label: "Claude", color: "#D97757", icon: ClaudeCodeIcon },
  ],
  [
    ["codex", "codex-cli", "openai-codex", "openai"],
    { label: "Codex", color: "#10A37F", icon: CodexIcon },
  ],
  [["opencode"], { label: "OpenCode", color: "#2684FF", icon: OpenCodeIcon }],
  [
    ["agy", "antigravity"],
    { label: "Antigravity", color: "#4285F4", icon: AntigravityIcon },
  ],
  [["ollama"], { label: "Ollama", color: "#111111", icon: OllamaIcon }],
  [
    ["powershell", "pwsh"],
    { label: "PowerShell", color: "#3977D5", icon: SquareTerminal },
  ],
  [["npm", "npx"], { label: "npm", color: "#CB3837", icon: Package }],
  [["pnpm"], { label: "pnpm", color: "#E99A00", icon: Boxes }],
  [["yarn"], { label: "Yarn", color: "#2C8EBB", icon: Box }],
  [["bun"], { label: "Bun", color: "#E85D75", icon: Braces }],
  [["node"], { label: "Node", color: "#4F8F44", icon: Cog }],
  [
    ["python", "python3", "py"],
    { label: "Python", color: "#3776AB", icon: FileCode2 },
  ],
  [["git", "gh"], { label: "Git", color: "#F05032", icon: GitBranch }],
  [["cargo", "rustc"], { label: "Rust", color: "#CE422B", icon: Cog }],
]

export function getCliAppearance(cli: string): CliAppearance {
  const normalized = cli.trim().toLowerCase()
  const match = CLI_APPEARANCES.find(([aliases]) =>
    aliases.some(
      (alias) =>
        normalized === alias ||
        normalized.startsWith(`${alias}-`) ||
        normalized.startsWith(`${alias}.`)
    )
  )
  if (match) return match[1]
  return {
    label: cli.trim() || "Shell",
    color: "#8B949E",
    icon: Terminal,
  }
}
