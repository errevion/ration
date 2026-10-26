import type { DailyAllocation, SpendTransaction } from "@ration/types";
import { X } from "lucide-react";
import type React from "react";
import { useI18n } from "../i18n/index.js";
import { TOKENS } from "../theme/tokens.js";
import { formatCurrency } from "../utils/formatters.js";

interface DayDetailDrawerProps {
  day: DailyAllocation | null;
  currency: string;
  transactions: SpendTransaction[];
  onClose: () => void;
}

export const DayDetailDrawer: React.FC<DayDetailDrawerProps> = ({
  day,
  currency,
  transactions,
  onClose,
}) => {
  const { t } = useI18n();

  const isOpen = Boolean(day);
  const dayTransactions = day ? transactions.filter((tx) => tx.date === day.date) : [];

  const displayAmount = day ? (day.isPast ? day.spentAmount : day.projectedQuota) : 0;
  const statusLabel = day?.isPast
    ? t("tracker.spentToday", { amount: formatCurrency(day.spentAmount, currency) })
    : t("tracker.dailyBudget");

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        alignItems: "center",
        zIndex: 1000,
        opacity: isOpen ? 1 : 0,
        pointerEvents: isOpen ? "auto" : "none",
        transition: "opacity 0.25s ease-out",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "430px",
          backgroundColor: TOKENS.colors.surface,
          borderTop: `1px solid ${TOKENS.colors.border}`,
          borderTopLeftRadius: TOKENS.radii.card,
          borderTopRightRadius: TOKENS.radii.card,
          padding: TOKENS.spacing.lg,
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          gap: TOKENS.spacing.md,
          maxHeight: "85vh",
          overflowY: "auto",
          overflowX: "hidden",
          transform: isOpen ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "16px",
                fontWeight: 700,
                color: TOKENS.colors.textPrimary,
              }}
            >
              {t("tracker.dayDetails")}
            </div>
            <div
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: TOKENS.colors.textMuted,
                marginTop: "2px",
              }}
            >
              {day?.date}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("tracker.close")}
            style={{
              background: "transparent",
              border: "none",
              color: TOKENS.colors.textSecondary,
              cursor: "pointer",
              padding: TOKENS.spacing.xs,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div
          style={{
            backgroundColor: TOKENS.colors.surfaceElevated,
            borderRadius: TOKENS.radii.md,
            border: `1px solid ${TOKENS.colors.borderSubtle}`,
            padding: TOKENS.spacing.md,
          }}
        >
          <div
            style={{
              fontSize: "11px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              color: TOKENS.colors.textMuted,
              marginBottom: "4px",
            }}
          >
            {statusLabel}
          </div>
          <div
            style={{
              fontSize: "24px",
              fontWeight: 800,
              color: TOKENS.colors.textPrimary,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {formatCurrency(displayAmount, currency)}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: TOKENS.spacing.xs }}>
          {dayTransactions.length === 0 ? (
            <div
              style={{
                fontSize: "13px",
                color: TOKENS.colors.textMuted,
                padding: `${TOKENS.spacing.sm} 0`,
              }}
            >
              {t("tracker.noTransactions")}
            </div>
          ) : (
            dayTransactions.map((tx) => {
              const isIncome = tx.type === "income";
              const sign = isIncome ? "+" : "-";
              const color = isIncome ? TOKENS.colors.success : TOKENS.colors.danger;
              const formattedAmount = `${sign}${formatCurrency(tx.amount, currency)}`;

              return (
                <div
                  key={tx.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: `${TOKENS.spacing.xs} 0`,
                    borderBottom: `1px solid ${TOKENS.colors.borderSubtle}`,
                  }}
                >
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: TOKENS.colors.textSecondary,
                    }}
                  >
                    {tx.notes || (isIncome ? t("tracker.add") : t("tracker.spend"))}
                  </span>
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: 700,
                      color,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {formattedAmount}
                  </span>
                </div>
              );
            })
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          style={{
            height: "44px",
            backgroundColor: TOKENS.colors.surfaceElevated,
            borderRadius: TOKENS.radii.md,
            border: `1px solid ${TOKENS.colors.borderSubtle}`,
            color: TOKENS.colors.textPrimary,
            fontSize: "14px",
            fontWeight: 700,
            cursor: "pointer",
            marginTop: TOKENS.spacing.xs,
          }}
        >
          {t("tracker.close")}
        </button>
      </div>
    </div>
  );
};
