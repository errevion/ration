export const TOKENS = {
  colors: {
    canvas: "#0a0a0b",
    surface: "#141416",
    surfaceElevated: "#1c1c20",
    surfaceSubtle: "#18181b",
    border: "#26262a",
    borderSubtle: "#1f1f23",
    primary: "#ffe500",
    primaryHover: "#f5dc00",
    primaryMuted: "#2a2700",
    textPrimary: "#ffffff",
    textSecondary: "#a1a1aa",
    textMuted: "#71717a",
    textOnPrimary: "#0a0a0b",
    danger: "#ef4444",
    dangerMuted: "#2b1414",
    success: "#22c55e",
    successMuted: "#112417",
  },
  radii: {
    sm: 6,
    md: 10,
    lg: 14,
    card: 18,
    pill: 9999,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
  },
} as const;

export type ThemeTokens = typeof TOKENS;
