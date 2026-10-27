import type { MoneyCycle } from "@ration/types";
import { Calendar, RotateCcw, X } from "lucide-react-native";
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
import { CalendarDatePicker } from "./CalendarDatePicker";

interface SettingsModalProps {
  isOpen: boolean;
  cycle: MoneyCycle;
  referenceDate: string;
  onClose: () => void;
  onSave: (settings: {
    currency: string;
    startDate: string;
    endDate: string;
    referenceDate?: string;
  }) => void;
}

const CURRENCY_PRESETS = ["Rp ", "$", "€", "£", "S$", "¥"];

function getCalendarMonthPreset(): { startDate: string; endDate: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();
  const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const endDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { startDate, endDate };
}

function getPaydayPeriodPreset(): { startDate: string; endDate: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const currentDay = now.getDate();

  let startYear = year;
  let startMonth = month;
  if (currentDay < 25) {
    startMonth = month - 1;
    if (startMonth < 0) {
      startMonth = 11;
      startYear = year - 1;
    }
  }

  let endYear = startYear;
  let endMonth = startMonth + 1;
  if (endMonth > 11) {
    endMonth = 0;
    endYear = startYear + 1;
  }

  const startDate = `${startYear}-${String(startMonth + 1).padStart(2, "0")}-25`;
  const endDate = `${endYear}-${String(endMonth + 1).padStart(2, "0")}-24`;
  return { startDate, endDate };
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  cycle,
  referenceDate,
  onClose,
  onSave,
}) => {
  const { t, locale, setLocale } = useI18n();

  const [currency, setCurrency] = useState(cycle.currency);
  const [startDate, setStartDate] = useState(cycle.startDate);
  const [endDate, setEndDate] = useState(cycle.endDate);
  const [activeRefDate, setActiveRefDate] = useState(referenceDate);

  const [activePickerTarget, setActivePickerTarget] = useState<"start" | "end" | "current" | null>(
    null
  );
  const [visible, setVisible] = useState(isOpen);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isOpen) {
      setCurrency(cycle.currency);
      setStartDate(cycle.startDate);
      setEndDate(cycle.endDate);
      setActiveRefDate(referenceDate);
      setActivePickerTarget(null);
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
  }, [anim, cycle, isOpen, referenceDate, visible]);

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

  const isDatePatternValid =
    /^\d{4}-\d{2}-\d{2}$/.test(startDate) && /^\d{4}-\d{2}-\d{2}$/.test(endDate);
  const isDateOrderValid = isDatePatternValid && startDate < endDate;
  const isCurrencyValid = currency.trim().length > 0;
  const isValid = isDateOrderValid && isCurrencyValid;

  function handleSave() {
    if (!isValid) return;
    handleDismiss();
    onSave({
      currency,
      startDate,
      endDate,
      referenceDate: activeRefDate,
    });
  }

  function handleApplyCalendarMonth() {
    const preset = getCalendarMonthPreset();
    setStartDate(preset.startDate);
    setEndDate(preset.endDate);
  }

  function handleApplyPaydayPeriod() {
    const preset = getPaydayPeriodPreset();
    setStartDate(preset.startDate);
    setEndDate(preset.endDate);
  }

  function handleResetCurrentDate() {
    setActiveRefDate(formatIsoDate(new Date()));
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
                <Text style={styles.sectionLabel}>{t("settings.cycleDates")}</Text>

                <View style={styles.presetsRow}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={styles.presetButton}
                    onPress={handleApplyCalendarMonth}
                  >
                    <Text style={styles.presetButtonText}>{t("settings.calendarMonth")}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={styles.presetButton}
                    onPress={handleApplyPaydayPeriod}
                  >
                    <Text style={styles.presetButtonText}>{t("settings.paydayPeriod")}</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.dateInputsRow}>
                  <View style={styles.dateField}>
                    <Text style={styles.fieldLabel}>{t("settings.startDate")}</Text>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={styles.dateButton}
                      onPress={() => setActivePickerTarget("start")}
                    >
                      <Text style={styles.dateButtonText}>{startDate}</Text>
                      <Calendar size={16} color={TOKENS.colors.textMuted} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.dateField}>
                    <Text style={styles.fieldLabel}>{t("settings.endDate")}</Text>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={styles.dateButton}
                      onPress={() => setActivePickerTarget("end")}
                    >
                      <Text style={styles.dateButtonText}>{endDate}</Text>
                      <Calendar size={16} color={TOKENS.colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                </View>

                {!isDateOrderValid && (
                  <Text style={styles.errorText}>{t("settings.invalidDates")}</Text>
                )}
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionLabel}>{t("settings.currentDate")}</Text>
                <View style={styles.currentDateRow}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={styles.currentDateButton}
                    onPress={() => setActivePickerTarget("current")}
                  >
                    <Text style={styles.dateButtonText}>{activeRefDate}</Text>
                    <Calendar size={16} color={TOKENS.colors.textMuted} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={styles.resetButton}
                    onPress={handleResetCurrentDate}
                    accessibilityLabel={t("settings.resetDate")}
                  >
                    <RotateCcw size={14} color={TOKENS.colors.textSecondary} />
                    <Text style={styles.resetButtonText}>{t("settings.resetDate")}</Text>
                  </TouchableOpacity>
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
        isOpen={activePickerTarget === "start"}
        title={t("settings.selectStartDate")}
        selectedDate={startDate}
        onSelectDate={(date) => setStartDate(date)}
        onClose={() => setActivePickerTarget(null)}
      />

      <CalendarDatePicker
        isOpen={activePickerTarget === "end"}
        title={t("settings.selectEndDate")}
        selectedDate={endDate}
        onSelectDate={(date) => setEndDate(date)}
        onClose={() => setActivePickerTarget(null)}
      />

      <CalendarDatePicker
        isOpen={activePickerTarget === "current"}
        title={t("settings.selectCurrentDate")}
        selectedDate={activeRefDate}
        onSelectDate={(date) => setActiveRefDate(date)}
        onClose={() => setActivePickerTarget(null)}
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
  presetsRow: {
    flexDirection: "row",
    gap: TOKENS.spacing.xs,
  },
  presetButton: {
    flex: 1,
    backgroundColor: TOKENS.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: TOKENS.colors.borderSubtle,
    borderRadius: TOKENS.radii.md,
    paddingVertical: TOKENS.spacing.xs,
    paddingHorizontal: TOKENS.spacing.sm,
    alignItems: "center",
  },
  presetButtonText: {
    fontSize: 11,
    fontWeight: "600",
    color: TOKENS.colors.textSecondary,
  },
  dateInputsRow: {
    flexDirection: "row",
    gap: TOKENS.spacing.sm,
  },
  dateField: {
    flex: 1,
    gap: 4,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: TOKENS.colors.textMuted,
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
  errorText: {
    fontSize: 12,
    color: TOKENS.colors.danger,
    marginTop: 2,
  },
  currentDateRow: {
    flexDirection: "row",
    gap: TOKENS.spacing.xs,
    alignItems: "center",
  },
  currentDateButton: {
    flex: 1,
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
  resetButton: {
    height: 44,
    paddingHorizontal: TOKENS.spacing.md,
    backgroundColor: TOKENS.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: TOKENS.colors.borderSubtle,
    borderRadius: TOKENS.radii.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  resetButtonText: {
    color: TOKENS.colors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
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
});
