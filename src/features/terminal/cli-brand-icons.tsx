import type { SVGProps } from "react"
import codexOfficialIcon from "@/assets/codex-official.png"

type IconProps = SVGProps<SVGSVGElement>

function BrandSvg({ children, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" role="img" aria-hidden="true" {...props}>
      {children}
    </svg>
  )
}

export function OpenCodeIcon(props: IconProps) {
  return (
    <BrandSvg {...props}>
      <path fill="currentColor" d="M22 24H2V0h20zM17 4.8H7v14.4h10z" />
    </BrandSvg>
  )
}

export function ClaudeCodeIcon(props: IconProps) {
  return (
    <BrandSvg {...props}>
      <path
        fill="currentColor"
        d="M21 10.5h3v3h-3v3h-1.5v3H18v-3h-1.5v3H15v-3H9v3H7.5v-3H6v3H4.5v-3H3v-3H0v-3h3v-6h18Zm-15 0h1.5v-3H6Zm10.5 0H18v-3h-1.5Z"
      />
    </BrandSvg>
  )
}

export function CodexIcon(props: IconProps) {
  return (
    <BrandSvg {...props}>
      <image
        href={codexOfficialIcon}
        width="24"
        height="24"
        preserveAspectRatio="xMidYMid slice"
      />
    </BrandSvg>
  )
}

export function OllamaIcon(props: IconProps) {
  return (
    <BrandSvg {...props}>
      <path
        fill="currentColor"
        d="M7.1 3.1c.2-1.8 1-3.1 2-3.1 1.1 0 1.8 1.4 2 3.3.6-.2 1.2-.3 1.8-.3.7 0 1.3.1 1.9.3.2-1.9.9-3.3 2-3.3 1.2 0 2 1.7 2 3.9 0 .8-.1 1.6-.3 2.2 1.6 1.4 2.5 3.5 2.5 5.8 0 2.1-.7 3.8-1.8 5.1.6 1.8.7 4.1.1 5.5H17c.4-1.2.3-2.8-.1-4.1-1.1.6-2.5.9-4 .9s-2.9-.3-4-.9c-.4 1.3-.5 2.9-.1 4.1H6.5c-.6-1.4-.5-3.7.1-5.5-1.1-1.3-1.8-3-1.8-5.1 0-2.3.9-4.4 2.5-5.8-.2-.7-.3-1.5-.2-2.3Zm2.1 7.2a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm7.5 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm-6.3 3.2c.2 1 1.1 1.7 2.5 1.7s2.3-.7 2.5-1.7c-.8.4-1.6.5-2.5.5s-1.7-.1-2.5-.5Z"
      />
    </BrandSvg>
  )
}

export function AntigravityIcon(props: IconProps) {
  return (
    <BrandSvg {...props}>
      <defs>
        <linearGradient id="antigravity-brand" x1="3" y1="21" x2="20" y2="3">
          <stop stopColor="#4285F4" />
          <stop offset=".36" stopColor="#34A853" />
          <stop offset=".65" stopColor="#FBBC05" />
          <stop offset="1" stopColor="#EA4335" />
        </linearGradient>
      </defs>
      <path
        fill="none"
        stroke="url(#antigravity-brand)"
        strokeLinecap="round"
        strokeWidth="4.2"
        d="M4.2 19.5 9.7 5.7c.8-2 3.7-2 4.5 0l5.6 13.8M7 13.2h10"
      />
    </BrandSvg>
  )
}
