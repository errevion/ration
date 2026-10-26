import type { MoneyCycle } from "@ration/types";
import { Settings } from "lucide-react";
import type React from "react";
import { useI18n } from "../i18n/index.js";
import { TOKENS } from "../theme/tokens.js";

interface CycleHeaderProps {
  cycle: MoneyCycle;
  remainingBalance: number;
  remainingDaysCount: number;
  dailyAllowance: number;
  onOpenSettings: () => void;
}

function formatDisplayDate(isoDate: string): string {
  const parts = isoDate.split("-");
  const monthNames = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
  ];
  const day = parts[2];
  const monthIndex = Number(parts[1]) - 1;
  return `${day} ${monthNames[monthIndex] ?? ""}`;
}

export const CycleHeader: React.FC<CycleHeaderProps> = ({
  cycle,
  remainingBalance,
  remainingDaysCount,
  dailyAllowance,
  onOpenSettings,
}) => {
  const { t } = useI18n();

  const formattedStart = formatDisplayDate(cycle.startDate);
  const formattedEnd = formatDisplayDate(cycle.endDate);
  const cycleRange = `${formattedStart} - ${formattedEnd}`;

  const roundedDaily = Math.floor(dailyAllowance);
  const dailyText = `${cycle.currency}${roundedDaily}`;
  const daysText = t("tracker.daysLeft", { days: remainingDaysCount });
  const paceText = t("tracker.perDay", { amount: dailyText });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: TOKENS.spacing.md,
        width: "100%",
        paddingBottom: TOKENS.spacing.md,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontSize: "12px",
            fontWeight: 700,
            letterSpacing: "1px",
            color: TOKENS.colors.textMuted,
            textTransform: "uppercase",
          }}
        >
          {cycleRange}
        </span>

        <button
          type="button"
          onClick={onOpenSettings}
          aria-label={t("settings.title")}
          style={{
            width: "36px",
            height: "36px",
            borderRadius: TOKENS.radii.pill,
            backgroundColor: TOKENS.colors.surfaceElevated,
            border: `1px solid ${TOKENS.colors.borderSubtle}`,
            color: TOKENS.colors.textSecondary,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            padding: 0,
          }}
        >
          <Settings size={18} />
        </button>
      </div>

      <div>
        <div
          style={{
            fontSize: "11px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "1px",
            color: TOKENS.colors.textMuted,
            marginBottom: TOKENS.spacing.xs,
          }}
        >
          {t("tracker.totalBalance")}
        </div>

        <div
          style={{
            fontSize: "44px",
            fontWeight: 800,
            color: TOKENS.colors.textPrimary,
            letterSpacing: "-1px",
            lineHeight: 1.1,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {cycle.currency}
          {remainingBalance.toLocaleString()}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: TOKENS.spacing.xs,
            marginTop: TOKENS.spacing.xs,
            fontSize: "13px",
            fontWeight: 600,
            color: TOKENS.colors.primary,
          }}
        >
          <span>{daysText}</span>
          <span style={{ color: TOKENS.colors.textMuted }}>•</span>
          <span>{paceText}</span>
        </div>
      </div>
    </div>
  );
};
