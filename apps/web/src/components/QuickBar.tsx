import type React from "react";
import { useI18n } from "../i18n/index.js";
import { TOKENS } from "../theme/tokens.js";

interface QuickBarProps {
  currency: string;
  todayQuota: number;
  spentToday: number;
  onOpenSpend: () => void;
}

export const QuickBar: React.FC<QuickBarProps> = ({
  currency,
  todayQuota,
  spentToday,
  onOpenSpend,
}) => {
  const { t } = useI18n();

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: TOKENS.colors.surface,
        borderTop: `1px solid ${TOKENS.colors.border}`,
        padding: `${TOKENS.spacing.md} ${TOKENS.spacing.lg}`,
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column" }}>
        <span
          style={{
            fontSize: "11px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            color: TOKENS.colors.textMuted,
          }}
        >
          {t("tracker.today")}
        </span>
        <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
          <span
            style={{
              fontSize: "20px",
              fontWeight: 800,
              color: TOKENS.colors.textPrimary,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {currency}
            {todayQuota}
          </span>
          {spentToday > 0 && (
            <span
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: TOKENS.colors.textSecondary,
              }}
            >
              ({t("tracker.spentToday", { amount: `${currency}${spentToday}` })})
            </span>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={onOpenSpend}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          backgroundColor: TOKENS.colors.primary,
          color: TOKENS.colors.textOnPrimary,
          border: "none",
          borderRadius: TOKENS.radii.pill,
          padding: `${TOKENS.spacing.sm} ${TOKENS.spacing.xl}`,
          fontSize: "15px",
          fontWeight: 700,
          cursor: "pointer",
          outline: "none",
          transition: "transform 0.1s ease, background-color 0.1s ease",
        }}
      >
        <span>-</span>
        <span>{t("tracker.spend")}</span>
      </button>
    </div>
  );
};
