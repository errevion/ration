import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { useI18n } from "../i18n/index.js";
import { TOKENS } from "../theme/tokens.js";

interface CalendarDatePickerProps {
  isOpen: boolean;
  title: string;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onClose: () => void;
}

const MONTH_NAMES = [
  "JANUARY",
  "FEBRUARY",
  "MARCH",
  "APRIL",
  "MAY",
  "JUNE",
  "JULY",
  "AUGUST",
  "SEPTEMBER",
  "OCTOBER",
  "NOVEMBER",
  "DECEMBER",
];

export const CalendarDatePicker: React.FC<CalendarDatePickerProps> = ({
  isOpen,
  title,
  selectedDate,
  onSelectDate,
  onClose,
}) => {
  const { t } = useI18n();

  const [viewYear, setViewYear] = useState(() => {
    const parts = selectedDate.split("-").map(Number);
    return parts[0] || new Date().getFullYear();
  });
  const [viewMonth, setViewMonth] = useState(() => {
    const parts = selectedDate.split("-").map(Number);
    return typeof parts[1] === "number" ? parts[1] - 1 : new Date().getMonth();
  });

  useEffect(() => {
    if (isOpen && /^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) {
      const parts = selectedDate.split("-").map(Number);
      setViewYear(parts[0]);
      setViewMonth(parts[1] - 1);
    }
  }, [isOpen, selectedDate]);

  function handlePrevMonth() {
    setViewMonth((prev) => {
      if (prev === 0) {
        setViewYear((y) => y - 1);
        return 11;
      }
      return prev - 1;
    });
  }

  function handleNextMonth() {
    setViewMonth((prev) => {
      if (prev === 11) {
        setViewYear((y) => y + 1);
        return 0;
      }
      return prev + 1;
    });
  }

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayStandard = new Date(viewYear, viewMonth, 1).getDay();
  const leadingEmptyDays = (firstDayStandard + 6) % 7;

  const weekdayDays = [
    { id: "mon", label: t("weekdays.mon") },
    { id: "tue", label: t("weekdays.tue") },
    { id: "wed", label: t("weekdays.wed") },
    { id: "thu", label: t("weekdays.thu") },
    { id: "fri", label: t("weekdays.fri") },
    { id: "sat", label: t("weekdays.sat") },
    { id: "sun", label: t("weekdays.sun") },
  ];

  const monthLabel = `${MONTH_NAMES[viewMonth]} ${viewYear}`;

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
        zIndex: 1100,
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
          transform: isOpen ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
          overflowX: "hidden",
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
              fontSize: "14px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              color: TOKENS.colors.textPrimary,
            }}
          >
            {title}
          </span>
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
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: `${TOKENS.spacing.xs} 0`,
          }}
        >
          <button
            type="button"
            onClick={handlePrevMonth}
            style={{
              width: "36px",
              height: "36px",
              borderRadius: TOKENS.radii.pill,
              backgroundColor: TOKENS.colors.surfaceElevated,
              border: `1px solid ${TOKENS.colors.borderSubtle}`,
              color: TOKENS.colors.textPrimary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <ChevronLeft size={18} />
          </button>
          <span
            style={{
              fontSize: "14px",
              fontWeight: 700,
              letterSpacing: "1px",
              color: TOKENS.colors.textPrimary,
            }}
          >
            {monthLabel}
          </span>
          <button
            type="button"
            onClick={handleNextMonth}
            style={{
              width: "36px",
              height: "36px",
              borderRadius: TOKENS.radii.pill,
              backgroundColor: TOKENS.colors.surfaceElevated,
              border: `1px solid ${TOKENS.colors.borderSubtle}`,
              color: TOKENS.colors.textPrimary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: "4px",
            textAlign: "center",
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
                padding: "4px 0",
              }}
            >
              {item.label}
            </div>
          ))}

          {Array.from({ length: leadingEmptyDays }).map((_, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: slot placeholder
            <div key={`empty-${index}`} style={{ height: "42px" }} />
          ))}

          {Array.from({ length: daysInMonth }).map((_, index) => {
            const dayNum = index + 1;
            const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
            const isSelected = dateStr === selectedDate;

            return (
              <button
                type="button"
                key={dateStr}
                onClick={() => {
                  onSelectDate(dateStr);
                  onClose();
                }}
                style={{
                  height: "42px",
                  borderRadius: TOKENS.radii.md,
                  backgroundColor: isSelected
                    ? TOKENS.colors.primary
                    : TOKENS.colors.surfaceElevated,
                  border: `1px solid ${isSelected ? TOKENS.colors.primary : TOKENS.colors.borderSubtle}`,
                  color: isSelected ? TOKENS.colors.textOnPrimary : TOKENS.colors.textPrimary,
                  fontSize: "14px",
                  fontWeight: isSelected ? 800 : 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {dayNum}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
