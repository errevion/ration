import type { Account, PlannedPayment, TransactionType } from "@ration/types";
import { Calendar, X } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { useI18n } from "../i18n/index.js";
import { TOKENS } from "../theme/tokens.js";
import { formatIsoDate } from "../utils/budgetEngine.js";
import { CalendarDatePicker } from "./CalendarDatePicker.js";

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
    }
  }, [isOpen, accounts, initialPayment]);

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
              {initialPayment ? t("planned.editPlanned") : t("planned.newPlanned")}
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
              onClick={() => setType("spend")}
              style={{
                flex: 1,
                padding: `${TOKENS.spacing.sm} 0`,
                backgroundColor:
                  type === "spend" ? TOKENS.colors.primary : TOKENS.colors.surfaceElevated,
                border: `1px solid ${type === "spend" ? TOKENS.colors.primary : TOKENS.colors.borderSubtle}`,
                borderRadius: TOKENS.radii.md,
                color: type === "spend" ? TOKENS.colors.textOnPrimary : TOKENS.colors.textSecondary,
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {t("planned.typeBill")}
            </button>
            <button
              type="button"
              onClick={() => setType("income")}
              style={{
                flex: 1,
                padding: `${TOKENS.spacing.sm} 0`,
                backgroundColor:
                  type === "income" ? TOKENS.colors.primary : TOKENS.colors.surfaceElevated,
                border: `1px solid ${type === "income" ? TOKENS.colors.primary : TOKENS.colors.borderSubtle}`,
                borderRadius: TOKENS.radii.md,
                color:
                  type === "income" ? TOKENS.colors.textOnPrimary : TOKENS.colors.textSecondary,
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {t("planned.typeIncome")}
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
              {t("planned.plannedName")}
            </span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("planned.namePlaceholder")}
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
            <button
              type="button"
              onClick={() => setIsRecurring((prev) => !prev)}
              style={{
                height: "44px",
                backgroundColor: TOKENS.colors.surfaceElevated,
                border: `1px solid ${isRecurring ? TOKENS.colors.primary : TOKENS.colors.borderSubtle}`,
                borderRadius: TOKENS.radii.md,
                padding: `0 ${TOKENS.spacing.md}`,
                display: "flex",
                alignItems: "center",
                gap: "10px",
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  width: "18px",
                  height: "18px",
                  borderRadius: "4px",
                  border: `2px solid ${isRecurring ? TOKENS.colors.primary : TOKENS.colors.textMuted}`,
                  backgroundColor: isRecurring ? TOKENS.colors.primary : "transparent",
                  boxSizing: "border-box",
                }}
              />
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: isRecurring ? TOKENS.colors.textPrimary : TOKENS.colors.textSecondary,
                }}
              >
                {t("planned.recurringMonthly")}
              </span>
            </button>
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
                {type === "income" ? t("planned.depositAccount") : t("planned.deductAccount")}
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
              {t("planned.savePlanned")}
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
