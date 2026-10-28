import type { Account } from "@ration/types";
import { Delete, X } from "lucide-react-native";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useI18n } from "../i18n";
import { TOKENS } from "../theme/tokens";
import { formatCurrency } from "../utils/formatters";

interface KeypadModalProps {
  isOpen: boolean;
  currency: string;
  mode?: "spend" | "income";
  accounts?: Account[];
  foreseeableBalance?: number;
  remainingDaysCount?: number;
  onClose: () => void;
  onConfirm: (amount: number, accountId?: string) => void;
}

export const KeypadModal: React.FC<KeypadModalProps> = ({
  isOpen,
  currency,
  mode = "spend",
  accounts,
  foreseeableBalance,
  remainingDaysCount,
  onClose,
  onConfirm,
}) => {
  const { t } = useI18n();
  const [val, setVal] = useState("0");
  const [visible, setVisible] = useState(isOpen);
  const anim = useRef(new Animated.Value(0)).current;
  const [selectedAccountId, setSelectedAccountId] = useState<string | undefined>(() => {
    return accounts?.find((a) => a.isPrimary)?.id || accounts?.[0]?.id;
  });

  useEffect(() => {
    if (isOpen) {
      setVal("0");
      setSelectedAccountId(accounts?.find((a) => a.isPrimary)?.id || accounts?.[0]?.id);
      setVisible(true);
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
  }, [accounts, anim, isOpen, visible]);

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

  const handleDigit = useCallback((digit: string) => {
    setVal((prev) => {
      if (prev === "0") {
        return digit;
      }
      if (prev.includes(".")) {
        const decimalPart = prev.split(".")[1];
        if (decimalPart && decimalPart.length >= 2) {
          return prev;
        }
      }
      return `${prev}${digit}`;
    });
  }, []);

  const handleDot = useCallback(() => {
    setVal((prev) => {
      if (prev.includes(".")) {
        return prev;
      }
      return `${prev}.`;
    });
  }, []);

  const handleDelete = useCallback(() => {
    setVal((prev) => {
      if (prev.length <= 1) {
        return "0";
      }
      return prev.slice(0, -1);
    });
  }, []);

  function handleClear() {
    setVal("0");
  }

  function handleConfirm() {
    const parsed = Number.parseFloat(val);
    if (parsed > 0) {
      handleDismiss();
      onConfirm(parsed, selectedAccountId);
    }
  }

  const numericValue = Number.parseFloat(val);
  const isValid = !Number.isNaN(numericValue) && numericValue > 0;
  const modalTitle = mode === "income" ? t("tracker.addTitle") : t("tracker.keypadTitle");

  const enteredAmount = Number.parseFloat(val) || 0;
  const days = remainingDaysCount && remainingDaysCount > 0 ? remainingDaysCount : 1;
  const currentDaily = Math.floor((foreseeableBalance ?? 0) / days);

  let predictedText: string | null = null;
  if (
    foreseeableBalance !== undefined &&
    remainingDaysCount !== undefined &&
    remainingDaysCount > 0
  ) {
    if (enteredAmount > 0) {
      const nextForeseeable =
        mode === "income"
          ? foreseeableBalance + enteredAmount
          : Math.max(0, foreseeableBalance - enteredAmount);
      const nextDaily = Math.floor(nextForeseeable / days);
      const diff = nextDaily - currentDaily;
      const formattedFrom = formatCurrency(currentDaily, currency);
      const formattedTo = formatCurrency(nextDaily, currency);
      const formattedDiff = `${diff >= 0 ? "+" : ""}${formatCurrency(diff, currency)}`;
      predictedText = t("tracker.dailySpendPrediction", {
        from: formattedFrom,
        to: formattedTo,
        delta: formattedDiff,
      });
    } else {
      predictedText = t("tracker.currentDailySafeSpend", {
        amount: formatCurrency(currentDaily, currency),
      });
    }
  }

  if (!visible) return null;

  const backdropOpacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const sheetTranslateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [450, 0],
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
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{modalTitle}</Text>
            <TouchableOpacity
              onPress={handleDismiss}
              accessibilityLabel={t("tracker.close")}
              style={styles.closeButton}
            >
              <X size={20} color={TOKENS.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {accounts && accounts.length > 1 && (
            <View style={styles.accountSelector}>
              {accounts.map((acc) => {
                const isSel = (selectedAccountId || accounts[0]?.id) === acc.id;
                return (
                  <TouchableOpacity
                    key={acc.id}
                    activeOpacity={0.7}
                    style={[styles.accChip, isSel && styles.accChipActive]}
                    onPress={() => setSelectedAccountId(acc.id)}
                  >
                    <Text style={[styles.accChipText, isSel && styles.accChipTextActive]}>
                      {acc.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
          <View style={styles.displayBox}>
            <Text style={styles.displayCurrency}>{currency}</Text>
            <Text style={styles.displayValue}>{val}</Text>
          </View>

          {predictedText && <Text style={styles.predictionText}>{predictedText}</Text>}

          <View style={styles.keypadGrid}>
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
              <View key={digit} style={styles.keyWrapper}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.keyButton}
                  onPress={() => handleDigit(digit)}
                >
                  <Text style={styles.keyText}>{digit}</Text>
                </TouchableOpacity>
              </View>
            ))}

            <View style={styles.keyWrapper}>
              <TouchableOpacity activeOpacity={0.7} style={styles.keyButton} onPress={handleDot}>
                <Text style={styles.keyText}>.</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.keyWrapper}>
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.keyButton}
                onPress={() => handleDigit("0")}
              >
                <Text style={styles.keyText}>0</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.keyWrapper}>
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.keyButton}
                onPress={handleDelete}
                accessibilityLabel={t("common.delete")}
              >
                <Delete size={22} color={TOKENS.colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity activeOpacity={0.7} style={styles.clearButton} onPress={handleClear}>
              <Text style={styles.clearText}>{t("tracker.clear")}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              disabled={!isValid}
              style={[
                styles.confirmButton,
                isValid ? styles.confirmButtonActive : styles.confirmButtonDisabled,
              ]}
              onPress={handleConfirm}
            >
              <Text
                style={[
                  styles.confirmText,
                  isValid ? styles.confirmTextActive : styles.confirmTextDisabled,
                ]}
              >
                {t("tracker.confirm")}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
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
    gap: TOKENS.spacing.md,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sheetTitle: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    color: TOKENS.colors.textMuted,
  },
  closeButton: {
    padding: TOKENS.spacing.xs,
  },
  displayBox: {
    backgroundColor: TOKENS.colors.surfaceElevated,
    borderRadius: TOKENS.radii.md,
    borderWidth: 1,
    borderColor: TOKENS.colors.borderSubtle,
    paddingVertical: TOKENS.spacing.md,
    paddingHorizontal: TOKENS.spacing.lg,
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "flex-end",
    gap: 8,
  },
  displayCurrency: {
    fontSize: 22,
    fontWeight: "700",
    color: TOKENS.colors.textMuted,
  },
  displayValue: {
    fontSize: 36,
    fontWeight: "800",
    color: TOKENS.colors.textPrimary,
  },
  predictionText: {
    fontSize: 12,
    fontWeight: "600",
    color: TOKENS.colors.primary,
    textAlign: "center",
    marginTop: -4,
  },
  keypadGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -4,
  },
  keyWrapper: {
    width: "33.333%",
    padding: 4,
  },
  keyButton: {
    height: 52,
    backgroundColor: TOKENS.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: TOKENS.colors.borderSubtle,
    borderRadius: TOKENS.radii.md,
    justifyContent: "center",
    alignItems: "center",
  },
  keyText: {
    fontSize: 22,
    fontWeight: "700",
    color: TOKENS.colors.textPrimary,
  },
  actionRow: {
    flexDirection: "row",
    gap: TOKENS.spacing.sm,
    marginTop: TOKENS.spacing.xs,
  },
  clearButton: {
    flex: 1,
    height: 48,
    backgroundColor: TOKENS.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: TOKENS.colors.borderSubtle,
    borderRadius: TOKENS.radii.md,
    justifyContent: "center",
    alignItems: "center",
  },
  clearText: {
    fontSize: 14,
    fontWeight: "700",
    color: TOKENS.colors.textSecondary,
  },
  confirmButton: {
    flex: 2,
    height: 48,
    borderRadius: TOKENS.radii.md,
    justifyContent: "center",
    alignItems: "center",
  },
  confirmButtonActive: {
    backgroundColor: TOKENS.colors.primary,
  },
  confirmButtonDisabled: {
    backgroundColor: TOKENS.colors.surfaceElevated,
  },
  confirmText: {
    fontSize: 15,
    fontWeight: "700",
  },
  confirmTextActive: {
    color: TOKENS.colors.textOnPrimary,
  },
  confirmTextDisabled: {
    color: TOKENS.colors.textMuted,
  },
  accountSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  accChip: {
    backgroundColor: TOKENS.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: TOKENS.colors.borderSubtle,
    borderRadius: TOKENS.radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  accChipActive: {
    backgroundColor: TOKENS.colors.primary,
    borderColor: TOKENS.colors.primary,
  },
  accChipText: {
    fontSize: 11,
    fontWeight: "700",
    color: TOKENS.colors.textSecondary,
  },
  accChipTextActive: {
    color: TOKENS.colors.textOnPrimary,
  },
});
