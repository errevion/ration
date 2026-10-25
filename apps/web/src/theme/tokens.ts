export const TOKENS = {
  colors: {
    canvas: "#faf9f5",
    surface: "#ffffff",
    surfaceSubtle: "#f4f1ea",
    border: "#e5e0d8",
    borderSubtle: "#ede9e1",
    primary: "#be123c",
    primaryHover: "#9f1239",
    primaryMuted: "#ffe4e6",
    textPrimary: "#1c1917",
    textSecondary: "#57534e",
    textMuted: "#a8a29e",
    textOnPrimary: "#ffffff",
    danger: "#dc2626",
    dangerMuted: "#fee2e2",
    success: "#15803d",
    successMuted: "#dcfce7",
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
