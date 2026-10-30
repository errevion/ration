import type { MoneyCycle } from "@ration/types";
import {
  Binoculars,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  HandCoins,
  Settings,
  Wallet,
} from "lucide-react-native";
import type React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useI18n } from "../i18n";
import { TOKENS } from "../theme/tokens";

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
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.cycleNavRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onPrevCycle}
            accessibilityLabel={t("tracker.prevCycle")}
            style={styles.navButton}
          >
            <ChevronLeft size={16} color={TOKENS.colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.cycleRangeText}>{cycleRange}</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onNextCycle}
            accessibilityLabel={t("tracker.nextCycle")}
            style={styles.navButton}
          >
            <ChevronRight size={16} color={TOKENS.colors.textSecondary} />
          </TouchableOpacity>

          {cycleOffset !== 0 && (
            <TouchableOpacity activeOpacity={0.7} onPress={onResetCycle} style={styles.todayPill}>
              <Text style={styles.todayPillText}>{t("tracker.today")}</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.headerRightActions}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onToggleProjection}
            style={[styles.iconButton, showProjection && styles.iconButtonActive]}
          >
            <Binoculars
              size={18}
              color={showProjection ? TOKENS.colors.primary : TOKENS.colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onOpenSettings}
            accessibilityLabel={t("settings.title")}
            style={styles.settingsButton}
          >
            <Settings size={18} color={TOKENS.colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.balanceSection}>
        <Text style={styles.balanceLabel}>
          {showProjection ? t("tracker.projectionLabel") : t("tracker.safeToSpend")}
        </Text>
        <Text style={[styles.balanceValue, showProjection && styles.balanceValueProjected]}>
          {cycle.currency}
          {displayedForeseeable.toLocaleString()}
        </Text>
        <View style={styles.subtextRow}>
          <Text style={styles.subtextActual}>{actualText}</Text>
          <Text style={styles.subtextDivider}>|</Text>
          <Text style={styles.subtextPace}>{daysText}</Text>
        </View>
      </View>

      <View style={styles.hubRow}>
        <TouchableOpacity activeOpacity={0.7} style={styles.hubPill} onPress={onOpenAccounts}>
          <Wallet size={15} color={TOKENS.colors.textPrimary} />
          <Text style={styles.hubPillText}>{t("tracker.accounts")}</Text>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.7} style={styles.hubPill} onPress={onOpenPlanned}>
          <CalendarClock size={15} color={TOKENS.colors.textPrimary} />
          <Text style={styles.hubPillText}>{t("tracker.planned")}</Text>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.7} style={styles.hubPill} onPress={onOpenLoans}>
          <HandCoins size={15} color={TOKENS.colors.textPrimary} />
          <Text style={styles.hubPillText}>{t("tracker.loans")}</Text>
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
    marginBottom: TOKENS.spacing.md,
  },
  cycleNavRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  navButton: {
    padding: 4,
    borderRadius: TOKENS.radii.sm,
    backgroundColor: TOKENS.colors.surfaceElevated,
  },
  cycleRangeText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: TOKENS.colors.textSecondary,
    paddingHorizontal: 2,
  },
  todayPill: {
    backgroundColor: TOKENS.colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: TOKENS.radii.pill,
    marginLeft: 4,
  },
  todayPillText: {
    fontSize: 10,
    fontWeight: "700",
    color: TOKENS.colors.textOnPrimary,
  },
  headerRightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: TOKENS.spacing.xs,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: TOKENS.radii.pill,
    backgroundColor: TOKENS.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: TOKENS.colors.borderSubtle,
    justifyContent: "center",
    alignItems: "center",
  },
  iconButtonActive: {
    borderColor: TOKENS.colors.primary,
    backgroundColor: "rgba(255, 229, 0, 0.1)",
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
    alignItems: "center",
    marginBottom: TOKENS.spacing.lg,
  },
  balanceLabel: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: TOKENS.colors.textMuted,
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 34,
    fontWeight: "800",
    color: TOKENS.colors.textPrimary,
    letterSpacing: -1,
  },
  balanceValueProjected: {
    color: TOKENS.colors.textPrimary,
  },
  subtextRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 6,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  subtextActual: {
    fontSize: 12,
    color: TOKENS.colors.textMuted,
  },
  subtextDivider: {
    fontSize: 12,
    color: TOKENS.colors.border,
  },
  subtextPace: {
    fontSize: 12,
    fontWeight: "600",
    color: TOKENS.colors.textSecondary,
  },
  subtextPaceProjected: {
    color: TOKENS.colors.primary,
    fontWeight: "700",
  },
  hubRow: {
    flexDirection: "row",
    gap: TOKENS.spacing.sm,
    justifyContent: "center",
  },
  hubPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: TOKENS.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: TOKENS.colors.borderSubtle,
    paddingVertical: TOKENS.spacing.sm,
    paddingHorizontal: TOKENS.spacing.xs,
    borderRadius: TOKENS.radii.pill,
  },
  hubPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: TOKENS.colors.textPrimary,
  },
});
