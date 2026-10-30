import type { Account, LoanRecord, LoanType } from "@ration/types";
import { Calendar, X } from "lucide-react-native";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
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
import { CalendarDatePicker } from "./CalendarDatePicker";

interface RecordLoanModalProps {
  isOpen: boolean;
  accounts: Account[];
  currency: string;
  initialLoan?: LoanRecord | null;
  onClose: () => void;
  onSubmit: (
    loan: {
      counterparty: string;
      type: LoanType;
      amount: number;
      dueDate: string;
      accountId?: string;
      notes?: string;
    },
    loanIdToUpdate?: string
  ) => void;
}

export const RecordLoanModal: React.FC<RecordLoanModalProps> = ({
  isOpen,
  accounts,
  currency,
  initialLoan,
  onClose,
  onSubmit,
}) => {
  const { t } = useI18n();
  const [visible, setVisible] = useState(isOpen);
  const anim = useRef(new Animated.Value(0)).current;

  const [counterparty, setCounterparty] = useState("");
  const [loanType, setLoanType] = useState<LoanType>("borrow");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState(() => formatIsoDate(new Date()));
  const [accountId, setAccountId] = useState<string | undefined>(
    () => accounts.find((a) => a.isPrimary)?.id || accounts[0]?.id
  );
  const [notes, setNotes] = useState("");
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      if (initialLoan) {
        setCounterparty(initialLoan.counterparty);
        setLoanType(initialLoan.type);
        setAmount(String(initialLoan.amount));
        setDueDate(initialLoan.dueDate);
        setAccountId(
          initialLoan.accountId ?? accounts.find((a) => a.isPrimary)?.id ?? accounts[0]?.id
        );
        setNotes(initialLoan.notes ?? "");
      } else {
        setCounterparty("");
        setLoanType("borrow");
        setAmount("");
        setDueDate(formatIsoDate(new Date()));
        setAccountId(accounts.find((a) => a.isPrimary)?.id || accounts[0]?.id);
        setNotes("");
      }
      setIsDatePickerOpen(false);
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
  }, [accounts, anim, initialLoan, isOpen, visible]);

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

  const parsedAmount = Number.parseFloat(amount);
  const isValid = counterparty.trim().length > 0 && !Number.isNaN(parsedAmount) && parsedAmount > 0;

  function handleSubmit() {
    if (!isValid) return;
    onSubmit(
      {
        counterparty: counterparty.trim(),
        type: loanType,
        amount: parsedAmount,
        dueDate,
        accountId,
        notes: notes.trim() || undefined,
      },
      initialLoan?.id
    );
    handleDismiss();
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
    <>
      <Modal visible={visible} transparent animationType="none" onRequestClose={handleDismiss}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <TouchableOpacity
            activeOpacity={1}
            style={StyleSheet.absoluteFill}
            onPress={handleDismiss}
          />
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.keyboardView}
          >
            <Animated.View style={[styles.sheet, { transform: [{ translateY: sheetTranslateY }] }]}>
              <View style={styles.header}>
                <Text style={styles.title}>
                  {initialLoan ? t("planned.editLoan") : t("planned.newLoan")}
                </Text>
                <TouchableOpacity
                  onPress={handleDismiss}
                  accessibilityLabel={t("tracker.close")}
                  style={styles.closeButton}
                >
                  <X size={20} color={TOKENS.colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
              >
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

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>{t("planned.counterparty")}</Text>
                  <TextInput
                    value={counterparty}
                    onChangeText={setCounterparty}
                    placeholder={t("planned.counterpartyPlaceholder")}
                    placeholderTextColor={TOKENS.colors.textMuted}
                    style={styles.textInput}
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>
                    {t("planned.amount")} ({currency.trim()})
                  </Text>
                  <TextInput
                    value={amount}
                    onChangeText={setAmount}
                    placeholder={t("common.zero")}
                    placeholderTextColor={TOKENS.colors.textMuted}
                    keyboardType="numeric"
                    style={styles.textInput}
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>{t("planned.dueDate")}</Text>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={styles.dateButton}
                    onPress={() => setIsDatePickerOpen(true)}
                  >
                    <Text style={styles.dateButtonText}>{dueDate}</Text>
                    <Calendar size={16} color={TOKENS.colors.textMuted} />
                  </TouchableOpacity>
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>{t("planned.notes")}</Text>
                  <TextInput
                    value={notes}
                    onChangeText={setNotes}
                    placeholder={t("planned.notesPlaceholder")}
                    placeholderTextColor={TOKENS.colors.textMuted}
                    style={styles.textInput}
                  />
                </View>

                {accounts.length > 0 && (
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>
                      {loanType === "borrow"
                        ? t("planned.depositAccount")
                        : t("planned.deductAccount")}
                    </Text>
                    <View style={styles.accountPillsRow}>
                      {accounts.map((acc) => {
                        const isSelected = (accountId || accounts[0]?.id) === acc.id;
                        return (
                          <TouchableOpacity
                            key={acc.id}
                            activeOpacity={0.7}
                            style={[styles.accountPill, isSelected && styles.accountPillActive]}
                            onPress={() => setAccountId(acc.id)}
                          >
                            <Text
                              style={[
                                styles.accountPillText,
                                isSelected && styles.accountPillTextActive,
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
              </ScrollView>

              <View style={styles.actionsRow}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.cancelButton}
                  onPress={handleDismiss}
                >
                  <Text style={styles.cancelButtonText}>{t("common.cancel")}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  disabled={!isValid}
                  style={[
                    styles.submitButton,
                    isValid ? styles.submitButtonActive : styles.submitButtonDisabled,
                  ]}
                  onPress={handleSubmit}
                >
                  <Text
                    style={[
                      styles.submitButtonText,
                      isValid ? styles.submitButtonTextActive : styles.submitButtonTextDisabled,
                    ]}
                  >
                    {t("planned.saveLoan")}
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </KeyboardAvoidingView>
        </Animated.View>
      </Modal>

      <CalendarDatePicker
        isOpen={isDatePickerOpen}
        title={t("settings.selectDate")}
        selectedDate={dueDate}
        onSelectDate={(date) => {
          setDueDate(date);
          setIsDatePickerOpen(false);
        }}
        onClose={() => setIsDatePickerOpen(false)}
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
  keyboardView: {
    width: "100%",
  },
  sheet: {
    backgroundColor: TOKENS.colors.surface,
    borderTopLeftRadius: TOKENS.radii.card,
    borderTopRightRadius: TOKENS.radii.card,
    borderTopWidth: 1,
    borderTopColor: TOKENS.colors.border,
    padding: TOKENS.spacing.lg,
    maxHeight: "88%",
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
  content: {
    gap: TOKENS.spacing.md,
    paddingBottom: TOKENS.spacing.sm,
  },
  loanTypeRow: {
    flexDirection: "row",
    gap: TOKENS.spacing.xs,
  },
  loanTypeButton: {
    flex: 1,
    paddingVertical: TOKENS.spacing.sm,
    backgroundColor: TOKENS.colors.surfaceElevated,
    borderRadius: TOKENS.radii.md,
    borderWidth: 1,
    borderColor: TOKENS.colors.borderSubtle,
    alignItems: "center",
  },
  loanTypeButtonActive: {
    backgroundColor: TOKENS.colors.primary,
    borderColor: TOKENS.colors.primary,
  },
  loanTypeButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: TOKENS.colors.textSecondary,
  },
  loanTypeButtonTextActive: {
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
  textInput: {
    height: 44,
    backgroundColor: TOKENS.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: TOKENS.colors.borderSubtle,
    borderRadius: TOKENS.radii.md,
    paddingHorizontal: TOKENS.spacing.md,
    color: TOKENS.colors.textPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
  dateButton: {
    height: 44,
    backgroundColor: TOKENS.colors.surfaceElevated,
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
    fontWeight: "700",
  },
  accountPillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: TOKENS.spacing.xs,
  },
  accountPill: {
    paddingHorizontal: TOKENS.spacing.md,
    paddingVertical: TOKENS.spacing.xs,
    backgroundColor: TOKENS.colors.surfaceElevated,
    borderRadius: TOKENS.radii.pill,
    borderWidth: 1,
    borderColor: TOKENS.colors.borderSubtle,
  },
  accountPillActive: {
    backgroundColor: TOKENS.colors.primary,
    borderColor: TOKENS.colors.primary,
  },
  accountPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: TOKENS.colors.textSecondary,
  },
  accountPillTextActive: {
    color: TOKENS.colors.textOnPrimary,
  },
  actionsRow: {
    flexDirection: "row",
    gap: TOKENS.spacing.sm,
    marginTop: TOKENS.spacing.xs,
  },
  cancelButton: {
    flex: 1,
    height: 46,
    backgroundColor: TOKENS.colors.surfaceElevated,
    borderRadius: TOKENS.radii.md,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: TOKENS.colors.textSecondary,
  },
  submitButton: {
    flex: 2,
    height: 46,
    borderRadius: TOKENS.radii.md,
    justifyContent: "center",
    alignItems: "center",
  },
  submitButtonActive: {
    backgroundColor: TOKENS.colors.primary,
  },
  submitButtonDisabled: {
    backgroundColor: TOKENS.colors.surfaceElevated,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },
  submitButtonTextActive: {
    color: TOKENS.colors.textOnPrimary,
  },
  submitButtonTextDisabled: {
    color: TOKENS.colors.textMuted,
  },
});
