import type { MoneyCycle } from "@ration/types";
import { Calendar, Download, RotateCcw, Upload, X } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "../i18n/index.js";
import { TOKENS } from "../theme/tokens.js";
import { formatIsoDate } from "../utils/budgetEngine.js";
import { CalendarDatePicker } from "./CalendarDatePicker.js";

interface SettingsDrawerProps {
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
  onExportBackup?: () => void;
  onImportBackup?: (file: File) => void;
}

const CURRENCY_PRESETS = ["Rp ", "$", "€", "£", "¥"];

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

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({
  isOpen,
  cycle,
  referenceDate,
  onClose,
  onSave,
  onExportBackup,
  onImportBackup,
}) => {
  const { t, locale, setLocale } = useI18n();

  const [currency, setCurrency] = useState(cycle.currency);
  const [startDate, setStartDate] = useState(cycle.startDate);
  const [endDate, setEndDate] = useState(cycle.endDate);
  const [activeRefDate, setActiveRefDate] = useState(referenceDate);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activePickerTarget, setActivePickerTarget] = useState<"start" | "end" | "current" | null>(
    null
  );

  useEffect(() => {
    if (isOpen) {
      setCurrency(cycle.currency);
      setStartDate(cycle.startDate);
      setEndDate(cycle.endDate);
      setActiveRefDate(referenceDate);
      setActivePickerTarget(null);
    }
  }, [isOpen, cycle, referenceDate]);

  const isDatePatternValid =
    /^\d{4}-\d{2}-\d{2}$/.test(startDate) && /^\d{4}-\d{2}-\d{2}$/.test(endDate);
  const isDateOrderValid = isDatePatternValid && startDate < endDate;
  const isCurrencyValid = currency.trim().length > 0;
  const isValid = isDateOrderValid && isCurrencyValid;

  function handleSave() {
    if (!isValid) return;
    onSave({
      currency,
      startDate,
      endDate,
      referenceDate: activeRefDate,
    });
    onClose();
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

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.75)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          alignItems: "center",
          zIndex: 1000,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          transition: "opacity 0.25s ease-out",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "430px",
            backgroundColor: TOKENS.colors.surface,
            borderTop: `1px solid ${TOKENS.colors.border}`,
            borderTopLeftRadius: TOKENS.radii.card,
            borderTopRightRadius: TOKENS.radii.card,
            padding: TOKENS.spacing.lg,
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            gap: TOKENS.spacing.md,
            maxHeight: "85vh",
            overflowY: "auto",
            overflowX: "hidden",
            scrollbarWidth: "none",
            transform: isOpen ? "translateY(0)" : "translateY(100%)",
            transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontSize: "15px",
                fontWeight: 700,
                color: TOKENS.colors.textPrimary,
              }}
            >
              {t("settings.title")}
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label={t("tracker.close")}
              style={{
                background: "transparent",
                border: "none",
                color: TOKENS.colors.textSecondary,
                cursor: "pointer",
                padding: TOKENS.spacing.xs,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={20} />
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: TOKENS.spacing.xs }}>
            <span
              style={{
                fontSize: "12px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                color: TOKENS.colors.textMuted,
              }}
            >
              {t("settings.language")}
            </span>
            <div
              style={{
                display: "flex",
                backgroundColor: TOKENS.colors.surfaceElevated,
                borderRadius: TOKENS.radii.pill,
                padding: "3px",
                border: `1px solid ${TOKENS.colors.borderSubtle}`,
              }}
            >
              <button
                type="button"
                onClick={() => setLocale("en")}
                style={{
                  flex: 1,
                  padding: `${TOKENS.spacing.sm} 0`,
                  borderRadius: TOKENS.radii.pill,
                  border: "none",
                  backgroundColor: locale === "en" ? TOKENS.colors.primary : "transparent",
                  color:
                    locale === "en" ? TOKENS.colors.textOnPrimary : TOKENS.colors.textSecondary,
                  fontWeight: 700,
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                {t("locale.english")}
              </button>
              <button
                type="button"
                onClick={() => setLocale("id")}
                style={{
                  flex: 1,
                  padding: `${TOKENS.spacing.sm} 0`,
                  borderRadius: TOKENS.radii.pill,
                  border: "none",
                  backgroundColor: locale === "id" ? TOKENS.colors.primary : "transparent",
                  color:
                    locale === "id" ? TOKENS.colors.textOnPrimary : TOKENS.colors.textSecondary,
                  fontWeight: 700,
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                {t("locale.indonesian")}
              </button>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: TOKENS.spacing.xs }}>
            <span
              style={{
                fontSize: "12px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                color: TOKENS.colors.textMuted,
              }}
            >
              {t("settings.currency")}
            </span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: TOKENS.spacing.xs }}>
              {CURRENCY_PRESETS.map((preset) => {
                const isSelected = currency === preset;
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setCurrency(preset)}
                    style={{
                      padding: `${TOKENS.spacing.sm} ${TOKENS.spacing.md}`,
                      backgroundColor: isSelected
                        ? TOKENS.colors.primary
                        : TOKENS.colors.surfaceElevated,
                      color: isSelected ? TOKENS.colors.textOnPrimary : TOKENS.colors.textPrimary,
                      border: `1px solid ${isSelected ? TOKENS.colors.primary : TOKENS.colors.borderSubtle}`,
                      borderRadius: TOKENS.radii.md,
                      fontWeight: 700,
                      fontSize: "14px",
                      cursor: "pointer",
                    }}
                  >
                    {preset.trim()}
                  </button>
                );
              })}
            </div>
            <input
              type="text"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              placeholder={t("settings.customCurrency")}
              maxLength={8}
              style={{
                height: "42px",
                backgroundColor: TOKENS.colors.surfaceElevated,
                border: `1px solid ${TOKENS.colors.borderSubtle}`,
                borderRadius: TOKENS.radii.md,
                padding: `0 ${TOKENS.spacing.md}`,
                color: TOKENS.colors.textPrimary,
                fontSize: "14px",
                fontWeight: 600,
                marginTop: TOKENS.spacing.xs,
                boxSizing: "border-box",
                width: "100%",
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: TOKENS.spacing.xs }}>
            <span
              style={{
                fontSize: "12px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                color: TOKENS.colors.textMuted,
              }}
            >
              {t("settings.cycleDates")}
            </span>

            <div style={{ display: "flex", gap: TOKENS.spacing.xs }}>
              <button
                type="button"
                onClick={handleApplyCalendarMonth}
                style={{
                  flex: 1,
                  padding: `${TOKENS.spacing.xs} ${TOKENS.spacing.sm}`,
                  backgroundColor: TOKENS.colors.surfaceSubtle,
                  border: `1px solid ${TOKENS.colors.borderSubtle}`,
                  borderRadius: TOKENS.radii.md,
                  color: TOKENS.colors.textSecondary,
                  fontSize: "11px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {t("settings.calendarMonth")}
              </button>
              <button
                type="button"
                onClick={handleApplyPaydayPeriod}
                style={{
                  flex: 1,
                  padding: `${TOKENS.spacing.xs} ${TOKENS.spacing.sm}`,
                  backgroundColor: TOKENS.colors.surfaceSubtle,
                  border: `1px solid ${TOKENS.colors.borderSubtle}`,
                  borderRadius: TOKENS.radii.md,
                  color: TOKENS.colors.textSecondary,
                  fontSize: "11px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {t("settings.paydayPeriod")}
              </button>
            </div>

            <div style={{ display: "flex", gap: TOKENS.spacing.sm, marginTop: TOKENS.spacing.xs }}>
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                  minWidth: 0,
                }}
              >
                <span style={{ fontSize: "11px", fontWeight: 600, color: TOKENS.colors.textMuted }}>
                  {t("settings.startDate")}
                </span>
                <button
                  type="button"
                  onClick={() => setActivePickerTarget("start")}
                  style={{
                    height: "42px",
                    backgroundColor: TOKENS.colors.surfaceElevated,
                    border: `1px solid ${TOKENS.colors.borderSubtle}`,
                    borderRadius: TOKENS.radii.md,
                    padding: `0 ${TOKENS.spacing.md}`,
                    color: TOKENS.colors.textPrimary,
                    fontSize: "14px",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                >
                  <span>{startDate}</span>
                  <Calendar size={16} color={TOKENS.colors.textMuted} />
                </button>
              </div>

              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                  minWidth: 0,
                }}
              >
                <span style={{ fontSize: "11px", fontWeight: 600, color: TOKENS.colors.textMuted }}>
                  {t("settings.endDate")}
                </span>
                <button
                  type="button"
                  onClick={() => setActivePickerTarget("end")}
                  style={{
                    height: "42px",
                    backgroundColor: TOKENS.colors.surfaceElevated,
                    border: `1px solid ${TOKENS.colors.borderSubtle}`,
                    borderRadius: TOKENS.radii.md,
                    padding: `0 ${TOKENS.spacing.md}`,
                    color: TOKENS.colors.textPrimary,
                    fontSize: "14px",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                >
                  <span>{endDate}</span>
                  <Calendar size={16} color={TOKENS.colors.textMuted} />
                </button>
              </div>
            </div>

            {!isDateOrderValid && (
              <span style={{ fontSize: "12px", color: TOKENS.colors.danger, marginTop: "2px" }}>
                {t("settings.invalidDates")}
              </span>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: TOKENS.spacing.xs }}>
            <span
              style={{
                fontSize: "12px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                color: TOKENS.colors.textMuted,
              }}
            >
              {t("settings.currentDate")}
            </span>
            <div style={{ display: "flex", gap: TOKENS.spacing.xs, alignItems: "center" }}>
              <button
                type="button"
                onClick={() => setActivePickerTarget("current")}
                style={{
                  flex: 1,
                  height: "42px",
                  backgroundColor: TOKENS.colors.surfaceElevated,
                  border: `1px solid ${TOKENS.colors.borderSubtle}`,
                  borderRadius: TOKENS.radii.md,
                  padding: `0 ${TOKENS.spacing.md}`,
                  color: TOKENS.colors.textPrimary,
                  fontSize: "14px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  minWidth: 0,
                  boxSizing: "border-box",
                }}
              >
                <span>{activeRefDate}</span>
                <Calendar size={16} color={TOKENS.colors.textMuted} />
              </button>
              <button
                type="button"
                onClick={handleResetCurrentDate}
                aria-label={t("settings.resetDate")}
                style={{
                  height: "42px",
                  padding: `0 ${TOKENS.spacing.md}`,
                  backgroundColor: TOKENS.colors.surfaceSubtle,
                  border: `1px solid ${TOKENS.colors.borderSubtle}`,
                  borderRadius: TOKENS.radii.md,
                  color: TOKENS.colors.textSecondary,
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  whiteSpace: "nowrap",
                }}
              >
                <RotateCcw size={14} />
                <span>{t("settings.resetDate")}</span>
              </button>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: TOKENS.spacing.xs }}>
            <span
              style={{
                fontSize: "12px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                color: TOKENS.colors.textMuted,
              }}
            >
              {t("settings.dataManagement")}
            </span>
            <div style={{ display: "flex", gap: TOKENS.spacing.sm }}>
              {onExportBackup && (
                <button
                  type="button"
                  onClick={onExportBackup}
                  style={{
                    flex: 1,
                    height: "42px",
                    backgroundColor: TOKENS.colors.surfaceElevated,
                    border: `1px solid ${TOKENS.colors.borderSubtle}`,
                    borderRadius: TOKENS.radii.md,
                    color: TOKENS.colors.textPrimary,
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                  }}
                >
                  <Download size={15} />
                  <span>{t("settings.exportBackup")}</span>
                </button>
              )}
              {onImportBackup && (
                <>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".json,application/json"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        onImportBackup(file);
                        e.target.value = "";
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      flex: 1,
                      height: "42px",
                      backgroundColor: TOKENS.colors.surfaceElevated,
                      border: `1px solid ${TOKENS.colors.borderSubtle}`,
                      borderRadius: TOKENS.radii.md,
                      color: TOKENS.colors.textPrimary,
                      fontSize: "13px",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                    }}
                  >
                    <Upload size={15} />
                    <span>{t("settings.importBackup")}</span>
                  </button>
                </>
              )}
            </div>
          </div>

          <button
            type="button"
            disabled={!isValid}
            onClick={handleSave}
            style={{
              height: "48px",
              backgroundColor: isValid ? TOKENS.colors.primary : TOKENS.colors.surfaceElevated,
              color: isValid ? TOKENS.colors.textOnPrimary : TOKENS.colors.textMuted,
              border: "none",
              borderRadius: TOKENS.radii.md,
              fontSize: "15px",
              fontWeight: 700,
              cursor: isValid ? "pointer" : "not-allowed",
              marginTop: TOKENS.spacing.xs,
            }}
          >
            {t("settings.saveSettings")}
          </button>
        </div>
      </div>

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
