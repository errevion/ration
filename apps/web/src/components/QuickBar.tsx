import type React from "react";
import { useI18n } from "../i18n/index.js";
import { TOKENS } from "../theme/tokens.js";
import { formatMetricAmount } from "../utils/formatters.js";

interface QuickBarProps {
  currency: string;
  todayQuota: number;
  spentToday: number;
  onOpenAdd: () => void;
  onOpenSpend: () => void;
}

export const QuickBar: React.FC<QuickBarProps> = ({
  currency,
  todayQuota,
  spentToday,
  onOpenAdd,
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
        gap: TOKENS.spacing.sm,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
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
              fontSize: "18px",
              fontWeight: 800,
              color: TOKENS.colors.textPrimary,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {currency}
            {formatMetricAmount(todayQuota)}
          </span>
          {spentToday > 0 && (
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: TOKENS.colors.textSecondary,
                whiteSpace: "nowrap",
              }}
            >
              ({t("tracker.spentToday", { amount: `${currency}${formatMetricAmount(spentToday)}` })}
              )
            </span>
          )}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: TOKENS.spacing.xs }}>
        <button
          type="button"
          onClick={onOpenAdd}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            backgroundColor: TOKENS.colors.surfaceElevated,
            color: TOKENS.colors.textPrimary,
            border: `1px solid ${TOKENS.colors.border}`,
            borderRadius: TOKENS.radii.pill,
            padding: `${TOKENS.spacing.sm} ${TOKENS.spacing.md}`,
            fontSize: "13px",
            fontWeight: 700,
            cursor: "pointer",
            outline: "none",
          }}
        >
          <span>+</span>
          <span>{t("tracker.add")}</span>
        </button>

        <button
          type="button"
          onClick={onOpenSpend}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            backgroundColor: TOKENS.colors.primary,
            color: TOKENS.colors.textOnPrimary,
            border: "none",
            borderRadius: TOKENS.radii.pill,
            padding: `${TOKENS.spacing.sm} ${TOKENS.spacing.lg}`,
            fontSize: "13px",
            fontWeight: 700,
            cursor: "pointer",
            outline: "none",
          }}
        >
          <span>-</span>
          <span>{t("tracker.spend")}</span>
        </button>
      </div>
    </div>
  );
};
