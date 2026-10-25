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
