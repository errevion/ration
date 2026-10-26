import type React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useI18n } from "../i18n";
import { TOKENS } from "../theme/tokens";
import { formatMetricAmount } from "../utils/formatters";

interface QuickBarProps {
  currency: string;
  todayQuota: number;
  spentToday: number;
  onOpenAdd: () => void;
  onOpenSpend: () => void;
}

export const QuickBar: React.FC<QuickBarProps> = ({
  currency,
  todayQuota,
  spentToday,
  onOpenAdd,
  onOpenSpend,
}) => {
  const { t } = useI18n();

  const formattedQuota = `${currency}${formatMetricAmount(todayQuota)}`;
  const formattedSpent = `${currency}${formatMetricAmount(spentToday)}`;
  const spentLabel = `(${t("tracker.spentToday", { amount: formattedSpent })})`;

  return (
    <View style={styles.container}>
      <View style={styles.quotaSection}>
        <Text style={styles.todayLabel}>{t("tracker.today")}</Text>
        <View style={styles.quotaRow}>
          <Text style={styles.quotaValue}>{formattedQuota}</Text>
          {spentToday > 0 && <Text style={styles.spentValue}>{spentLabel}</Text>}
        </View>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity activeOpacity={0.8} style={styles.addButton} onPress={onOpenAdd}>
          <Text style={styles.addButtonSign}>+</Text>
          <Text style={styles.addButtonText}>{t("tracker.add")}</Text>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.8} style={styles.spendButton} onPress={onOpenSpend}>
          <Text style={styles.spendButtonSign}>-</Text>
          <Text style={styles.spendButtonText}>{t("tracker.spend")}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: TOKENS.colors.surface,
    borderTopWidth: 1,
    borderTopColor: TOKENS.colors.border,
    paddingHorizontal: TOKENS.spacing.lg,
    paddingVertical: TOKENS.spacing.md,
    gap: TOKENS.spacing.sm,
  },
  quotaSection: {
    flex: 1,
  },
  todayLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: TOKENS.colors.textMuted,
  },
  quotaRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
    marginTop: 2,
  },
  quotaValue: {
    fontSize: 18,
    fontWeight: "800",
    color: TOKENS.colors.textPrimary,
  },
  spentValue: {
    fontSize: 11,
    fontWeight: "600",
    color: TOKENS.colors.textSecondary,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: TOKENS.spacing.xs,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: TOKENS.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: TOKENS.colors.border,
    borderRadius: TOKENS.radii.pill,
    paddingHorizontal: TOKENS.spacing.md,
    paddingVertical: TOKENS.spacing.sm,
  },
  addButtonSign: {
    fontSize: 14,
    fontWeight: "700",
    color: TOKENS.colors.textPrimary,
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: TOKENS.colors.textPrimary,
  },
  spendButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: TOKENS.colors.primary,
    borderRadius: TOKENS.radii.pill,
    paddingHorizontal: TOKENS.spacing.lg,
    paddingVertical: TOKENS.spacing.sm,
  },
  spendButtonSign: {
    fontSize: 14,
    fontWeight: "700",
    color: TOKENS.colors.textOnPrimary,
  },
  spendButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: TOKENS.colors.textOnPrimary,
  },
});
