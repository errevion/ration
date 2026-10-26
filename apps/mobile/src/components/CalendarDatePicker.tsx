import { ChevronLeft, ChevronRight, X } from "lucide-react-native";
import type React from "react";
import { useEffect, useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useI18n } from "../i18n";
import { TOKENS } from "../theme/tokens";

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
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity
              onPress={onClose}
              accessibilityLabel={t("tracker.close")}
              style={styles.closeButton}
            >
              <X size={20} color={TOKENS.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.monthNavRow}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.navButton}
              onPress={handlePrevMonth}
            >
              <ChevronLeft size={18} color={TOKENS.colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.monthLabel}>{monthLabel}</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.navButton}
              onPress={handleNextMonth}
            >
              <ChevronRight size={18} color={TOKENS.colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={styles.weekdayRow}>
            {weekdayDays.map((item) => (
              <View key={item.id} style={styles.weekdaySlot}>
                <Text style={styles.weekdayLabel}>{item.label}</Text>
              </View>
            ))}
          </View>

          <View style={styles.grid}>
            {Array.from({ length: leadingEmptyDays }).map((_, index) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: slot placeholder
              <View key={`empty-${index}`} style={styles.cellWrapper}>
                <View style={styles.emptyCell} />
              </View>
            ))}

            {Array.from({ length: daysInMonth }).map((_, index) => {
              const dayNum = index + 1;
              const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
              const isSelected = dateStr === selectedDate;

              return (
                <View key={dateStr} style={styles.cellWrapper}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={[styles.cell, isSelected ? styles.cellSelected : styles.cellNormal]}
                    onPress={() => {
                      onSelectDate(dateStr);
                      onClose();
                    }}
                  >
                    <Text
                      style={[
                        styles.cellText,
                        isSelected ? styles.cellTextSelected : styles.cellTextNormal,
                      ]}
                    >
                      {dayNum}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: TOKENS.colors.surface,
    borderTopLeftRadius: TOKENS.radii.card,
    borderTopRightRadius: TOKENS.radii.card,
    borderTopWidth: 1,
    borderTopColor: TOKENS.colors.border,
    padding: TOKENS.spacing.lg,
    gap: TOKENS.spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: TOKENS.colors.textPrimary,
  },
  closeButton: {
    padding: TOKENS.spacing.xs,
  },
  monthNavRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: TOKENS.spacing.xs,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: TOKENS.radii.pill,
    backgroundColor: TOKENS.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: TOKENS.colors.borderSubtle,
    justifyContent: "center",
    alignItems: "center",
  },
  monthLabel: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 1,
    color: TOKENS.colors.textPrimary,
  },
  weekdayRow: {
    flexDirection: "row",
    marginBottom: TOKENS.spacing.xs,
  },
  weekdaySlot: {
    width: "14.285%",
    alignItems: "center",
  },
  weekdayLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: TOKENS.colors.textMuted,
    textTransform: "uppercase",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  cellWrapper: {
    width: "14.285%",
    padding: 3,
  },
  emptyCell: {
    height: 40,
  },
  cell: {
    height: 40,
    borderRadius: TOKENS.radii.md,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  cellNormal: {
    backgroundColor: TOKENS.colors.surfaceElevated,
    borderColor: TOKENS.colors.borderSubtle,
  },
  cellSelected: {
    backgroundColor: TOKENS.colors.primary,
    borderColor: TOKENS.colors.primary,
  },
  cellText: {
    fontSize: 14,
    fontWeight: "700",
  },
  cellTextNormal: {
    color: TOKENS.colors.textPrimary,
  },
  cellTextSelected: {
    color: TOKENS.colors.textOnPrimary,
  },
});
