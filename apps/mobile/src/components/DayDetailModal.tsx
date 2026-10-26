import type { DailyAllocation, SpendTransaction } from "@ration/types";
import { X } from "lucide-react-native";
import type React from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useI18n } from "../i18n";
import { TOKENS } from "../theme/tokens";
import { formatCurrency } from "../utils/formatters";

interface DayDetailModalProps {
  day: DailyAllocation | null;
  currency: string;
  transactions: SpendTransaction[];
  onClose: () => void;
}

export const DayDetailModal: React.FC<DayDetailModalProps> = ({
  day,
  currency,
  transactions,
  onClose,
}) => {
  const { t } = useI18n();

  if (!day) return null;

  const dayTransactions = transactions.filter((tx) => tx.date === day.date);

  const displayAmount = day.isPast ? day.spentAmount : day.projectedQuota;
  const statusLabel = day.isPast
    ? t("tracker.spentToday", { amount: formatCurrency(day.spentAmount, currency) })
    : t("tracker.dailyBudget");

  return (
    <Modal visible={Boolean(day)} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>{t("tracker.dayDetails")}</Text>
              <Text style={styles.dateSubtitle}>{day.date}</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              accessibilityLabel={t("tracker.close")}
              style={styles.closeButton}
            >
              <X size={20} color={TOKENS.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.amountBox}>
            <Text style={styles.amountLabel}>{statusLabel}</Text>
            <Text style={styles.amountValue}>{formatCurrency(displayAmount, currency)}</Text>
          </View>

          <View style={styles.transactionList}>
            {dayTransactions.length === 0 ? (
              <Text style={styles.emptyText}>{t("tracker.noTransactions")}</Text>
            ) : (
              dayTransactions.map((tx) => {
                const isIncome = tx.type === "income";
                const sign = isIncome ? "+" : "-";
                const color = isIncome ? TOKENS.colors.success : TOKENS.colors.danger;
                const formattedAmount = `${sign}${formatCurrency(tx.amount, currency)}`;

                return (
                  <View key={tx.id} style={styles.txRow}>
                    <Text style={styles.txNote}>
                      {tx.notes || (isIncome ? t("tracker.add") : t("tracker.spend"))}
                    </Text>
                    <Text style={[styles.txAmount, { color }]}>{formattedAmount}</Text>
                  </View>
                );
              })
            )}
          </View>

          <TouchableOpacity activeOpacity={0.8} style={styles.dismissButton} onPress={onClose}>
            <Text style={styles.dismissText}>{t("tracker.close")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: TOKENS.spacing.lg,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: TOKENS.colors.surface,
    borderRadius: TOKENS.radii.card,
    borderWidth: 1,
    borderColor: TOKENS.colors.border,
    padding: TOKENS.spacing.lg,
    gap: TOKENS.spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: TOKENS.colors.textPrimary,
  },
  dateSubtitle: {
    fontSize: 12,
    fontWeight: "600",
    color: TOKENS.colors.textMuted,
    marginTop: 2,
  },
  closeButton: {
    padding: TOKENS.spacing.xs,
  },
  amountBox: {
    backgroundColor: TOKENS.colors.surfaceElevated,
    borderRadius: TOKENS.radii.md,
    borderWidth: 1,
    borderColor: TOKENS.colors.borderSubtle,
    padding: TOKENS.spacing.md,
  },
  amountLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: TOKENS.colors.textMuted,
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 24,
    fontWeight: "800",
    color: TOKENS.colors.textPrimary,
  },
  transactionList: {
    gap: TOKENS.spacing.xs,
  },
  emptyText: {
    fontSize: 13,
    color: TOKENS.colors.textMuted,
    paddingVertical: TOKENS.spacing.sm,
  },
  txRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: TOKENS.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: TOKENS.colors.borderSubtle,
  },
  txNote: {
    fontSize: 13,
    fontWeight: "600",
    color: TOKENS.colors.textSecondary,
  },
  txAmount: {
    fontSize: 13,
    fontWeight: "700",
  },
  dismissButton: {
    height: 44,
    backgroundColor: TOKENS.colors.surfaceElevated,
    borderRadius: TOKENS.radii.md,
    borderWidth: 1,
    borderColor: TOKENS.colors.borderSubtle,
    justifyContent: "center",
    alignItems: "center",
    marginTop: TOKENS.spacing.xs,
  },
  dismissText: {
    fontSize: 14,
    fontWeight: "700",
    color: TOKENS.colors.textPrimary,
  },
});
