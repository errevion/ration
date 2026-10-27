import type { Account, LoanRecord, LoanType, PlannedPayment } from "@ration/types";
import { ArrowDownLeft, ArrowUpRight, Check, Plus, X } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { useI18n } from "../i18n/index.js";
import { TOKENS } from "../theme/tokens.js";
import { formatIsoDate } from "../utils/budgetEngine.js";
import { formatCurrency } from "../utils/formatters.js";

interface CommitmentsDrawerProps {
  isOpen: boolean;
  accounts: Account[];
  plannedPayments: PlannedPayment[];
  loans: LoanRecord[];
  currency: string;
  onClose: () => void;
  onAddPlannedPayment: (payment: {
    name: string;
    amount: number;
    dueDate: string;
    accountId?: string;
  }) => void;
  onMarkPaymentPaid: (paymentId: string) => void;
  onAddLoan: (loan: {
    counterparty: string;
    type: LoanType;
    amount: number;
    dueDate: string;
    accountId?: string;
    notes?: string;
  }) => void;
  onMarkLoanSettled: (loanId: string) => void;
}

export const CommitmentsDrawer: React.FC<CommitmentsDrawerProps> = ({
  isOpen,
  accounts,
  plannedPayments,
  loans,
  currency,
  onClose,
  onAddPlannedPayment,
  onMarkPaymentPaid,
  onAddLoan,
  onMarkLoanSettled,
}) => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<"planned" | "loans">("planned");

  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [paymentName, setPaymentName] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDueDate, setPaymentDueDate] = useState(() => formatIsoDate(new Date()));
  const [paymentAccountId, setPaymentAccountId] = useState<string | undefined>(
    () => accounts.find((a) => a.isPrimary)?.id || accounts[0]?.id
  );

  const [isAddingLoan, setIsAddingLoan] = useState(false);
  const [loanCounterparty, setLoanCounterparty] = useState("");
  const [loanType, setLoanType] = useState<LoanType>("borrow");
  const [loanAmount, setLoanAmount] = useState("");
  const [loanDueDate, setLoanDueDate] = useState(() => formatIsoDate(new Date()));
  const [loanAccountId, setLoanAccountId] = useState<string | undefined>(
    () => accounts.find((a) => a.isPrimary)?.id || accounts[0]?.id
  );
  const [loanNotes, setLoanNotes] = useState("");

  function handleCreatePayment() {
    const amt = Number.parseFloat(paymentAmount);
    if (!paymentName.trim() || !amt || amt <= 0) return;
    onAddPlannedPayment({
      name: paymentName.trim(),
      amount: amt,
      dueDate: paymentDueDate,
      accountId: paymentAccountId,
    });
    setPaymentName("");
    setPaymentAmount("");
    setIsAddingPayment(false);
  }

  function handleCreateLoan() {
    const amt = Number.parseFloat(loanAmount);
    if (!loanCounterparty.trim() || !amt || amt <= 0) return;
    onAddLoan({
      counterparty: loanCounterparty.trim(),
      type: loanType,
      amount: amt,
      dueDate: loanDueDate,
      accountId: loanAccountId,
      notes: loanNotes.trim() || undefined,
    });
    setLoanCounterparty("");
    setLoanAmount("");
    setLoanNotes("");
    setIsAddingLoan(false);
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
            {t("commitments.title")}
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
            onClick={() => setActiveTab("planned")}
            style={{
              flex: 1,
              padding: `${TOKENS.spacing.xs} 0`,
              borderRadius: TOKENS.radii.pill,
              border: "none",
              backgroundColor: activeTab === "planned" ? TOKENS.colors.primary : "transparent",
              color:
                activeTab === "planned" ? TOKENS.colors.textOnPrimary : TOKENS.colors.textSecondary,
              fontWeight: 700,
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            {t("commitments.tabPlanned")}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("loans")}
            style={{
              flex: 1,
              padding: `${TOKENS.spacing.xs} 0`,
              borderRadius: TOKENS.radii.pill,
              border: "none",
              backgroundColor: activeTab === "loans" ? TOKENS.colors.primary : "transparent",
              color:
                activeTab === "loans" ? TOKENS.colors.textOnPrimary : TOKENS.colors.textSecondary,
              fontWeight: 700,
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            {t("commitments.tabLoans")}
          </button>
        </div>
        {activeTab === "planned" ? (
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
                {t("commitments.emptyPlanned")}
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
                      {item.status === "completed"
                        ? t("commitments.paid")
                        : t("commitments.activeDebt")}
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
                        <span>{t("commitments.markPaid")}</span>
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
                <span
                  style={{ fontSize: "14px", fontWeight: 700, color: TOKENS.colors.textPrimary }}
                >
                  {t("commitments.newPayment")}
                </span>
                <input
                  type="text"
                  value={paymentName}
                  onChange={(e) => setPaymentName(e.target.value)}
                  placeholder={t("commitments.namePlaceholder")}
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
                  placeholder={t("commitments.amount")}
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
                  type="text"
                  value={paymentDueDate}
                  onChange={(e) => setPaymentDueDate(e.target.value)}
                  placeholder={t("settings.datePlaceholder")}
                  maxLength={10}
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
                <span>{t("commitments.newPayment")}</span>
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: TOKENS.spacing.sm }}>
            {loans.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  color: TOKENS.colors.textMuted,
                  padding: "16px 0",
                  fontSize: "13px",
                }}
              >
                {t("commitments.emptyLoans")}
              </div>
            ) : (
              loans.map((item) => {
                const isBorrow = item.type === "borrow";
                return (
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
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "2px",
                              backgroundColor: isBorrow
                                ? TOKENS.colors.dangerMuted
                                : TOKENS.colors.successMuted,
                              color: isBorrow ? TOKENS.colors.danger : TOKENS.colors.success,
                              borderRadius: TOKENS.radii.pill,
                              padding: "2px 6px",
                              fontSize: "10px",
                              fontWeight: 700,
                              textTransform: "uppercase",
                            }}
                          >
                            {isBorrow ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
                            {isBorrow ? t("commitments.borrowLabel") : t("commitments.lendLabel")}
                          </span>
                          <span
                            style={{
                              fontSize: "14px",
                              fontWeight: 700,
                              color: TOKENS.colors.textPrimary,
                            }}
                          >
                            {item.counterparty}
                          </span>
                        </div>
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
                      <span style={{ fontSize: "12px", color: TOKENS.colors.textMuted }}>
                        {item.status === "settled"
                          ? t("commitments.settled")
                          : isBorrow
                            ? t("commitments.activeDebt")
                            : t("commitments.activeReceivable")}
                      </span>

                      {item.status === "active" && (
                        <button
                          type="button"
                          onClick={() => onMarkLoanSettled(item.id)}
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
                          <span>{t("commitments.markSettled")}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            {isAddingLoan ? (
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
                <span
                  style={{ fontSize: "14px", fontWeight: 700, color: TOKENS.colors.textPrimary }}
                >
                  {t("commitments.newLoan")}
                </span>

                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={() => setLoanType("borrow")}
                    style={{
                      flex: 1,
                      height: "38px",
                      borderRadius: TOKENS.radii.md,
                      backgroundColor:
                        loanType === "borrow" ? TOKENS.colors.primary : TOKENS.colors.surface,
                      border: `1px solid ${loanType === "borrow" ? TOKENS.colors.primary : TOKENS.colors.borderSubtle}`,
                      color:
                        loanType === "borrow"
                          ? TOKENS.colors.textOnPrimary
                          : TOKENS.colors.textSecondary,
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {t("commitments.borrow")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoanType("lend")}
                    style={{
                      flex: 1,
                      height: "38px",
                      borderRadius: TOKENS.radii.md,
                      backgroundColor:
                        loanType === "lend" ? TOKENS.colors.primary : TOKENS.colors.surface,
                      border: `1px solid ${loanType === "lend" ? TOKENS.colors.primary : TOKENS.colors.borderSubtle}`,
                      color:
                        loanType === "lend"
                          ? TOKENS.colors.textOnPrimary
                          : TOKENS.colors.textSecondary,
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {t("commitments.lend")}
                  </button>
                </div>

                <input
                  type="text"
                  value={loanCounterparty}
                  onChange={(e) => setLoanCounterparty(e.target.value)}
                  placeholder={t("commitments.counterpartyPlaceholder")}
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
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(e.target.value)}
                  placeholder={t("commitments.amount")}
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
                  type="text"
                  value={loanDueDate}
                  onChange={(e) => setLoanDueDate(e.target.value)}
                  placeholder={t("settings.datePlaceholder")}
                  maxLength={10}
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
                  type="text"
                  value={loanNotes}
                  onChange={(e) => setLoanNotes(e.target.value)}
                  placeholder={t("commitments.notesPlaceholder")}
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

                {accounts.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <span
                      style={{ fontSize: "11px", fontWeight: 600, color: TOKENS.colors.textMuted }}
                    >
                      {loanType === "borrow"
                        ? t("commitments.depositAccount")
                        : t("commitments.deductAccount")}
                    </span>
                    <select
                      value={loanAccountId}
                      onChange={(e) => setLoanAccountId(e.target.value)}
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
                    onClick={() => setIsAddingLoan(false)}
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
                    onClick={handleCreateLoan}
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
                onClick={() => setIsAddingLoan(true)}
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
                <span>{t("commitments.newLoan")}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
