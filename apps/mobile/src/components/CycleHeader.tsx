import type { MoneyCycle } from "@ration/types";
import { CalendarClock, Settings, Wallet } from "lucide-react-native";
import type React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useI18n } from "../i18n";
import { TOKENS } from "../theme/tokens";

interface CycleHeaderProps {
  cycle: MoneyCycle;
  foreseeableBalance: number;
  actualBalance: number;
  remainingDaysCount: number;
  dailyAllowance: number;
  onOpenSettings: () => void;
  onOpenAccounts: () => void;
  onOpenCommitments: () => void;
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
  actualBalance,
  remainingDaysCount,
  dailyAllowance,
  onOpenSettings,
  onOpenAccounts,
  onOpenCommitments,
}) => {
  const { t } = useI18n();

  const formattedStart = formatDisplayDate(cycle.startDate);
  const formattedEnd = formatDisplayDate(cycle.endDate);
  const cycleRange = `${formattedStart} - ${formattedEnd}`;

  const roundedDaily = Math.floor(dailyAllowance);
  const dailyText = `${cycle.currency}${roundedDaily.toLocaleString()}`;
  const daysText = t("tracker.daysLeft", { days: remainingDaysCount });
  const paceText = t("tracker.perDay", { amount: dailyText });
  const actualText = `${t("tracker.actualBalance")}: ${cycle.currency}${actualBalance.toLocaleString()}`;

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Text style={styles.cycleRangeText}>{cycleRange}</Text>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onOpenSettings}
          accessibilityLabel={t("settings.title")}
          style={styles.settingsButton}
        >
          <Settings size={18} color={TOKENS.colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.balanceSection}>
        <Text style={styles.balanceLabel}>{t("tracker.safeToSpend")}</Text>
        <Text style={styles.balanceValue}>
          {cycle.currency}
          {foreseeableBalance.toLocaleString()}
        </Text>
        <View style={styles.subtextRow}>
          <Text style={styles.subtextActual}>{actualText}</Text>
          <Text style={styles.subtextDivider}>|</Text>
          <Text style={styles.subtextPace}>{daysText}</Text>
          <Text style={styles.subtextDivider}>|</Text>
          <Text style={styles.subtextPace}>{paceText}</Text>
        </View>
      </View>

      <View style={styles.hubRow}>
        <TouchableOpacity activeOpacity={0.7} style={styles.hubPill} onPress={onOpenAccounts}>
          <Wallet size={15} color={TOKENS.colors.textPrimary} />
          <Text style={styles.hubPillText}>{t("tracker.accounts")}</Text>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.7} style={styles.hubPill} onPress={onOpenCommitments}>
          <CalendarClock size={15} color={TOKENS.colors.textPrimary} />
          <Text style={styles.hubPillText}>{t("tracker.commitments")}</Text>
        </TouchableOpacity>
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
    marginBottom: TOKENS.spacing.sm,
  },
  cycleRangeText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    color: TOKENS.colors.textMuted,
    textTransform: "uppercase",
  },
  settingsButton: {
    width: 36,
    height: 36,
    borderRadius: TOKENS.radii.pill,
    backgroundColor: TOKENS.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: TOKENS.colors.borderSubtle,
    justifyContent: "center",
    alignItems: "center",
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
  subtextRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    marginTop: TOKENS.spacing.xs,
  },
  subtextActual: {
    fontSize: 12,
    fontWeight: "600",
    color: TOKENS.colors.textSecondary,
  },
  subtextDivider: {
    fontSize: 11,
    color: TOKENS.colors.border,
  },
  subtextPace: {
    fontSize: 12,
    fontWeight: "600",
    color: TOKENS.colors.primary,
  },
  hubRow: {
    flexDirection: "row",
    gap: TOKENS.spacing.sm,
    marginTop: TOKENS.spacing.md,
  },
  hubPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: TOKENS.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: TOKENS.colors.borderSubtle,
    borderRadius: TOKENS.radii.pill,
    paddingHorizontal: TOKENS.spacing.md,
    paddingVertical: TOKENS.spacing.xs,
  },
  hubPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: TOKENS.colors.textPrimary,
  },
});
