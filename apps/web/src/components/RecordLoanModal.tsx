import type { Account, LoanRecord, LoanType } from "@ration/types";
import { Calendar, X } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { useI18n } from "../i18n/index.js";
import { TOKENS } from "../theme/tokens.js";
import { formatIsoDate } from "../utils/budgetEngine.js";
import { CalendarDatePicker } from "./CalendarDatePicker.js";

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
    }
  }, [isOpen, accounts, initialLoan]);

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
    onClose();
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
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1100,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          transition: "opacity 0.25s ease-out",
          overflow: "hidden",
          padding: TOKENS.spacing.md,
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "420px",
            backgroundColor: TOKENS.colors.surface,
            border: `1px solid ${TOKENS.colors.border}`,
            borderRadius: TOKENS.radii.card,
            padding: TOKENS.spacing.lg,
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            gap: TOKENS.spacing.md,
            maxHeight: "90vh",
            overflowY: "auto",
            scrollbarWidth: "none",
            transform: isOpen ? "scale(1)" : "scale(0.95)",
            transition: "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
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
              {initialLoan ? t("planned.editLoan") : t("planned.newLoan")}
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

          <div style={{ display: "flex", gap: TOKENS.spacing.xs }}>
            <button
              type="button"
              onClick={() => setLoanType("borrow")}
              style={{
                flex: 1,
                padding: `${TOKENS.spacing.sm} 0`,
                backgroundColor:
                  loanType === "borrow" ? TOKENS.colors.primary : TOKENS.colors.surfaceElevated,
                border: `1px solid ${loanType === "borrow" ? TOKENS.colors.primary : TOKENS.colors.borderSubtle}`,
                borderRadius: TOKENS.radii.md,
                color:
                  loanType === "borrow" ? TOKENS.colors.textOnPrimary : TOKENS.colors.textSecondary,
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {t("planned.borrow")}
            </button>
            <button
              type="button"
              onClick={() => setLoanType("lend")}
              style={{
                flex: 1,
                padding: `${TOKENS.spacing.sm} 0`,
                backgroundColor:
                  loanType === "lend" ? TOKENS.colors.primary : TOKENS.colors.surfaceElevated,
                border: `1px solid ${loanType === "lend" ? TOKENS.colors.primary : TOKENS.colors.borderSubtle}`,
                borderRadius: TOKENS.radii.md,
                color:
                  loanType === "lend" ? TOKENS.colors.textOnPrimary : TOKENS.colors.textSecondary,
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {t("planned.lend")}
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: TOKENS.colors.textMuted,
              }}
            >
              {t("planned.counterparty")}
            </span>
            <input
              type="text"
              value={counterparty}
              onChange={(e) => setCounterparty(e.target.value)}
              placeholder={t("planned.counterpartyPlaceholder")}
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

          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: TOKENS.colors.textMuted,
              }}
            >
              {t("planned.amount")} ({currency.trim()})
            </span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={t("keypad.zero")}
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

          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: TOKENS.colors.textMuted,
              }}
            >
              {t("planned.dueDate")}
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
              <span>{dueDate}</span>
              <Calendar size={16} color={TOKENS.colors.textMuted} />
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: TOKENS.colors.textMuted,
              }}
            >
              {t("planned.notes")}
            </span>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("planned.notesPlaceholder")}
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

          {accounts.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: TOKENS.colors.textMuted,
                }}
              >
                {loanType === "borrow" ? t("planned.depositAccount") : t("planned.deductAccount")}
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: TOKENS.spacing.xs }}>
                {accounts.map((acc) => {
                  const isSelected = (accountId || accounts[0]?.id) === acc.id;
                  return (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => setAccountId(acc.id)}
                      style={{
                        padding: `${TOKENS.spacing.xs} ${TOKENS.spacing.md}`,
                        borderRadius: TOKENS.radii.pill,
                        border: `1px solid ${isSelected ? TOKENS.colors.primary : TOKENS.colors.borderSubtle}`,
                        backgroundColor: isSelected
                          ? TOKENS.colors.primary
                          : TOKENS.colors.surfaceElevated,
                        color: isSelected
                          ? TOKENS.colors.textOnPrimary
                          : TOKENS.colors.textSecondary,
                        fontSize: "12px",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      {acc.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: TOKENS.spacing.sm, marginTop: TOKENS.spacing.xs }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                height: "46px",
                backgroundColor: TOKENS.colors.surfaceElevated,
                border: "none",
                borderRadius: TOKENS.radii.md,
                color: TOKENS.colors.textSecondary,
                fontSize: "14px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {t("tracker.cancel")}
            </button>
            <button
              type="button"
              disabled={!isValid}
              onClick={handleSubmit}
              style={{
                flex: 2,
                height: "46px",
                backgroundColor: isValid ? TOKENS.colors.primary : TOKENS.colors.surfaceElevated,
                border: "none",
                borderRadius: TOKENS.radii.md,
                color: isValid ? TOKENS.colors.textOnPrimary : TOKENS.colors.textMuted,
                fontSize: "14px",
                fontWeight: 700,
                cursor: isValid ? "pointer" : "not-allowed",
                transition: "all 0.15s ease",
              }}
            >
              {t("planned.saveLoan")}
            </button>
          </div>
        </div>
      </div>

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
