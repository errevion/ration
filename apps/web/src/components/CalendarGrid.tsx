import type { DailyAllocation } from "@ration/types";
import type React from "react";
import { useI18n } from "../i18n/index.js";
import { TOKENS } from "../theme/tokens.js";

interface CalendarGridProps {
  days: DailyAllocation[];
  leadingEmptyDays: number;
  trailingEmptyDays: number;
  onSelectDay?: (day: DailyAllocation) => void;
}

const LEADING_SLOT_IDS = ["lead-0", "lead-1", "lead-2", "lead-3", "lead-4", "lead-5", "lead-6"];

const TRAILING_SLOT_IDS = [
  "trail-0",
  "trail-1",
  "trail-2",
  "trail-3",
  "trail-4",
  "trail-5",
  "trail-6",
];

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  days,
  leadingEmptyDays,
  trailingEmptyDays,
  onSelectDay,
}) => {
  const { t } = useI18n();

  const weekdayDays = [
    { id: "mon", label: t("weekdays.mon") },
    { id: "tue", label: t("weekdays.tue") },
    { id: "wed", label: t("weekdays.wed") },
    { id: "thu", label: t("weekdays.thu") },
    { id: "fri", label: t("weekdays.fri") },
    { id: "sat", label: t("weekdays.sat") },
    { id: "sun", label: t("weekdays.sun") },
  ];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: TOKENS.spacing.sm,
        width: "100%",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: "6px",
          textAlign: "center",
          marginBottom: TOKENS.spacing.xs,
        }}
      >
        {weekdayDays.map((item) => (
          <div
            key={item.id}
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: TOKENS.colors.textMuted,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            {item.label}
          </div>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: "6px",
        }}
      >
        {LEADING_SLOT_IDS.slice(0, leadingEmptyDays).map((slotId) => (
          <div
            key={slotId}
            style={{
              height: "56px",
              borderRadius: TOKENS.radii.md,
              border: "1px solid transparent",
              opacity: 0.1,
            }}
          />
        ))}

        {days.map((day) => {
          let bg: string = TOKENS.colors.surfaceElevated;
          let border: string = `1px solid ${TOKENS.colors.border}`;
          let dateColor: string = TOKENS.colors.textSecondary;
          let amountColor: string = TOKENS.colors.textPrimary;
          let displayAmount = day.projectedQuota;

          if (day.isPast) {
            bg = TOKENS.colors.surface;
            border = `1px solid ${TOKENS.colors.borderSubtle}`;
            dateColor = TOKENS.colors.textMuted;
            amountColor = TOKENS.colors.textMuted;
            displayAmount = day.spentAmount;
          } else if (day.isToday) {
            bg = TOKENS.colors.primary;
            border = `1px solid ${TOKENS.colors.primary}`;
            dateColor = TOKENS.colors.textOnPrimary;
            amountColor = TOKENS.colors.textOnPrimary;
            displayAmount = day.projectedQuota;
          }

          return (
            <button
              type="button"
              key={day.date}
              onClick={() => onSelectDay?.(day)}
              style={{
                height: "56px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                padding: "6px",
                backgroundColor: bg,
                border,
                borderRadius: TOKENS.radii.md,
                cursor: "pointer",
                outline: "none",
                textAlign: "left",
                boxSizing: "border-box",
                transition: "transform 0.1s ease, border-color 0.1s ease",
              }}
            >
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: dateColor,
                  lineHeight: 1,
                }}
              >
                {day.dayNumber}
              </span>
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  color: amountColor,
                  lineHeight: 1,
                  textAlign: "right",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {displayAmount}
              </span>
            </button>
          );
        })}

        {TRAILING_SLOT_IDS.slice(0, trailingEmptyDays).map((slotId) => (
          <div
            key={slotId}
            style={{
              height: "56px",
              borderRadius: TOKENS.radii.md,
              border: "1px solid transparent",
              opacity: 0.1,
            }}
          />
        ))}
      </div>
    </div>
  );
};
