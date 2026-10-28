import type { MoneyCycle } from "@ration/types";
import { Calendar, Download, Upload, X } from "lucide-react-native";
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
import { computeCycleRange } from "../utils/budgetEngine";
import { CalendarDatePicker } from "./CalendarDatePicker";

interface SettingsModalProps {
  isOpen: boolean;
  cycle: MoneyCycle;
  onClose: () => void;
  onSave: (settings: { currency: string; startDay: number }) => void;
  onExportBackup?: () => void;
  onImportBackup?: () => void;
}

const CURRENCY_PRESETS = ["Rp ", "$", "€", "£", "¥"];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  cycle,
  onClose,
  onSave,
  onExportBackup,
  onImportBackup,
}) => {
  const { t, locale, setLocale } = useI18n();

  const [currency, setCurrency] = useState(cycle.currency);
  const [selectedAnchorDay, setSelectedAnchorDay] = useState(cycle.startDay ?? 1);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const [visible, setVisible] = useState(isOpen);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isOpen) {
      setCurrency(cycle.currency);
      setSelectedAnchorDay(cycle.startDay ?? 1);
      setIsDatePickerOpen(false);
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
  }, [anim, cycle, isOpen, visible]);

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

  const isCurrencyValid = currency.trim().length > 0;
  const isStartDayValid = selectedAnchorDay >= 1 && selectedAnchorDay <= 31;
  const isValid = isCurrencyValid && isStartDayValid;
  const activeRange = computeCycleRange(selectedAnchorDay);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = String(now.getMonth() + 1).padStart(2, "0");
  const anchorDateIso = `${currentYear}-${currentMonth}-${String(selectedAnchorDay).padStart(2, "0")}`;

  function handleSave() {
    if (!isValid) return;
    handleDismiss();
    onSave({
      currency,
      startDay: selectedAnchorDay,
    });
  }

  function handleDatePicked(isoDate: string) {
    const parts = isoDate.split("-");
    const day = Number.parseInt(parts[2], 10);
    if (!Number.isNaN(day) && day >= 1 && day <= 31) {
      setSelectedAnchorDay(day);
    }
    setIsDatePickerOpen(false);
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
          <Animated.View style={[styles.sheet, { transform: [{ translateY: sheetTranslateY }] }]}>
            <View style={styles.header}>
              <Text style={styles.title}>{t("settings.title")}</Text>
              <TouchableOpacity
                onPress={handleDismiss}
                accessibilityLabel={t("tracker.close")}
                style={styles.closeButton}
              >
                <X size={20} color={TOKENS.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>{t("settings.language")}</Text>
                <View style={styles.languageRow}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={[styles.languagePill, locale === "en" && styles.languagePillActive]}
                    onPress={() => setLocale("en")}
                  >
                    <Text
                      style={[styles.languageText, locale === "en" && styles.languageTextActive]}
                    >
                      {t("locale.english")}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={[styles.languagePill, locale === "id" && styles.languagePillActive]}
                    onPress={() => setLocale("id")}
                  >
                    <Text
                      style={[styles.languageText, locale === "id" && styles.languageTextActive]}
                    >
                      {t("locale.indonesian")}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionLabel}>{t("settings.currency")}</Text>
                <View style={styles.currencyRow}>
                  {CURRENCY_PRESETS.map((preset) => {
                    const isSelected = currency === preset;
                    return (
                      <TouchableOpacity
                        key={preset}
                        activeOpacity={0.7}
                        style={[styles.currencyChip, isSelected && styles.currencyChipActive]}
                        onPress={() => setCurrency(preset)}
                      >
                        <Text
                          style={[
                            styles.currencyChipText,
                            isSelected && styles.currencyChipTextActive,
                          ]}
                        >
                          {preset.trim()}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <TextInput
                  value={currency}
                  onChangeText={setCurrency}
                  placeholder={t("settings.customCurrency")}
                  placeholderTextColor={TOKENS.colors.textMuted}
                  maxLength={8}
                  style={styles.textInput}
                />
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionLabel}>{t("settings.firstDateOfMonth")}</Text>

                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.dateButton}
                  onPress={() => setIsDatePickerOpen(true)}
                >
                  <Text style={styles.dateButtonText}>{anchorDateIso}</Text>
                  <Calendar size={16} color={TOKENS.colors.textMuted} />
                </TouchableOpacity>

                <Text style={styles.previewText}>
                  {t("settings.activeCycleRange", {
                    range: `${activeRange.startDate} - ${activeRange.endDate}`,
                  })}
                </Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionLabel}>{t("settings.dataManagement")}</Text>
                <View style={styles.backupRow}>
                  {onExportBackup && (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={styles.backupButton}
                      onPress={onExportBackup}
                    >
                      <Download size={16} color={TOKENS.colors.textPrimary} />
                      <Text style={styles.backupButtonText}>{t("settings.exportBackup")}</Text>
                    </TouchableOpacity>
                  )}
                  {onImportBackup && (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={styles.backupButton}
                      onPress={onImportBackup}
                    >
                      <Upload size={16} color={TOKENS.colors.textPrimary} />
                      <Text style={styles.backupButtonText}>{t("settings.importBackup")}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity
              activeOpacity={0.8}
              disabled={!isValid}
              style={[
                styles.saveButton,
                isValid ? styles.saveButtonActive : styles.saveButtonDisabled,
              ]}
              onPress={handleSave}
            >
              <Text
                style={[styles.saveText, isValid ? styles.saveTextActive : styles.saveTextDisabled]}
              >
                {t("settings.saveSettings")}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </Modal>

      <CalendarDatePicker
        isOpen={isDatePickerOpen}
        title={t("settings.selectAnchorDate")}
        selectedDate={anchorDateIso}
        onSelectDate={handleDatePicked}
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
    gap: TOKENS.spacing.lg,
    paddingBottom: TOKENS.spacing.md,
  },
  section: {
    gap: TOKENS.spacing.sm,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: TOKENS.colors.textMuted,
  },
  languageRow: {
    flexDirection: "row",
    backgroundColor: TOKENS.colors.surfaceElevated,
    borderRadius: TOKENS.radii.pill,
    padding: 3,
    borderWidth: 1,
    borderColor: TOKENS.colors.borderSubtle,
  },
  languagePill: {
    flex: 1,
    paddingVertical: TOKENS.spacing.sm,
    borderRadius: TOKENS.radii.pill,
    alignItems: "center",
  },
  languagePillActive: {
    backgroundColor: TOKENS.colors.primary,
  },
  languageText: {
    fontSize: 13,
    fontWeight: "700",
    color: TOKENS.colors.textSecondary,
  },
  languageTextActive: {
    color: TOKENS.colors.textOnPrimary,
  },
  currencyRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: TOKENS.spacing.xs,
  },
  currencyChip: {
    paddingHorizontal: TOKENS.spacing.md,
    paddingVertical: TOKENS.spacing.sm,
    backgroundColor: TOKENS.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: TOKENS.colors.borderSubtle,
    borderRadius: TOKENS.radii.md,
  },
  currencyChipActive: {
    backgroundColor: TOKENS.colors.primary,
    borderColor: TOKENS.colors.primary,
  },
  currencyChipText: {
    fontSize: 14,
    fontWeight: "700",
    color: TOKENS.colors.textPrimary,
  },
  currencyChipTextActive: {
    color: TOKENS.colors.textOnPrimary,
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
  previewText: {
    fontSize: 12,
    fontWeight: "600",
    color: TOKENS.colors.textSecondary,
  },
  saveButton: {
    height: 48,
    borderRadius: TOKENS.radii.md,
    justifyContent: "center",
    alignItems: "center",
  },
  saveButtonActive: {
    backgroundColor: TOKENS.colors.primary,
  },
  saveButtonDisabled: {
    backgroundColor: TOKENS.colors.surfaceElevated,
  },
  saveText: {
    fontSize: 15,
    fontWeight: "700",
  },
  saveTextActive: {
    color: TOKENS.colors.textOnPrimary,
  },
  saveTextDisabled: {
    color: TOKENS.colors.textMuted,
  },
  backupRow: {
    flexDirection: "row",
    gap: TOKENS.spacing.sm,
  },
  backupButton: {
    flex: 1,
    height: 44,
    backgroundColor: TOKENS.colors.surfaceElevated,
    borderWidth: 1,
    borderColor: TOKENS.colors.borderSubtle,
    borderRadius: TOKENS.radii.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  backupButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: TOKENS.colors.textPrimary,
  },
});
