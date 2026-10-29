import type { Account, PlannedPayment, TransactionType } from "@ration/types";
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

interface RecordPlannedPaymentModalProps {
  isOpen: boolean;
  accounts: Account[];
  currency: string;
  initialPayment?: PlannedPayment | null;
  onClose: () => void;
  onSubmit: (
    payment: {
      name: string;
      amount: number;
      dueDate: string;
      type: TransactionType;
      accountId?: string;
      isRecurring?: boolean;
    },
    paymentIdToUpdate?: string
  ) => void;
}

export const RecordPlannedPaymentModal: React.FC<RecordPlannedPaymentModalProps> = ({
  isOpen,
  accounts,
  currency,
  initialPayment,
  onClose,
  onSubmit,
}) => {
  const { t } = useI18n();
  const [visible, setVisible] = useState(isOpen);
  const anim = useRef(new Animated.Value(0)).current;

  const [name, setName] = useState("");
  const [type, setType] = useState<TransactionType>("spend");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState(() => formatIsoDate(new Date()));
  const [accountId, setAccountId] = useState<string | undefined>(
    () => accounts.find((a) => a.isPrimary)?.id || accounts[0]?.id
  );
  const [isRecurring, setIsRecurring] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      if (initialPayment) {
        setName(initialPayment.name);
        setType(initialPayment.type ?? "spend");
        setAmount(String(initialPayment.amount));
        setDueDate(initialPayment.dueDate);
        setAccountId(
          initialPayment.accountId ?? accounts.find((a) => a.isPrimary)?.id ?? accounts[0]?.id
        );
        setIsRecurring(Boolean(initialPayment.isRecurring));
      } else {
        setName("");
        setType("spend");
        setAmount("");
        setDueDate(formatIsoDate(new Date()));
        setAccountId(accounts.find((a) => a.isPrimary)?.id || accounts[0]?.id);
        setIsRecurring(false);
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
  }, [accounts, anim, initialPayment, isOpen, visible]);

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
  const isValid = name.trim().length > 0 && !Number.isNaN(parsedAmount) && parsedAmount > 0;

  function handleSubmit() {
    if (!isValid) return;
    onSubmit(
      {
        name: name.trim(),
        type,
        amount: parsedAmount,
        dueDate,
        accountId,
        isRecurring,
      },
      initialPayment?.id
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
                  {initialPayment ? t("planned.editPlanned") : t("planned.newPlanned")}
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
                <View style={styles.typeRow}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={[styles.typeButton, type === "spend" && styles.typeButtonActive]}
                    onPress={() => setType("spend")}
                  >
                    <Text
                      style={[
                        styles.typeButtonText,
                        type === "spend" && styles.typeButtonTextActive,
                      ]}
                    >
                      {t("planned.typeBill")}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={[styles.typeButton, type === "income" && styles.typeButtonActive]}
                    onPress={() => setType("income")}
                  >
                    <Text
                      style={[
                        styles.typeButtonText,
                        type === "income" && styles.typeButtonTextActive,
                      ]}
                    >
                      {t("planned.typeIncome")}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>{t("planned.plannedName")}</Text>
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder={t("planned.namePlaceholder")}
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
                    placeholder={t("keypad.zero")}
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
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={[styles.recurringButton, isRecurring && styles.recurringButtonActive]}
                    onPress={() => setIsRecurring((prev) => !prev)}
                  >
                    <View style={[styles.checkbox, isRecurring && styles.checkboxActive]} />
                    <Text style={[styles.recurringText, isRecurring && styles.recurringTextActive]}>
                      {t("planned.recurringMonthly")}
                    </Text>
                  </TouchableOpacity>
                </View>

                {accounts.length > 0 && (
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>
                      {type === "income" ? t("planned.depositAccount") : t("planned.deductAccount")}
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
                  <Text style={styles.cancelButtonText}>{t("tracker.cancel")}</Text>
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
                    {t("planned.savePlanned")}
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
  typeRow: {
    flexDirection: "row",
    gap: TOKENS.spacing.xs,
  },
  typeButton: {
    flex: 1,
    paddingVertical: TOKENS.spacing.sm,
    backgroundColor: TOKENS.colors.surfaceElevated,
    borderRadius: TOKENS.radii.md,
    borderWidth: 1,
    borderColor: TOKENS.colors.borderSubtle,
    alignItems: "center",
  },
  typeButtonActive: {
    backgroundColor: TOKENS.colors.primary,
    borderColor: TOKENS.colors.primary,
  },
  typeButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: TOKENS.colors.textSecondary,
  },
  typeButtonTextActive: {
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
  recurringButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: TOKENS.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: TOKENS.colors.borderSubtle,
    borderRadius: TOKENS.radii.md,
    paddingHorizontal: TOKENS.spacing.md,
    height: 44,
  },
  recurringButtonActive: {
    borderColor: TOKENS.colors.primary,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: TOKENS.colors.textMuted,
  },
  checkboxActive: {
    backgroundColor: TOKENS.colors.primary,
    borderColor: TOKENS.colors.primary,
  },
  recurringText: {
    fontSize: 13,
    fontWeight: "600",
    color: TOKENS.colors.textSecondary,
  },
  recurringTextActive: {
    color: TOKENS.colors.textPrimary,
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
