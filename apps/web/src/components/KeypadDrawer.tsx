import type { Account } from "@ration/types";
import { Delete, X } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { useI18n } from "../i18n/index.js";
import { TOKENS } from "../theme/tokens.js";
import { formatCurrency } from "../utils/formatters.js";

interface KeypadDrawerProps {
  isOpen: boolean;
  currency: string;
  mode?: "spend" | "income";
  accounts?: Account[];
  foreseeableBalance?: number;
  remainingDaysCount?: number;
  onClose: () => void;
  onConfirm: (amount: number, accountId?: string) => void;
}

export const KeypadDrawer: React.FC<KeypadDrawerProps> = ({
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
  const [selectedAccountId, setSelectedAccountId] = useState<string | undefined>(() => {
    return accounts?.find((a) => a.isPrimary)?.id || accounts?.[0]?.id;
  });

  useEffect(() => {
    if (isOpen) {
      setVal("0");
      setSelectedAccountId(accounts?.find((a) => a.isPrimary)?.id || accounts?.[0]?.id);
    }
  }, [accounts, isOpen]);

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
      onConfirm(parsed, selectedAccountId);
    }
  }

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "Enter") {
        const num = Number.parseFloat(val);
        if (num > 0) {
          onConfirm(num, selectedAccountId);
        }
      } else if (e.key >= "0" && e.key <= "9") {
        handleDigit(e.key);
      } else if (e.key === ".") {
        handleDot();
      } else if (e.key === "Backspace") {
        handleDelete();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleDelete, handleDigit, handleDot, isOpen, onClose, onConfirm, selectedAccountId, val]);

  const numericValue = Number.parseFloat(val);
  const isValid = !Number.isNaN(numericValue) && numericValue > 0;

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

  return (
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
          overflowX: "hidden",
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
              fontSize: "13px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "1px",
              color: TOKENS.colors.textMuted,
            }}
          >
            {mode === "income" ? t("tracker.addTitle") : t("tracker.keypadTitle")}
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

        {accounts && accounts.length > 1 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {accounts.map((acc) => {
              const isSel = (selectedAccountId || accounts[0]?.id) === acc.id;
              return (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => setSelectedAccountId(acc.id)}
                  style={{
                    backgroundColor: isSel ? TOKENS.colors.primary : TOKENS.colors.surfaceElevated,
                    color: isSel ? TOKENS.colors.textOnPrimary : TOKENS.colors.textSecondary,
                    border: `1px solid ${isSel ? TOKENS.colors.primary : TOKENS.colors.borderSubtle}`,
                    borderRadius: TOKENS.radii.pill,
                    padding: "3px 10px",
                    fontSize: "11px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {acc.name}
                </button>
              );
            })}
          </div>
        )}
        <div
          style={{
            backgroundColor: TOKENS.colors.surfaceElevated,
            borderRadius: TOKENS.radii.md,
            padding: `${TOKENS.spacing.md} ${TOKENS.spacing.lg}`,
            display: "flex",
            alignItems: "baseline",
            justifyContent: "flex-end",
            gap: "8px",
            border: `1px solid ${TOKENS.colors.borderSubtle}`,
          }}
        >
          <span
            style={{
              fontSize: "24px",
              fontWeight: 700,
              color: TOKENS.colors.textMuted,
            }}
          >
            {currency}
          </span>
          <span
            style={{
              fontSize: "40px",
              fontWeight: 800,
              color: TOKENS.colors.textPrimary,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {val}
          </span>
        </div>

        {predictedText && (
          <div
            style={{
              fontSize: "12px",
              fontWeight: 600,
              color: TOKENS.colors.primary,
              textAlign: "center",
              marginTop: "-4px",
            }}
          >
            {predictedText}
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: TOKENS.spacing.sm,
          }}
        >
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigit(digit)}
              style={{
                height: "54px",
                backgroundColor: TOKENS.colors.surfaceElevated,
                border: `1px solid ${TOKENS.colors.borderSubtle}`,
                borderRadius: TOKENS.radii.md,
                color: TOKENS.colors.textPrimary,
                fontSize: "22px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            onClick={handleDot}
            style={{
              height: "54px",
              backgroundColor: TOKENS.colors.surfaceElevated,
              border: `1px solid ${TOKENS.colors.borderSubtle}`,
              borderRadius: TOKENS.radii.md,
              color: TOKENS.colors.textPrimary,
              fontSize: "22px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            .
          </button>
          <button
            type="button"
            onClick={() => handleDigit("0")}
            style={{
              height: "54px",
              backgroundColor: TOKENS.colors.surfaceElevated,
              border: `1px solid ${TOKENS.colors.borderSubtle}`,
              borderRadius: TOKENS.radii.md,
              color: TOKENS.colors.textPrimary,
              fontSize: "22px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            0
          </button>
          <button
            type="button"
            onClick={handleDelete}
            aria-label={t("common.delete")}
            style={{
              height: "54px",
              backgroundColor: TOKENS.colors.surfaceElevated,
              border: `1px solid ${TOKENS.colors.borderSubtle}`,
              borderRadius: TOKENS.radii.md,
              color: TOKENS.colors.textSecondary,
              fontSize: "20px",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Delete size={22} />
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 2fr",
            gap: TOKENS.spacing.sm,
            marginTop: TOKENS.spacing.xs,
          }}
        >
          <button
            type="button"
            onClick={handleClear}
            style={{
              height: "48px",
              backgroundColor: TOKENS.colors.surfaceSubtle,
              border: `1px solid ${TOKENS.colors.borderSubtle}`,
              borderRadius: TOKENS.radii.md,
              color: TOKENS.colors.textSecondary,
              fontSize: "14px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {t("tracker.clear")}
          </button>
          <button
            type="button"
            disabled={!isValid}
            onClick={handleConfirm}
            style={{
              height: "48px",
              backgroundColor: isValid ? TOKENS.colors.primary : TOKENS.colors.surfaceElevated,
              border: "none",
              borderRadius: TOKENS.radii.md,
              color: isValid ? TOKENS.colors.textOnPrimary : TOKENS.colors.textMuted,
              fontSize: "15px",
              fontWeight: 700,
              cursor: isValid ? "pointer" : "not-allowed",
              transition: "background-color 0.1s ease",
            }}
          >
            {t("tracker.confirm")}
          </button>
        </div>
      </div>
    </div>
  );
};
