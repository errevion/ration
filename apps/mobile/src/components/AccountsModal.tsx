import type { Account, AccountType } from "@ration/types";
import { Plus, Star, Trash2, X } from "lucide-react-native";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useI18n } from "../i18n";
import { TOKENS } from "../theme/tokens";
import { formatCurrency } from "../utils/formatters";

interface AccountsModalProps {
  isOpen: boolean;
  accounts: Account[];
  currency: string;
  onClose: () => void;
  onAddAccount: (account: {
    name: string;
    type?: AccountType;
    balance: number;
    includeInCalendar: boolean;
    isPrimary: boolean;
  }) => void;
  onToggleInclude: (accountId: string) => void;
  onSetPrimary: (accountId: string) => void;
  onDeleteAccount: (accountId: string) => void;
}

export const AccountsModal: React.FC<AccountsModalProps> = ({
  isOpen,
  accounts,
  currency,
  onClose,
  onAddAccount,
  onToggleInclude,
  onSetPrimary,
  onDeleteAccount,
}) => {
  const { t } = useI18n();
  const [visible, setVisible] = useState(isOpen);
  const anim = useRef(new Animated.Value(0)).current;

  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState("");
  const [balanceStr, setBalanceStr] = useState("0");
  const [includeInCalendar, setIncludeInCalendar] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      setIsAdding(false);
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

  function handleCreateAccount() {
    if (!name.trim()) return;
    const parsedBalance = Number.parseFloat(balanceStr) || 0;
    onAddAccount({
      name: name.trim(),
      type: "bank",
      balance: parsedBalance,
      includeInCalendar,
      isPrimary: accounts.length === 0,
    });
    setName("");
    setBalanceStr("0");
    setIsAdding(false);
  }

  function getTypeLabel(accType: AccountType): string {
    switch (accType) {
      case "bank":
        return t("accounts.typeBank");
      case "cash":
        return t("accounts.typeCash");
      case "wallet":
        return t("accounts.typeWallet");
      case "savings":
        return t("accounts.typeSavings");
      default:
        return t("accounts.typeOther");
    }
  }

  function handleDeleteAccount(acc: Account) {
    if (accounts.length <= 1) {
      Alert.alert(t("accounts.deleteAccount"), t("accounts.cannotDeleteLast"));
      return;
    }
    Alert.alert(t("accounts.deleteAccount"), t("accounts.deleteConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      { text: t("common.delete"), style: "destructive", onPress: () => onDeleteAccount(acc.id) },
    ]);
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
            <Text style={styles.title}>{t("accounts.title")}</Text>
            <TouchableOpacity
              onPress={handleDismiss}
              accessibilityLabel={t("tracker.close")}
              style={styles.closeButton}
            >
              <X size={20} color={TOKENS.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            <View style={styles.listSection}>
              {accounts.length === 0 ? (
                <Text style={styles.emptyText}>{t("accounts.noAccounts")}</Text>
              ) : (
                accounts.map((acc) => (
                  <View key={acc.id} style={styles.accountCard}>
                    <View style={styles.accountTop}>
                      <View style={styles.accountNameGroup}>
                        <Text style={styles.accountName}>{acc.name}</Text>
                        <View style={styles.tagRow}>
                          <View style={styles.typeTag}>
                            <Text style={styles.typeTagText}>{getTypeLabel(acc.type)}</Text>
                          </View>
                          {acc.isPrimary && (
                            <View style={styles.primaryTag}>
                              <Star
                                size={10}
                                color={TOKENS.colors.textOnPrimary}
                                fill={TOKENS.colors.textOnPrimary}
                              />
                              <Text style={styles.primaryTagText}>
                                {t("accounts.primaryBadge")}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                      <Text style={styles.accountBalance}>
                        {formatCurrency(acc.balance, currency)}
                      </Text>
                    </View>

                    <View style={styles.accountActions}>
                      <View style={styles.toggleRow}>
                        <Text style={styles.toggleLabel}>{t("accounts.includeInCalendar")}</Text>
                        <Switch
                          value={acc.includeInCalendar}
                          onValueChange={() => onToggleInclude(acc.id)}
                          trackColor={{
                            false: TOKENS.colors.borderSubtle,
                            true: TOKENS.colors.primary,
                          }}
                          thumbColor={TOKENS.colors.textPrimary}
                        />
                      </View>

                      <View style={styles.rightActionsRow}>
                        {!acc.isPrimary && (
                          <TouchableOpacity
                            activeOpacity={0.7}
                            style={styles.setPrimaryButton}
                            onPress={() => onSetPrimary(acc.id)}
                          >
                            <Text style={styles.setPrimaryText}>{t("accounts.isPrimary")}</Text>
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity
                          activeOpacity={0.7}
                          style={styles.deleteButton}
                          onPress={() => handleDeleteAccount(acc)}
                          accessibilityLabel={t("accounts.deleteAccount")}
                        >
                          <Trash2 size={15} color={TOKENS.colors.danger} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>

            {isAdding ? (
              <View style={styles.addForm}>
                <Text style={styles.formTitle}>{t("accounts.addAccount")}</Text>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>{t("accounts.accountName")}</Text>
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder={t("accounts.namePlaceholder")}
                    placeholderTextColor={TOKENS.colors.textMuted}
                    style={styles.input}
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>{t("accounts.initialBalance")}</Text>
                  <TextInput
                    value={balanceStr}
                    onChangeText={setBalanceStr}
                    keyboardType="numeric"
                    style={styles.input}
                  />
                </View>

                <View style={styles.toggleRow}>
                  <Text style={styles.toggleLabel}>{t("accounts.includeInCalendar")}</Text>
                  <Switch
                    value={includeInCalendar}
                    onValueChange={setIncludeInCalendar}
                    trackColor={{ false: TOKENS.colors.borderSubtle, true: TOKENS.colors.primary }}
                    thumbColor={TOKENS.colors.textPrimary}
                  />
                </View>

                <View style={styles.formActions}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={styles.cancelButton}
                    onPress={() => setIsAdding(false)}
                  >
                    <Text style={styles.cancelText}>{t("common.cancel")}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.saveAccountButton}
                    onPress={handleCreateAccount}
                  >
                    <Text style={styles.saveAccountText}>{t("common.confirm")}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.openAddButton}
                onPress={() => setIsAdding(true)}
              >
                <Plus size={16} color={TOKENS.colors.textPrimary} />
                <Text style={styles.openAddText}>{t("accounts.addAccount")}</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
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
  content: {
    gap: TOKENS.spacing.md,
    paddingBottom: TOKENS.spacing.lg,
  },
  listSection: {
    gap: TOKENS.spacing.sm,
  },
  emptyText: {
    fontSize: 13,
    color: TOKENS.colors.textMuted,
    textAlign: "center",
    paddingVertical: TOKENS.spacing.md,
  },
  accountCard: {
    backgroundColor: TOKENS.colors.surfaceElevated,
    borderRadius: TOKENS.radii.md,
    borderWidth: 1,
    borderColor: TOKENS.colors.borderSubtle,
    padding: TOKENS.spacing.md,
    gap: TOKENS.spacing.sm,
  },
  accountTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  accountNameGroup: {
    gap: 4,
  },
  accountName: {
    fontSize: 15,
    fontWeight: "700",
    color: TOKENS.colors.textPrimary,
  },
  tagRow: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  typeTag: {
    backgroundColor: TOKENS.colors.surfaceSubtle,
    borderRadius: TOKENS.radii.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  typeTagText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    color: TOKENS.colors.textSecondary,
  },
  primaryTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: TOKENS.colors.primary,
    borderRadius: TOKENS.radii.pill,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  primaryTagText: {
    fontSize: 10,
    fontWeight: "700",
    color: TOKENS.colors.textOnPrimary,
  },
  accountBalance: {
    fontSize: 16,
    fontWeight: "800",
    color: TOKENS.colors.textPrimary,
  },
  accountActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: TOKENS.colors.borderSubtle,
    paddingTop: TOKENS.spacing.xs,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  toggleLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: TOKENS.colors.textSecondary,
  },
  setPrimaryButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  setPrimaryText: {
    fontSize: 11,
    fontWeight: "700",
    color: TOKENS.colors.primary,
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
  addForm: {
    backgroundColor: TOKENS.colors.surfaceElevated,
    borderRadius: TOKENS.radii.md,
    borderWidth: 1,
    borderColor: TOKENS.colors.borderSubtle,
    padding: TOKENS.spacing.md,
    gap: TOKENS.spacing.sm,
  },
  formTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: TOKENS.colors.textPrimary,
  },
  fieldGroup: {
    gap: 4,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: TOKENS.colors.textMuted,
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
  saveAccountButton: {
    flex: 2,
    height: 42,
    backgroundColor: TOKENS.colors.primary,
    borderRadius: TOKENS.radii.md,
    justifyContent: "center",
    alignItems: "center",
  },
  saveAccountText: {
    fontSize: 13,
    fontWeight: "700",
    color: TOKENS.colors.textOnPrimary,
  },
  rightActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  deleteButton: {
    padding: 4,
  },
});
