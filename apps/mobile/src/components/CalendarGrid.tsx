import type { DailyAllocation } from "@ration/types";
import type React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useI18n } from "../i18n/index.js";
import { TOKENS } from "../theme/tokens.js";
import { formatMetricAmount } from "../utils/formatters.js";

interface CalendarGridProps {
  days: DailyAllocation[];
  leadingEmptyDays: number;
  trailingEmptyDays: number;
  onSelectDay: (day: DailyAllocation) => void;
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
    <View style={styles.container}>
      <View style={styles.weekdayRow}>
        {weekdayDays.map((item) => (
          <View key={item.id} style={styles.weekdaySlot}>
            <Text style={styles.weekdayLabel}>{item.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.grid}>
        {LEADING_SLOT_IDS.slice(0, leadingEmptyDays).map((slotId) => (
          <View key={slotId} style={styles.cellWrapper}>
            <View style={styles.emptyCell} />
          </View>
        ))}

        {days.map((day) => {
          let bg: string = TOKENS.colors.surfaceElevated;
          let border: string = TOKENS.colors.border;
          let dateColor: string = TOKENS.colors.textSecondary;
          let amountColor: string = TOKENS.colors.textPrimary;
          let displayAmount = day.projectedQuota;

          if (day.isPast) {
            bg = TOKENS.colors.surface;
            border = TOKENS.colors.borderSubtle;
            dateColor = TOKENS.colors.textMuted;
            amountColor = TOKENS.colors.textMuted;
            displayAmount = day.spentAmount;
          } else if (day.isToday) {
            bg = TOKENS.colors.primary;
            border = TOKENS.colors.primary;
            dateColor = TOKENS.colors.textOnPrimary;
            amountColor = TOKENS.colors.textOnPrimary;
            displayAmount = day.projectedQuota;
          }

          return (
            <View key={day.date} style={styles.cellWrapper}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => onSelectDay(day)}
                style={[styles.cell, { backgroundColor: bg, borderColor: border }]}
              >
                <Text style={[styles.dayNumber, { color: dateColor }]}>{day.dayNumber}</Text>
                <Text
                  numberOfLines={1}
                  ellipsizeMode="clip"
                  style={[styles.amountText, { color: amountColor }]}
                >
                  {formatMetricAmount(displayAmount)}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}

        {TRAILING_SLOT_IDS.slice(0, trailingEmptyDays).map((slotId) => (
          <View key={slotId} style={styles.cellWrapper}>
            <View style={styles.emptyCell} />
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
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
    padding: 2,
  },
  emptyCell: {
    height: 52,
    borderRadius: TOKENS.radii.md,
    opacity: 0.1,
  },
  cell: {
    height: 52,
    borderRadius: TOKENS.radii.md,
    borderWidth: 1,
    padding: 5,
    justifyContent: "space-between",
  },
  dayNumber: {
    fontSize: 10,
    fontWeight: "700",
  },
  amountText: {
    fontSize: 12,
    fontWeight: "800",
    textAlign: "right",
  },
});
