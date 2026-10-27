import type { Account, LoanRecord, LoanType } from "@ration/types";
import { ArrowDownLeft, ArrowUpRight, Check, Plus, X } from "lucide-react-native";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useI18n } from "../i18n";
import { TOKENS } from "../theme/tokens";
import { formatCurrency } from "../utils/formatters";
import { RecordLoanModal } from "./RecordLoanModal";

interface LoansModalProps {
  isOpen: boolean;
  accounts: Account[];
  loans: LoanRecord[];
  currency: string;
  onClose: () => void;
  onAddLoan: (loan: {
    counterparty: string;
    type: LoanType;
    amount: number;
    dueDate: string;
    accountId?: string;
    notes?: string;
  }) => void;
  onMarkLoanSettled: (loanId: string) => void;
}

export const LoansModal: React.FC<LoansModalProps> = ({
  isOpen,
  accounts,
  loans,
  currency,
  onClose,
  onAddLoan,
  onMarkLoanSettled,
}) => {
  const { t } = useI18n();
  const [visible, setVisible] = useState(isOpen);
  const anim = useRef(new Animated.Value(0)).current;
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      setIsRecordModalOpen(false);
      Animated.timing(anim, {
        toValue: 1,
        duration: 240,
        useNativeDriver: true,
      }).start();
    } else if (visible) {
      Animated.timing(anim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }).start(() => {
        setVisible(false);
      });
    }
  }, [anim, isOpen, visible]);

  const handleDismiss = useCallback(() => {
    Animated.timing(anim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      setVisible(false);
      onClose();
    });
  }, [anim, onClose]);

  if (!visible) return null;

  const backdropOpacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const sheetTranslateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [550, 0],
  });

  return (
    <>
      <Modal visible={visible} transparent animationType="none" onRequestClose={handleDismiss}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <TouchableOpacity
            activeOpacity={1}
            style={StyleSheet.absoluteFill}
            onPress={handleDismiss}
          />
          <Animated.View style={[styles.sheet, { transform: [{ translateY: sheetTranslateY }] }]}>
            <View style={styles.header}>
              <Text style={styles.title}>{t("planned.tabLoans")}</Text>
              <View style={styles.headerActions}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.addHeaderButton}
                  onPress={() => setIsRecordModalOpen(true)}
                >
                  <Plus size={14} color={TOKENS.colors.textOnPrimary} />
                  <Text style={styles.addHeaderButtonText}>{t("planned.newLoan")}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleDismiss}
                  accessibilityLabel={t("tracker.close")}
                  style={styles.closeButton}
                >
                  <X size={20} color={TOKENS.colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
              <View style={styles.tabContent}>
                {loans.length === 0 ? (
                  <Text style={styles.emptyText}>{t("planned.emptyLoans")}</Text>
                ) : (
                  loans.map((item) => {
                    const isBorrow = item.type === "borrow";
                    return (
                      <View key={item.id} style={styles.card}>
                        <View style={styles.cardTop}>
                          <View style={styles.cardInfo}>
                            <View style={styles.typeBadgeRow}>
                              <View
                                style={[
                                  styles.loanTypeBadge,
                                  isBorrow ? styles.badgeBorrow : styles.badgeLend,
                                ]}
                              >
                                {isBorrow ? (
                                  <ArrowDownLeft size={12} color={TOKENS.colors.danger} />
                                ) : (
                                  <ArrowUpRight size={12} color={TOKENS.colors.success} />
                                )}
                                <Text
                                  style={[
                                    styles.loanTypeText,
                                    isBorrow ? styles.textBorrow : styles.textLend,
                                  ]}
                                >
                                  {isBorrow ? t("planned.borrowLabel") : t("planned.lendLabel")}
                                </Text>
                              </View>
                              <Text style={styles.cardTitle}>{item.counterparty}</Text>
                            </View>
                            <Text style={styles.cardSubtitle}>{item.dueDate}</Text>
                          </View>
                          <Text style={styles.cardAmount}>
                            {formatCurrency(item.amount, currency)}
                          </Text>
                        </View>

                        <View style={styles.cardFooter}>
                          <Text style={styles.cardSubtitle}>
                            {item.status === "settled"
                              ? t("planned.settled")
                              : isBorrow
                                ? t("planned.activeDebt")
                                : t("planned.activeReceivable")}
                          </Text>

                          {item.status === "active" && (
                            <TouchableOpacity
                              activeOpacity={0.7}
                              style={styles.actionButton}
                              onPress={() => onMarkLoanSettled(item.id)}
                            >
                              <Check size={14} color={TOKENS.colors.primary} />
                              <Text style={styles.actionButtonText}>
                                {t("planned.markSettled")}
                              </Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            </ScrollView>
          </Animated.View>
        </Animated.View>
      </Modal>

      <RecordLoanModal
        isOpen={isRecordModalOpen}
        accounts={accounts}
        currency={currency}
        onClose={() => setIsRecordModalOpen(false)}
        onSubmit={onAddLoan}
      />
    </>
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
    maxHeight: "85%",
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
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: TOKENS.spacing.xs,
  },
  addHeaderButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: TOKENS.colors.primary,
    paddingHorizontal: TOKENS.spacing.sm,
    paddingVertical: 6,
    borderRadius: TOKENS.radii.pill,
  },
  addHeaderButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: TOKENS.colors.textOnPrimary,
  },
  closeButton: {
    padding: TOKENS.spacing.xs,
  },
  content: {
    gap: TOKENS.spacing.md,
    paddingBottom: TOKENS.spacing.xl,
  },
  tabContent: {
    gap: TOKENS.spacing.sm,
  },
  emptyText: {
    fontSize: 13,
    color: TOKENS.colors.textMuted,
    textAlign: "center",
    paddingVertical: TOKENS.spacing.xl,
  },
  card: {
    backgroundColor: TOKENS.colors.surfaceElevated,
    borderRadius: TOKENS.radii.md,
    padding: TOKENS.spacing.md,
    borderWidth: 1,
    borderColor: TOKENS.colors.borderSubtle,
    gap: TOKENS.spacing.sm,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardInfo: {
    gap: 2,
    flex: 1,
  },
  typeBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  loanTypeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: TOKENS.radii.pill,
  },
  badgeBorrow: {
    backgroundColor: "rgba(255, 68, 68, 0.12)",
  },
  badgeLend: {
    backgroundColor: "rgba(0, 230, 118, 0.12)",
  },
  loanTypeText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  textBorrow: {
    color: TOKENS.colors.danger,
  },
  textLend: {
    color: TOKENS.colors.success,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: TOKENS.colors.textPrimary,
  },
  cardSubtitle: {
    fontSize: 12,
    color: TOKENS.colors.textSecondary,
  },
  cardAmount: {
    fontSize: 14,
    fontWeight: "700",
    color: TOKENS.colors.textPrimary,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: TOKENS.colors.borderSubtle,
    paddingTop: TOKENS.spacing.xs,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: TOKENS.radii.sm,
    backgroundColor: TOKENS.colors.surfaceSubtle,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: TOKENS.colors.primary,
  },
});
