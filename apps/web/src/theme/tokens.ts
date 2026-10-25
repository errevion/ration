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
    sm: "6px",
    md: "10px",
    lg: "14px",
    card: "18px",
    pill: "9999px",
  },
  spacing: {
    xs: "4px",
    sm: "8px",
    md: "12px",
    lg: "16px",
    xl: "20px",
    xxl: "24px",
  },
} as const;

export type ThemeTokens = typeof TOKENS;
