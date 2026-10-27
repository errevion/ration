import type { Account, LoanRecord, LoanType } from "@ration/types";
import { ArrowDownLeft, ArrowUpRight, Calendar, Check, Plus, X } from "lucide-react-native";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useI18n } from "../i18n";
import { TOKENS } from "../theme/tokens";
import { formatIsoDate } from "../utils/budgetEngine";
import { formatCurrency } from "../utils/formatters";
import { CalendarDatePicker } from "./CalendarDatePicker";

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

  const [isAddingLoan, setIsAddingLoan] = useState(false);
  const [loanCounterparty, setLoanCounterparty] = useState("");
  const [loanType, setLoanType] = useState<LoanType>("borrow");
  const [loanAmount, setLoanAmount] = useState("");
  const [loanDueDate, setLoanDueDate] = useState(() => formatIsoDate(new Date()));
  const [loanAccountId, setLoanAccountId] = useState<string | undefined>(
    () => accounts.find((a) => a.isPrimary)?.id || accounts[0]?.id
  );
  const [loanNotes, setLoanNotes] = useState("");
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      setIsAddingLoan(false);
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

  function handleCreateLoan() {
    const amt = Number.parseFloat(loanAmount);
    if (!loanCounterparty.trim() || !amt || amt <= 0) return;
    onAddLoan({
      counterparty: loanCounterparty.trim(),
      type: loanType,
      amount: amt,
      dueDate: loanDueDate,
      accountId: loanAccountId,
      notes: loanNotes.trim() || undefined,
    });
    setLoanCounterparty("");
    setLoanAmount("");
    setLoanNotes("");
    setIsAddingLoan(false);
  }

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
            <TouchableOpacity
              onPress={handleDismiss}
              accessibilityLabel={t("tracker.close")}
              style={styles.closeButton}
            >
              <X size={20} color={TOKENS.colors.textSecondary} />
            </TouchableOpacity>
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
                            <Text style={styles.actionButtonText}>{t("planned.markSettled")}</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                })
              )}
              {isAddingLoan ? (
                <View style={styles.formContainer}>
                  <Text style={styles.formHeading}>{t("planned.newLoan")}</Text>

                  <View style={styles.loanTypeRow}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={[
                        styles.loanTypeButton,
                        loanType === "borrow" && styles.loanTypeButtonActive,
                      ]}
                      onPress={() => setLoanType("borrow")}
                    >
                      <Text
                        style={[
                          styles.loanTypeButtonText,
                          loanType === "borrow" && styles.loanTypeButtonTextActive,
                        ]}
                      >
                        {t("planned.borrow")}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={[
                        styles.loanTypeButton,
                        loanType === "lend" && styles.loanTypeButtonActive,
                      ]}
                      onPress={() => setLoanType("lend")}
                    >
                      <Text
                        style={[
                          styles.loanTypeButtonText,
                          loanType === "lend" && styles.loanTypeButtonTextActive,
                        ]}
                      >
                        {t("planned.lend")}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <TextInput
                    value={loanCounterparty}
                    onChangeText={setLoanCounterparty}
                    placeholder={t("planned.counterpartyPlaceholder")}
                    placeholderTextColor={TOKENS.colors.textMuted}
                    style={styles.input}
                  />
                  <TextInput
                    value={loanAmount}
                    onChangeText={setLoanAmount}
                    placeholder={t("planned.amount")}
                    placeholderTextColor={TOKENS.colors.textMuted}
                    keyboardType="numeric"
                    style={styles.input}
                  />
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={styles.dateButton}
                    onPress={() => setIsDatePickerOpen(true)}
                  >
                    <Text style={styles.dateButtonText}>{loanDueDate}</Text>
                    <Calendar size={16} color={TOKENS.colors.textMuted} />
                  </TouchableOpacity>
                  <TextInput
                    value={loanNotes}
                    onChangeText={setLoanNotes}
                    placeholder={t("planned.notesPlaceholder")}
                    placeholderTextColor={TOKENS.colors.textMuted}
                    style={styles.input}
                  />

                  {accounts.length > 0 && (
                    <View style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>
                        {loanType === "borrow"
                          ? t("planned.depositAccount")
                          : t("planned.deductAccount")}
                      </Text>
                      <View style={styles.accountChipsRow}>
                        {accounts.map((acc) => {
                          const isSel = (loanAccountId || accounts[0]?.id) === acc.id;
                          return (
                            <TouchableOpacity
                              key={acc.id}
                              activeOpacity={0.7}
                              style={[styles.accountChip, isSel && styles.accountChipActive]}
                              onPress={() => setLoanAccountId(acc.id)}
                            >
                              <Text
                                style={[
                                  styles.accountChipText,
                                  isSel && styles.accountChipTextActive,
                                ]}
                              >
                                {acc.name}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  )}
                  <View style={styles.formActions}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={styles.cancelButton}
                      onPress={() => setIsAddingLoan(false)}
                    >
                      <Text style={styles.cancelText}>{t("common.cancel")}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={styles.confirmButton}
                      onPress={handleCreateLoan}
                    >
                      <Text style={styles.confirmText}>{t("common.confirm")}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.openAddButton}
                  onPress={() => setIsAddingLoan(true)}
                >
                  <Plus size={16} color={TOKENS.colors.textPrimary} />
                  <Text style={styles.openAddText}>{t("planned.newLoan")}</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </Animated.View>
      </Animated.View>
      <CalendarDatePicker
        isOpen={isDatePickerOpen}
        title={t("planned.dueDate")}
        selectedDate={loanDueDate}
        onSelectDate={(date) => {
          setLoanDueDate(date);
          setIsDatePickerOpen(false);
        }}
        onClose={() => setIsDatePickerOpen(false)}
      />
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
  closeButton: {
    padding: TOKENS.spacing.xs,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: TOKENS.colors.surfaceElevated,
    borderRadius: TOKENS.radii.pill,
    padding: 3,
    borderWidth: 1,
    borderColor: TOKENS.colors.borderSubtle,
  },
  tabButton: {
    flex: 1,
    paddingVertical: TOKENS.spacing.xs,
    borderRadius: TOKENS.radii.pill,
    alignItems: "center",
  },
  tabButtonActive: {
    backgroundColor: TOKENS.colors.primary,
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: TOKENS.colors.textSecondary,
  },
  tabButtonTextActive: {
    color: TOKENS.colors.textOnPrimary,
  },
  content: {
    gap: TOKENS.spacing.md,
    paddingBottom: TOKENS.spacing.lg,
  },
  tabContent: {
    gap: TOKENS.spacing.sm,
  },
  emptyText: {
    fontSize: 13,
    color: TOKENS.colors.textMuted,
    textAlign: "center",
    paddingVertical: TOKENS.spacing.md,
  },
  card: {
    backgroundColor: TOKENS.colors.surfaceElevated,
    borderRadius: TOKENS.radii.md,
    borderWidth: 1,
    borderColor: TOKENS.colors.borderSubtle,
    padding: TOKENS.spacing.md,
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
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: TOKENS.colors.textPrimary,
  },
  cardSubtitle: {
    fontSize: 12,
    fontWeight: "600",
    color: TOKENS.colors.textMuted,
  },
  cardAmount: {
    fontSize: 15,
    fontWeight: "800",
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
  statusBadge: {
    borderRadius: TOKENS.radii.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statusBadgePending: {
    backgroundColor: TOKENS.colors.surfaceSubtle,
  },
  statusBadgeCompleted: {
    backgroundColor: TOKENS.colors.successMuted,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  statusTextPending: {
    color: TOKENS.colors.textSecondary,
  },
  statusTextCompleted: {
    color: TOKENS.colors.success,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: TOKENS.colors.primary,
  },
  typeBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  loanTypeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    borderRadius: TOKENS.radii.pill,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeBorrow: {
    backgroundColor: TOKENS.colors.dangerMuted,
  },
  badgeLend: {
    backgroundColor: TOKENS.colors.successMuted,
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
  openAddButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: TOKENS.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: TOKENS.colors.borderSubtle,
    borderRadius: TOKENS.radii.md,
    paddingVertical: TOKENS.spacing.md,
  },
  openAddText: {
    fontSize: 13,
    fontWeight: "700",
    color: TOKENS.colors.textPrimary,
  },
  formContainer: {
    backgroundColor: TOKENS.colors.surfaceElevated,
    borderRadius: TOKENS.radii.md,
    borderWidth: 1,
    borderColor: TOKENS.colors.borderSubtle,
    padding: TOKENS.spacing.md,
    gap: TOKENS.spacing.sm,
  },
  formHeading: {
    fontSize: 14,
    fontWeight: "700",
    color: TOKENS.colors.textPrimary,
  },
  input: {
    height: 42,
    backgroundColor: TOKENS.colors.surface,
    borderWidth: 1,
    borderColor: TOKENS.colors.borderSubtle,
    borderRadius: TOKENS.radii.md,
    paddingHorizontal: TOKENS.spacing.md,
    color: TOKENS.colors.textPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
  loanTypeRow: {
    flexDirection: "row",
    gap: 8,
  },
  loanTypeButton: {
    flex: 1,
    height: 38,
    borderRadius: TOKENS.radii.md,
    backgroundColor: TOKENS.colors.surface,
    borderWidth: 1,
    borderColor: TOKENS.colors.borderSubtle,
    justifyContent: "center",
    alignItems: "center",
  },
  loanTypeButtonActive: {
    backgroundColor: TOKENS.colors.primary,
    borderColor: TOKENS.colors.primary,
  },
  loanTypeButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: TOKENS.colors.textSecondary,
  },
  loanTypeButtonTextActive: {
    color: TOKENS.colors.textOnPrimary,
  },
  formActions: {
    flexDirection: "row",
    gap: TOKENS.spacing.sm,
    marginTop: TOKENS.spacing.xs,
  },
  cancelButton: {
    flex: 1,
    height: 42,
    backgroundColor: TOKENS.colors.surfaceSubtle,
    borderRadius: TOKENS.radii.md,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelText: {
    fontSize: 13,
    fontWeight: "700",
    color: TOKENS.colors.textSecondary,
  },
  confirmButton: {
    flex: 2,
    height: 42,
    backgroundColor: TOKENS.colors.primary,
    borderRadius: TOKENS.radii.md,
    justifyContent: "center",
    alignItems: "center",
  },
  confirmText: {
    fontSize: 13,
    fontWeight: "700",
    color: TOKENS.colors.textOnPrimary,
  },
  fieldGroup: {
    gap: 4,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: TOKENS.colors.textMuted,
  },
  accountChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  accountChip: {
    backgroundColor: TOKENS.colors.surface,
    borderWidth: 1,
    borderColor: TOKENS.colors.borderSubtle,
    borderRadius: TOKENS.radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  accountChipActive: {
    backgroundColor: TOKENS.colors.primary,
    borderColor: TOKENS.colors.primary,
  },
  accountChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: TOKENS.colors.textSecondary,
  },
  accountChipTextActive: {
    color: TOKENS.colors.textOnPrimary,
    fontWeight: "700",
  },
  dateButton: {
    height: 42,
    backgroundColor: TOKENS.colors.surface,
    borderWidth: 1,
    borderColor: TOKENS.colors.borderSubtle,
    borderRadius: TOKENS.radii.md,
    paddingHorizontal: TOKENS.spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateButtonText: {
    color: TOKENS.colors.textPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
});
