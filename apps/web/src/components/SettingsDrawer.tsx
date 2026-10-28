import type { MoneyCycle } from "@ration/types";
import { Calendar, Download, Upload, X } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "../i18n/index.js";
import { TOKENS } from "../theme/tokens.js";
import { computeCycleRange } from "../utils/budgetEngine.js";
import { CalendarDatePicker } from "./CalendarDatePicker.js";

interface SettingsDrawerProps {
  isOpen: boolean;
  cycle: MoneyCycle;
  onClose: () => void;
  onSave: (settings: { currency: string; startDay: number }) => void;
  onExportBackup?: () => void;
  onImportBackup?: (file: File) => void;
}

const CURRENCY_PRESETS = ["Rp ", "$", "€", "£", "¥"];

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({
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

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setCurrency(cycle.currency);
      setSelectedAnchorDay(cycle.startDay ?? 1);
      setIsDatePickerOpen(false);
    }
  }, [isOpen, cycle]);

  const isStartDayValid = selectedAnchorDay >= 1 && selectedAnchorDay <= 31;
  const isCurrencyValid = currency.trim().length > 0;
  const isValid = isStartDayValid && isCurrencyValid;
  const activeRange = computeCycleRange(selectedAnchorDay);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = String(now.getMonth() + 1).padStart(2, "0");
  const anchorDateIso = `${currentYear}-${currentMonth}-${String(selectedAnchorDay).padStart(2, "0")}`;

  function handleSave() {
    if (!isValid) return;
    onSave({
      currency,
      startDay: selectedAnchorDay,
    });
    onClose();
  }

  function handleDatePicked(isoDate: string) {
    const parts = isoDate.split("-");
    const day = Number.parseInt(parts[2], 10);
    if (!Number.isNaN(day) && day >= 1 && day <= 31) {
      setSelectedAnchorDay(day);
    }
    setIsDatePickerOpen(false);
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
                  background: locale === "en" ? TOKENS.colors.primary : "transparent",
                  color:
                    locale === "en" ? TOKENS.colors.textOnPrimary : TOKENS.colors.textSecondary,
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
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
                  background: locale === "id" ? TOKENS.colors.primary : "transparent",
                  color:
                    locale === "id" ? TOKENS.colors.textOnPrimary : TOKENS.colors.textSecondary,
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
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
            <div style={{ display: "flex", gap: TOKENS.spacing.xs, flexWrap: "wrap" }}>
              {CURRENCY_PRESETS.map((preset) => {
                const isSelected = currency === preset;
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setCurrency(preset)}
                    style={{
                      padding: `${TOKENS.spacing.sm} ${TOKENS.spacing.md}`,
                      borderRadius: TOKENS.radii.md,
                      border: `1px solid ${isSelected ? TOKENS.colors.primary : TOKENS.colors.borderSubtle}`,
                      background: isSelected
                        ? TOKENS.colors.primary
                        : TOKENS.colors.surfaceElevated,
                      color: isSelected ? TOKENS.colors.textOnPrimary : TOKENS.colors.textPrimary,
                      fontSize: "14px",
                      fontWeight: 700,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
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
                height: "44px",
                backgroundColor: TOKENS.colors.surfaceElevated,
                border: `1px solid ${TOKENS.colors.borderSubtle}`,
                borderRadius: TOKENS.radii.md,
                padding: `0 ${TOKENS.spacing.md}`,
                color: TOKENS.colors.textPrimary,
                fontSize: "14px",
                fontWeight: 600,
                outline: "none",
                boxSizing: "border-box",
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
              {t("settings.firstDateOfMonth")}
            </span>

            <button
              type="button"
              onClick={() => setIsDatePickerOpen(true)}
              style={{
                height: "44px",
                backgroundColor: TOKENS.colors.surfaceElevated,
                border: `1px solid ${TOKENS.colors.borderSubtle}`,
                borderRadius: TOKENS.radii.md,
                padding: `0 ${TOKENS.spacing.md}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                color: TOKENS.colors.textPrimary,
                fontSize: "14px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              <span>{anchorDateIso}</span>
              <Calendar size={16} color={TOKENS.colors.textMuted} />
            </button>

            <span
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: TOKENS.colors.textSecondary,
              }}
            >
              {t("settings.activeCycleRange", {
                range: `${activeRange.startDate} - ${activeRange.endDate}`,
              })}
            </span>
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
                    height: "44px",
                    backgroundColor: TOKENS.colors.surfaceElevated,
                    border: `1px solid ${TOKENS.colors.borderSubtle}`,
                    borderRadius: TOKENS.radii.md,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    color: TOKENS.colors.textPrimary,
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  <Download size={16} />
                  <span>{t("settings.exportBackup")}</span>
                </button>
              )}
              {onImportBackup && (
                <>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      flex: 1,
                      height: "44px",
                      backgroundColor: TOKENS.colors.surfaceElevated,
                      border: `1px solid ${TOKENS.colors.borderSubtle}`,
                      borderRadius: TOKENS.radii.md,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      color: TOKENS.colors.textPrimary,
                      fontSize: "13px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    <Upload size={16} />
                    <span>{t("settings.importBackup")}</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
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
              borderRadius: TOKENS.radii.md,
              border: "none",
              backgroundColor: isValid ? TOKENS.colors.primary : TOKENS.colors.surfaceElevated,
              color: isValid ? TOKENS.colors.textOnPrimary : TOKENS.colors.textMuted,
              fontSize: "15px",
              fontWeight: 700,
              cursor: isValid ? "pointer" : "not-allowed",
              transition: "all 0.15s ease",
              marginTop: TOKENS.spacing.sm,
            }}
          >
            {t("settings.saveSettings")}
          </button>
        </div>
      </div>

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
