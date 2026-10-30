import type { Account, PlannedPayment, TransactionType } from "@ration/types";
import { ArrowDownLeft, ArrowUpRight, Check, Pencil, Plus, Trash2, X } from "lucide-react-native";
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
import { RecordPlannedPaymentModal } from "./RecordPlannedPaymentModal";

interface PlannedModalProps {
  isOpen: boolean;
  accounts: Account[];
  plannedPayments: PlannedPayment[];
  currency: string;
  onClose: () => void;
  onAddPlannedPayment: (payment: {
    name: string;
    amount: number;
    dueDate: string;
    type: TransactionType;
    accountId?: string;
    isRecurring?: boolean;
  }) => void;
  onEditPlannedPayment: (
    id: string,
    payment: {
      name: string;
      amount: number;
      dueDate: string;
      type: TransactionType;
      accountId?: string;
      isRecurring?: boolean;
    }
  ) => void;
  onDeletePlannedPayment: (id: string) => void;
  onMarkPaymentPaid: (paymentId: string) => void;
}

export const PlannedModal: React.FC<PlannedModalProps> = ({
  isOpen,
  accounts,
  plannedPayments,
  currency,
  onClose,
  onAddPlannedPayment,
  onEditPlannedPayment,
  onDeletePlannedPayment,
  onMarkPaymentPaid,
}) => {
  const { t } = useI18n();
  const [visible, setVisible] = useState(isOpen);
  const anim = useRef(new Animated.Value(0)).current;

  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PlannedPayment | null>(null);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      setIsRecordModalOpen(false);
      setEditingPayment(null);
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

  function handleOpenCreate() {
    setEditingPayment(null);
    setIsRecordModalOpen(true);
  }

  function handleOpenEdit(payment: PlannedPayment) {
    setEditingPayment(payment);
    setIsRecordModalOpen(true);
  }

  function handleFormSubmit(
    paymentData: {
      name: string;
      amount: number;
      dueDate: string;
      type: TransactionType;
      accountId?: string;
      isRecurring?: boolean;
    },
    paymentIdToUpdate?: string
  ) {
    if (paymentIdToUpdate) {
      onEditPlannedPayment(paymentIdToUpdate, paymentData);
    } else {
      onAddPlannedPayment(paymentData);
    }
    setIsRecordModalOpen(false);
    setEditingPayment(null);
  }

  const activePayments = useMemo(
    () =>
      plannedPayments
        .filter((p) => p.status === "pending")
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    [plannedPayments]
  );
  const settledPayments = useMemo(
    () =>
      plannedPayments
        .filter((p) => p.status !== "pending")
        .sort((a, b) => (b.createdAt || b.dueDate).localeCompare(a.createdAt || a.dueDate)),
    [plannedPayments]
  );

  const backdropOpacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const sheetTranslateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [550, 0],
  });

  if (!visible) return null;

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
              <Text style={styles.title}>{t("planned.tabPlanned")}</Text>
              <View style={styles.headerActions}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.addHeaderButton}
                  onPress={handleOpenCreate}
                >
                  <Plus size={14} color={TOKENS.colors.textOnPrimary} />
                  <Text style={styles.addHeaderButtonText}>{t("planned.newPlanned")}</Text>
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
                {plannedPayments.length === 0 ? (
                  <Text style={styles.emptyText}>{t("planned.emptyPlanned")}</Text>
                ) : (
                  <>
                    {activePayments.map((item) => {
                      const isIncome = (item.type ?? "spend") === "income";
                      return (
                        <View key={item.id} style={styles.card}>
                          <View style={styles.cardTop}>
                            <View style={styles.cardInfo}>
                              <View style={styles.typeBadgeRow}>
                                <View
                                  style={[
                                    styles.typeBadge,
                                    isIncome ? styles.badgeIncome : styles.badgeBill,
                                  ]}
                                >
                                  {isIncome ? (
                                    <ArrowUpRight size={12} color={TOKENS.colors.success} />
                                  ) : (
                                    <ArrowDownLeft size={12} color={TOKENS.colors.danger} />
                                  )}
                                  <Text
                                    style={[
                                      styles.typeBadgeText,
                                      isIncome ? styles.textIncome : styles.textBill,
                                    ]}
                                  >
                                    {isIncome ? t("planned.incomeLabel") : t("planned.billLabel")}
                                  </Text>
                                </View>
                                {item.isRecurring && (
                                  <View style={styles.recurringPill}>
                                    <Text style={styles.recurringPillText}>
                                      {item.recurrenceFrequency === "weekly" ? "W" : "R"}
                                    </Text>
                                  </View>
                                )}
                                <Text style={styles.cardTitle}>{item.name}</Text>
                              </View>
                              <Text style={styles.cardSubtitle}>{item.dueDate}</Text>
                            </View>
                            <Text style={styles.cardAmount}>
                              {formatCurrency(item.amount, currency)}
                            </Text>
                          </View>

                          <View style={styles.cardFooter}>
                            <View style={styles.cardFooterLeft}>
                              <Text style={styles.cardSubtitle}>
                                {isIncome ? t("planned.typeIncome") : t("planned.activeDebt")}
                              </Text>

                              <View style={styles.iconActionsRow}>
                                <TouchableOpacity
                                  activeOpacity={0.7}
                                  style={styles.iconButton}
                                  onPress={() => handleOpenEdit(item)}
                                >
                                  <Pencil size={13} color={TOKENS.colors.textSecondary} />
                                </TouchableOpacity>
                                <TouchableOpacity
                                  activeOpacity={0.7}
                                  style={styles.iconButton}
                                  onPress={() => onDeletePlannedPayment(item.id)}
                                >
                                  <Trash2 size={13} color={TOKENS.colors.danger} />
                                </TouchableOpacity>
                              </View>
                            </View>

                            <TouchableOpacity
                              activeOpacity={0.7}
                              style={styles.actionButton}
                              onPress={() => onMarkPaymentPaid(item.id)}
                            >
                              <Check size={14} color={TOKENS.colors.primary} />
                              <Text style={styles.actionButtonText}>
                                {isIncome ? t("planned.markReceived") : t("planned.markPaid")}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })}

                    {settledPayments.length > 0 && (
                      <>
                        <Text style={styles.sectionLabel}>{t("planned.history")}</Text>
                        {settledPayments.map((item) => {
                          const isIncome = (item.type ?? "spend") === "income";
                          return (
                            <View key={item.id} style={[styles.card, styles.cardSettled]}>
                              <View style={styles.cardTop}>
                                <View style={styles.cardInfo}>
                                  <View style={styles.typeBadgeRow}>
                                    <View
                                      style={[
                                        styles.typeBadge,
                                        isIncome ? styles.badgeIncome : styles.badgeBill,
                                      ]}
                                    >
                                      {isIncome ? (
                                        <ArrowUpRight size={12} color={TOKENS.colors.success} />
                                      ) : (
                                        <ArrowDownLeft size={12} color={TOKENS.colors.danger} />
                                      )}
                                      <Text
                                        style={[
                                          styles.typeBadgeText,
                                          isIncome ? styles.textIncome : styles.textBill,
                                        ]}
                                      >
                                        {isIncome
                                          ? t("planned.incomeLabel")
                                          : t("planned.billLabel")}
                                      </Text>
                                    </View>
                                    {item.isRecurring && (
                                      <View style={styles.recurringPill}>
                                        <Text style={styles.recurringPillText}>
                                          {item.recurrenceFrequency === "weekly" ? "W" : "R"}
                                        </Text>
                                      </View>
                                    )}
                                    <Text style={styles.cardTitle}>{item.name}</Text>
                                  </View>
                                  <Text style={styles.cardSubtitle}>{item.dueDate}</Text>
                                </View>
                                <Text style={styles.cardAmount}>
                                  {formatCurrency(item.amount, currency)}
                                </Text>
                              </View>

                              <View style={styles.cardFooter}>
                                <View style={styles.cardFooterLeft}>
                                  <Text style={styles.cardSubtitle}>
                                    {isIncome ? t("planned.received") : t("planned.paid")}
                                  </Text>

                                  <View style={styles.iconActionsRow}>
                                    <TouchableOpacity
                                      activeOpacity={0.7}
                                      style={styles.iconButton}
                                      onPress={() => onDeletePlannedPayment(item.id)}
                                    >
                                      <Trash2 size={13} color={TOKENS.colors.danger} />
                                    </TouchableOpacity>
                                  </View>
                                </View>
                              </View>
                            </View>
                          );
                        })}
                      </>
                    )}
                  </>
                )}
              </View>
            </ScrollView>
          </Animated.View>
        </Animated.View>
      </Modal>

      <RecordPlannedPaymentModal
        isOpen={isRecordModalOpen}
        accounts={accounts}
        currency={currency}
        initialPayment={editingPayment}
        onClose={() => {
          setIsRecordModalOpen(false);
          setEditingPayment(null);
        }}
        onSubmit={handleFormSubmit}
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
    height: "72%",
    maxHeight: "72%",
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
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: TOKENS.radii.pill,
  },
  badgeBill: {
    backgroundColor: "rgba(255, 68, 68, 0.12)",
  },
  badgeIncome: {
    backgroundColor: "rgba(0, 230, 118, 0.12)",
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  textBill: {
    color: TOKENS.colors.danger,
  },
  textIncome: {
    color: TOKENS.colors.success,
  },
  recurringPill: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    backgroundColor: TOKENS.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: TOKENS.colors.borderSubtle,
  },
  recurringPillText: {
    fontSize: 9,
    fontWeight: "700",
    color: TOKENS.colors.primary,
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
  cardFooterLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: TOKENS.spacing.sm,
  },
  iconActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  iconButton: {
    padding: 5,
    borderRadius: TOKENS.radii.sm,
    backgroundColor: TOKENS.colors.surfaceSubtle,
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
  cardSettled: {
    opacity: 0.6,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: TOKENS.colors.textMuted,
    marginTop: TOKENS.spacing.sm,
    marginBottom: TOKENS.spacing.xs,
  },
});
