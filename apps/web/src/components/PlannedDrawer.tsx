import type { Account, PlannedPayment } from "@ration/types";
import { Calendar, Check, Plus, X } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { useI18n } from "../i18n/index.js";
import { TOKENS } from "../theme/tokens.js";
import { formatIsoDate } from "../utils/budgetEngine.js";
import { formatCurrency } from "../utils/formatters.js";
import { CalendarDatePicker } from "./CalendarDatePicker.js";

interface PlannedDrawerProps {
  isOpen: boolean;
  accounts: Account[];
  plannedPayments: PlannedPayment[];
  currency: string;
  onClose: () => void;
  onAddPlannedPayment: (payment: {
    name: string;
    amount: number;
    dueDate: string;
    type: "spend" | "income";
    accountId?: string;
  }) => void;
  onMarkPaymentPaid: (paymentId: string) => void;
}

export const PlannedDrawer: React.FC<PlannedDrawerProps> = ({
  isOpen,
  accounts,
  plannedPayments,
  currency,
  onClose,
  onAddPlannedPayment,
  onMarkPaymentPaid,
}) => {
  const { t } = useI18n();
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [paymentName, setPaymentName] = useState("");
  const [paymentType, setPaymentType] = useState<"spend" | "income">("spend");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDueDate, setPaymentDueDate] = useState(() => formatIsoDate(new Date()));
  const [paymentAccountId, setPaymentAccountId] = useState<string | undefined>(
    () => accounts.find((a) => a.isPrimary)?.id || accounts[0]?.id
  );
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  function handleCreatePayment() {
    const amt = Number.parseFloat(paymentAmount);
    if (!paymentName.trim() || !amt || amt <= 0) return;
    onAddPlannedPayment({
      name: paymentName.trim(),
      amount: amt,
      dueDate: paymentDueDate,
      type: paymentType,
      accountId: paymentAccountId,
    });
    setPaymentName("");
    setPaymentAmount("");
    setPaymentType("spend");
    setIsAddingPayment(false);
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
          maxHeight: "85vh",
          overflowY: "auto",
          overflowX: "hidden",
          scrollbarWidth: "none",
          transform: isOpen ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "16px", fontWeight: 700, color: TOKENS.colors.textPrimary }}>
            {t("planned.tabPlanned")}
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

        <div style={{ display: "flex", flexDirection: "column", gap: TOKENS.spacing.sm }}>
          {plannedPayments.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                color: TOKENS.colors.textMuted,
                padding: "16px 0",
                fontSize: "13px",
              }}
            >
              {t("planned.emptyPlanned")}
            </div>
          ) : (
            plannedPayments.map((item) => (
              <div
                key={item.id}
                style={{
                  backgroundColor: TOKENS.colors.surfaceElevated,
                  borderRadius: TOKENS.radii.md,
                  border: `1px solid ${TOKENS.colors.borderSubtle}`,
                  padding: TOKENS.spacing.md,
                  display: "flex",
                  flexDirection: "column",
                  gap: TOKENS.spacing.sm,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: 700,
                        color: TOKENS.colors.textPrimary,
                      }}
                    >
                      {item.name}
                    </span>
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: 600,
                        color: TOKENS.colors.textMuted,
                      }}
                    >
                      {item.dueDate}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: "15px",
                      fontWeight: 800,
                      color: TOKENS.colors.textPrimary,
                    }}
                  >
                    {formatCurrency(item.amount, currency)}
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderTop: `1px solid ${TOKENS.colors.borderSubtle}`,
                    paddingTop: TOKENS.spacing.xs,
                  }}
                >
                  <span
                    style={{
                      backgroundColor:
                        item.status === "completed"
                          ? TOKENS.colors.successMuted
                          : TOKENS.colors.surfaceSubtle,
                      color:
                        item.status === "completed"
                          ? TOKENS.colors.success
                          : TOKENS.colors.textSecondary,
                      borderRadius: TOKENS.radii.pill,
                      padding: "2px 8px",
                      fontSize: "10px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                    }}
                  >
                    {item.status === "completed" ? t("planned.paid") : t("planned.activeDebt")}
                  </span>

                  {item.status === "pending" && (
                    <button
                      type="button"
                      onClick={() => onMarkPaymentPaid(item.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        background: "transparent",
                        border: "none",
                        color: TOKENS.colors.primary,
                        fontSize: "12px",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      <Check size={14} />
                      <span>
                        {item.type === "income" ? t("planned.markReceived") : t("planned.markPaid")}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
          {isAddingPayment ? (
            <div
              style={{
                backgroundColor: TOKENS.colors.surfaceElevated,
                borderRadius: TOKENS.radii.md,
                border: `1px solid ${TOKENS.colors.borderSubtle}`,
                padding: TOKENS.spacing.md,
                display: "flex",
                flexDirection: "column",
                gap: TOKENS.spacing.sm,
              }}
            >
              <span style={{ fontSize: "14px", fontWeight: 700, color: TOKENS.colors.textPrimary }}>
                {t("planned.newPayment")}
              </span>
              <input
                type="text"
                value={paymentName}
                onChange={(e) => setPaymentName(e.target.value)}
                placeholder={t("planned.namePlaceholder")}
                style={{
                  height: "40px",
                  backgroundColor: TOKENS.colors.surface,
                  border: `1px solid ${TOKENS.colors.borderSubtle}`,
                  borderRadius: TOKENS.radii.md,
                  padding: `0 ${TOKENS.spacing.md}`,
                  color: TOKENS.colors.textPrimary,
                  fontSize: "14px",
                  fontWeight: 600,
                  boxSizing: "border-box",
                }}
              />
              <input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder={t("planned.amount")}
                style={{
                  height: "40px",
                  backgroundColor: TOKENS.colors.surface,
                  border: `1px solid ${TOKENS.colors.borderSubtle}`,
                  borderRadius: TOKENS.radii.md,
                  padding: `0 ${TOKENS.spacing.md}`,
                  color: TOKENS.colors.textPrimary,
                  fontSize: "14px",
                  fontWeight: 600,
                  boxSizing: "border-box",
                }}
              />
              <button
                type="button"
                onClick={() => setIsDatePickerOpen(true)}
                style={{
                  height: "40px",
                  backgroundColor: TOKENS.colors.surface,
                  border: `1px solid ${TOKENS.colors.borderSubtle}`,
                  borderRadius: TOKENS.radii.md,
                  padding: `0 ${TOKENS.spacing.md}`,
                  color: TOKENS.colors.textPrimary,
                  fontSize: "14px",
                  fontWeight: 600,
                  boxSizing: "border-box",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: "pointer",
                }}
              >
                <span>{paymentDueDate}</span>
                <Calendar size={16} color={TOKENS.colors.textMuted} />
              </button>
              {accounts.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <span
                    style={{ fontSize: "11px", fontWeight: 600, color: TOKENS.colors.textMuted }}
                  >
                    {t("accounts.selectAccount")}
                  </span>
                  <select
                    value={paymentAccountId}
                    onChange={(e) => setPaymentAccountId(e.target.value)}
                    style={{
                      height: "40px",
                      backgroundColor: TOKENS.colors.surface,
                      border: `1px solid ${TOKENS.colors.borderSubtle}`,
                      borderRadius: TOKENS.radii.md,
                      padding: `0 ${TOKENS.spacing.md}`,
                      color: TOKENS.colors.textPrimary,
                      fontSize: "14px",
                    }}
                  >
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div
                style={{ display: "flex", gap: TOKENS.spacing.sm, marginTop: TOKENS.spacing.xs }}
              >
                <button
                  type="button"
                  onClick={() => setIsAddingPayment(false)}
                  style={{
                    flex: 1,
                    height: "40px",
                    backgroundColor: TOKENS.colors.surfaceSubtle,
                    borderRadius: TOKENS.radii.md,
                    border: "none",
                    color: TOKENS.colors.textSecondary,
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="button"
                  onClick={handleCreatePayment}
                  style={{
                    flex: 2,
                    height: "40px",
                    backgroundColor: TOKENS.colors.primary,
                    borderRadius: TOKENS.radii.md,
                    border: "none",
                    color: TOKENS.colors.textOnPrimary,
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {t("common.confirm")}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsAddingPayment(true)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                backgroundColor: TOKENS.colors.surfaceElevated,
                border: `1px solid ${TOKENS.colors.borderSubtle}`,
                borderRadius: TOKENS.radii.md,
                padding: `${TOKENS.spacing.md} 0`,
                color: TOKENS.colors.textPrimary,
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              <Plus size={16} />
              <span>{t("planned.newPayment")}</span>
            </button>
          )}
        </div>
      </div>
      <CalendarDatePicker
        isOpen={isDatePickerOpen}
        title={t("planned.dueDate")}
        selectedDate={paymentDueDate}
        onSelectDate={(date) => {
          setPaymentDueDate(date);
          setIsDatePickerOpen(false);
        }}
        onClose={() => setIsDatePickerOpen(false)}
      />
    </div>
  );
};
