import type { MoneyCycle } from "@ration/types";
import {
  Binoculars,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  HandCoins,
  Settings,
  Wallet,
} from "lucide-react";
import type React from "react";
import { useI18n } from "../i18n/index.js";
import { TOKENS } from "../theme/tokens.js";

interface CycleHeaderProps {
  cycle: MoneyCycle;
  foreseeableBalance: number;
  projectedForeseeableBalance?: number;
  actualBalance: number;
  remainingDaysCount: number;
  dailyAllowance?: number;
  projectedDailyAllowance?: number;
  showProjection: boolean;
  cycleOffset: number;
  onToggleProjection: () => void;
  onPrevCycle: () => void;
  onNextCycle: () => void;
  onResetCycle: () => void;
  onOpenSettings: () => void;
  onOpenAccounts: () => void;
  onOpenPlanned: () => void;
  onOpenLoans: () => void;
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
  foreseeableBalance,
  projectedForeseeableBalance,
  actualBalance,
  remainingDaysCount,
  showProjection,
  cycleOffset,
  onToggleProjection,
  onPrevCycle,
  onNextCycle,
  onResetCycle,
  onOpenSettings,
  onOpenAccounts,
  onOpenPlanned,
  onOpenLoans,
}) => {
  const { t } = useI18n();

  const formattedStart = formatDisplayDate(cycle.startDate);
  const formattedEnd = formatDisplayDate(cycle.endDate);
  const cycleRange = `${formattedStart} - ${formattedEnd}`;

  const daysText = t("tracker.daysLeft", { days: remainingDaysCount });
  const actualText = `${t("tracker.actualBalance")}: ${cycle.currency}${actualBalance.toLocaleString()}`;
  const displayedForeseeable =
    showProjection && projectedForeseeableBalance !== undefined
      ? projectedForeseeableBalance
      : foreseeableBalance;

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
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <button
            type="button"
            onClick={onPrevCycle}
            aria-label={t("tracker.prevCycle")}
            style={{
              padding: "4px",
              borderRadius: TOKENS.radii.sm,
              backgroundColor: TOKENS.colors.surfaceElevated,
              border: `1px solid ${TOKENS.colors.borderSubtle}`,
              color: TOKENS.colors.textSecondary,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
            }}
          >
            <ChevronLeft size={16} />
          </button>
          <span
            style={{
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "0.8px",
              color: TOKENS.colors.textSecondary,
              padding: "0 4px",
            }}
          >
            {cycleRange}
          </span>
          <button
            type="button"
            onClick={onNextCycle}
            aria-label={t("tracker.nextCycle")}
            style={{
              padding: "4px",
              borderRadius: TOKENS.radii.sm,
              backgroundColor: TOKENS.colors.surfaceElevated,
              border: `1px solid ${TOKENS.colors.borderSubtle}`,
              color: TOKENS.colors.textSecondary,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
            }}
          >
            <ChevronRight size={16} />
          </button>

          {cycleOffset !== 0 && (
            <button
              type="button"
              onClick={onResetCycle}
              style={{
                backgroundColor: TOKENS.colors.primary,
                border: "none",
                padding: "3px 8px",
                borderRadius: TOKENS.radii.pill,
                fontSize: "10px",
                fontWeight: 700,
                color: TOKENS.colors.textOnPrimary,
                cursor: "pointer",
                marginLeft: "4px",
              }}
            >
              {t("tracker.today")}
            </button>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: TOKENS.spacing.xs }}>
          <button
            type="button"
            onClick={onToggleProjection}
            style={{
              width: "36px",
              height: "36px",
              borderRadius: TOKENS.radii.pill,
              backgroundColor: showProjection
                ? "rgba(255, 229, 0, 0.12)"
                : TOKENS.colors.surfaceElevated,
              border: `1px solid ${showProjection ? TOKENS.colors.primary : TOKENS.colors.borderSubtle}`,
              color: showProjection ? TOKENS.colors.primary : TOKENS.colors.textSecondary,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.15s ease",
            }}
          >
            <Binoculars size={18} />
          </button>

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
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Settings size={18} />
          </button>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "4px",
          padding: `${TOKENS.spacing.sm} 0`,
        }}
      >
        <span
          style={{
            fontSize: "12px",
            fontWeight: 600,
            letterSpacing: "1px",
            textTransform: "uppercase",
            color: TOKENS.colors.textMuted,
          }}
        >
          {showProjection ? t("tracker.projectionLabel") : t("tracker.safeToSpend")}
        </span>
        <span
          style={{
            fontSize: "36px",
            fontWeight: 800,
            color: TOKENS.colors.textPrimary,
            letterSpacing: "-1px",
          }}
        >
          {cycle.currency}
          {displayedForeseeable.toLocaleString()}
        </span>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginTop: "4px",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <span style={{ fontSize: "12px", color: TOKENS.colors.textMuted }}>{actualText}</span>
          <span style={{ fontSize: "12px", color: TOKENS.colors.border }}>|</span>
          <span
            style={{
              fontSize: "12px",
              fontWeight: 600,
              color: TOKENS.colors.textSecondary,
            }}
          >
            {daysText}
          </span>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: TOKENS.spacing.sm,
          justifyContent: "center",
        }}
      >
        <button
          type="button"
          onClick={onOpenAccounts}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            backgroundColor: TOKENS.colors.surfaceElevated,
            border: `1px solid ${TOKENS.colors.borderSubtle}`,
            padding: `${TOKENS.spacing.sm} ${TOKENS.spacing.xs}`,
            borderRadius: TOKENS.radii.pill,
            color: TOKENS.colors.textPrimary,
            fontSize: "12px",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          <Wallet size={15} />
          <span>{t("tracker.accounts")}</span>
        </button>

        <button
          type="button"
          onClick={onOpenPlanned}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            backgroundColor: TOKENS.colors.surfaceElevated,
            border: `1px solid ${TOKENS.colors.borderSubtle}`,
            padding: `${TOKENS.spacing.sm} ${TOKENS.spacing.xs}`,
            borderRadius: TOKENS.radii.pill,
            color: TOKENS.colors.textPrimary,
            fontSize: "12px",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          <CalendarClock size={15} />
          <span>{t("tracker.planned")}</span>
        </button>

        <button
          type="button"
          onClick={onOpenLoans}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            backgroundColor: TOKENS.colors.surfaceElevated,
            border: `1px solid ${TOKENS.colors.borderSubtle}`,
            padding: `${TOKENS.spacing.sm} ${TOKENS.spacing.xs}`,
            borderRadius: TOKENS.radii.pill,
            color: TOKENS.colors.textPrimary,
            fontSize: "12px",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          <HandCoins size={15} />
          <span>{t("tracker.loans")}</span>
        </button>
      </div>
    </div>
  );
};
