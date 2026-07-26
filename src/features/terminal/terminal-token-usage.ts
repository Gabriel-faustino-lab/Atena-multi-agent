export interface TokenUsage {
  input?: number
  output?: number
  total?: number
}

function parseTokenCount(value: string): number {
  const normalized = value.replace(/,/g, "").toLowerCase()
  const multiplier = normalized.endsWith("k")
    ? 1_000
    : normalized.endsWith("m")
      ? 1_000_000
      : 1
  return Math.round(Number.parseFloat(normalized) * multiplier)
}

export function extractTokenUsage(text: string): TokenUsage | null {
  const input =
    text.match(/"input_tokens"\s*:\s*([\d,.]+[km]?)/i) ??
    text.match(/\binput(?:\s+tokens)?\s*[:=]\s*([\d,.]+[km]?)/i) ??
    text.match(/([\d,.]+[km]?)\s+(?:tokens?\s+)?in\b/i)
  const output =
    text.match(/"output_tokens"\s*:\s*([\d,.]+[km]?)/i) ??
    text.match(/\boutput(?:\s+tokens)?\s*[:=]\s*([\d,.]+[km]?)/i) ??
    text.match(/([\d,.]+[km]?)\s+(?:tokens?\s+)?out\b/i)
  const total = text.match(
    /(?:tokens?\s+used|total\s+tokens?)\s*[:=]?\s*([\d,.]+[km]?)/i
  )
  if (!input && !output && !total) return null
  return {
    input: input ? parseTokenCount(input[1]) : undefined,
    output: output ? parseTokenCount(output[1]) : undefined,
    total: total ? parseTokenCount(total[1]) : undefined,
  }
}

export function compactTokens(value: number): string {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value)
}
