import type { DailyAllocation, LoanRecord, PlannedPayment, SpendTransaction } from "@ration/types";
import { Check, X } from "lucide-react-native";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useI18n } from "../i18n";
import { TOKENS } from "../theme/tokens";
import { formatCurrency } from "../utils/formatters";

interface DayDetailModalProps {
  day: DailyAllocation | null;
  currency: string;
  transactions: SpendTransaction[];
  plannedPayments?: PlannedPayment[];
  loans?: LoanRecord[];
  onClose: () => void;
  onMarkPaymentPaid?: (paymentId: string) => void;
  onMarkLoanSettled?: (loanId: string) => void;
}

export const DayDetailModal: React.FC<DayDetailModalProps> = ({
  day,
  currency,
  transactions,
  plannedPayments = [],
  loans = [],
  onClose,
  onMarkPaymentPaid,
  onMarkLoanSettled,
}) => {
  const { t } = useI18n();
  const [visible, setVisible] = useState(Boolean(day));
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (day) {
      setVisible(true);
      Animated.timing(anim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }).start();
    } else if (visible) {
      Animated.timing(anim, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }).start(() => {
        setVisible(false);
      });
    }
  }, [anim, day, visible]);

  const handleDismiss = useCallback(() => {
    Animated.timing(anim, {
      toValue: 0,
      duration: 160,
      useNativeDriver: true,
    }).start(() => {
      setVisible(false);
      onClose();
    });
  }, [anim, onClose]);

  if (!visible || !day) return null;

  const backdropOpacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const cardScale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.92, 1],
  });

  const dayTransactions = transactions.filter((tx) => tx.date === day.date);
  const dayPayments = plannedPayments.filter(
    (p) => p.dueDate === day.date && p.status === "pending"
  );
  const dayLoans = loans.filter((l) => l.dueDate === day.date && l.status === "active");

  const displayAmount = day.isPast ? day.spentAmount : day.projectedQuota;
  const statusLabel = day.isPast
    ? t("tracker.spentToday", { amount: formatCurrency(day.spentAmount, currency) })
    : t("tracker.dailyBudget");

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleDismiss}>
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <TouchableOpacity
          activeOpacity={1}
          style={StyleSheet.absoluteFill}
          onPress={handleDismiss}
        />
        <Animated.View
          style={[styles.card, { transform: [{ scale: cardScale }], opacity: backdropOpacity }]}
        >
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>{t("tracker.dayDetails")}</Text>
              <Text style={styles.dateSubtitle}>{day.date}</Text>
            </View>
            <TouchableOpacity
              onPress={handleDismiss}
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

          {(dayPayments.length > 0 || dayLoans.length > 0) && (
            <View style={styles.commitmentsSection}>
              <Text style={styles.commitmentsTitle}>{t("tracker.scheduledPlanned")}</Text>
              {dayPayments.map((p) => (
                <View key={p.id} style={styles.commitmentRow}>
                  <View style={styles.commTextGroup}>
                    <Text style={styles.commName}>{p.name}</Text>
                    <Text style={styles.commSub}>{formatCurrency(p.amount, currency)}</Text>
                  </View>
                  {onMarkPaymentPaid && (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={styles.commBtn}
                      onPress={() => onMarkPaymentPaid(p.id)}
                    >
                      <Check size={14} color={TOKENS.colors.primary} />
                      <Text style={styles.commBtnText}>{t("planned.markPaid")}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              {dayLoans.map((l) => (
                <View key={l.id} style={styles.commitmentRow}>
                  <View style={styles.commTextGroup}>
                    <Text style={styles.commName}>{l.counterparty}</Text>
                    <Text style={styles.commSub}>
                      {l.type === "borrow" ? t("planned.borrowLabel") : t("planned.lendLabel")}:{" "}
                      {formatCurrency(l.amount, currency)}
                    </Text>
                  </View>
                  {onMarkLoanSettled && (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={styles.commBtn}
                      onPress={() => onMarkLoanSettled(l.id)}
                    >
                      <Check size={14} color={TOKENS.colors.primary} />
                      <Text style={styles.commBtnText}>{t("planned.markSettled")}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          )}
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

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.dismissButton}
            onPress={handleDismiss}
          >
            <Text style={styles.dismissText}>{t("tracker.close")}</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
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
  commitmentsSection: {
    backgroundColor: TOKENS.colors.surfaceElevated,
    borderRadius: TOKENS.radii.md,
    borderWidth: 1,
    borderColor: TOKENS.colors.borderSubtle,
    padding: TOKENS.spacing.md,
    gap: TOKENS.spacing.xs,
  },
  commitmentsTitle: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: TOKENS.colors.primary,
    marginBottom: 4,
  },
  commitmentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  commTextGroup: {
    gap: 2,
  },
  commName: {
    fontSize: 13,
    fontWeight: "700",
    color: TOKENS.colors.textPrimary,
  },
  commSub: {
    fontSize: 12,
    fontWeight: "600",
    color: TOKENS.colors.textMuted,
  },
  commBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  commBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: TOKENS.colors.primary,
  },
});
