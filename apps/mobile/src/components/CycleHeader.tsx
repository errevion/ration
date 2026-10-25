import type { MoneyCycle } from "@ration/types";
import type React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useI18n } from "../i18n/index.js";
import { TOKENS } from "../theme/tokens.js";

interface CycleHeaderProps {
  cycle: MoneyCycle;
  remainingBalance: number;
  remainingDaysCount: number;
  dailyAllowance: number;
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
}) => {
  const { t, locale, setLocale } = useI18n();

  const formattedStart = formatDisplayDate(cycle.startDate);
  const formattedEnd = formatDisplayDate(cycle.endDate);
  const cycleRange = `${formattedStart} - ${formattedEnd}`;

  const roundedDaily = Math.floor(dailyAllowance);
  const dailyText = `${cycle.currency}${roundedDaily.toLocaleString()}`;
  const daysText = t("tracker.daysLeft", { days: remainingDaysCount });
  const paceText = t("tracker.perDay", { amount: dailyText });
  const subtext = `${daysText} • ${paceText}`;

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Text style={styles.cycleRangeText}>{cycleRange}</Text>

        <View style={styles.localeRow}>
          <TouchableOpacity
            style={[styles.localePill, locale === "en" && styles.localePillActive]}
            onPress={() => setLocale("en")}
          >
            <Text style={[styles.localeText, locale === "en" && styles.localeTextActive]}>
              {t("locale.english")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.localePill, locale === "id" && styles.localePillActive]}
            onPress={() => setLocale("id")}
          >
            <Text style={[styles.localeText, locale === "id" && styles.localeTextActive]}>
              {t("locale.indonesian")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.balanceSection}>
        <Text style={styles.balanceLabel}>{t("tracker.totalBalance")}</Text>
        <Text style={styles.balanceValue}>
          {cycle.currency}
          {remainingBalance.toLocaleString()}
        </Text>
        <Text style={styles.subtext}>{subtext}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingBottom: TOKENS.spacing.md,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: TOKENS.spacing.md,
  },
  cycleRangeText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    color: TOKENS.colors.textMuted,
    textTransform: "uppercase",
  },
  localeRow: {
    flexDirection: "row",
    backgroundColor: TOKENS.colors.surfaceSubtle,
    borderRadius: TOKENS.radii.pill,
    padding: 2,
    borderWidth: 1,
    borderColor: TOKENS.colors.borderSubtle,
  },
  localePill: {
    paddingHorizontal: TOKENS.spacing.sm,
    paddingVertical: 2,
    borderRadius: TOKENS.radii.pill,
  },
  localePillActive: {
    backgroundColor: TOKENS.colors.primary,
  },
  localeText: {
    fontSize: 11,
    fontWeight: "700",
    color: TOKENS.colors.textSecondary,
  },
  localeTextActive: {
    color: TOKENS.colors.textOnPrimary,
  },
  balanceSection: {
    marginTop: TOKENS.spacing.xs,
  },
  balanceLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    color: TOKENS.colors.textMuted,
    marginBottom: TOKENS.spacing.xs,
  },
  balanceValue: {
    fontSize: 40,
    fontWeight: "800",
    color: TOKENS.colors.textPrimary,
    letterSpacing: -1,
  },
  subtext: {
    fontSize: 13,
    fontWeight: "600",
    color: TOKENS.colors.primary,
    marginTop: TOKENS.spacing.xs,
  },
});
