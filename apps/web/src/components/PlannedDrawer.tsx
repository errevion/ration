import type { Account, PlannedPayment, TransactionType } from "@ration/types";
import { ArrowDownLeft, ArrowUpRight, Check, Pencil, Plus, Trash2, X } from "lucide-react";
import type React from "react";
import { useMemo, useState } from "react";
import { useI18n } from "../i18n/index.js";
import { TOKENS } from "../theme/tokens.js";
import { formatCurrency } from "../utils/formatters.js";
import { RecordPlannedPaymentModal } from "./RecordPlannedPaymentModal.js";

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
    type: TransactionType;
    accountId?: string;
    isRecurring?: boolean;
  }) => void;
  onEditPlannedPayment: (
    id: string,
    payment: {
      name: string;
      amount: number;
      dueDate: string;
      type: TransactionType;
      accountId?: string;
      isRecurring?: boolean;
    }
  ) => void;
  onDeletePlannedPayment: (id: string) => void;
  onMarkPaymentPaid: (paymentId: string) => void;
}

export const PlannedDrawer: React.FC<PlannedDrawerProps> = ({
  isOpen,
  accounts,
  plannedPayments,
  currency,
  onClose,
  onAddPlannedPayment,
  onEditPlannedPayment,
  onDeletePlannedPayment,
  onMarkPaymentPaid,
}) => {
  const { t } = useI18n();
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PlannedPayment | null>(null);

  const activePayments = useMemo(
    () =>
      plannedPayments
        .filter((p) => p.status === "pending")
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    [plannedPayments]
  );
  const settledPayments = useMemo(
    () =>
      plannedPayments
        .filter((p) => p.status !== "pending")
        .sort((a, b) => (b.createdAt || b.dueDate).localeCompare(a.createdAt || a.dueDate)),
    [plannedPayments]
  );

  function handleOpenCreate() {
    setEditingPayment(null);
    setIsRecordModalOpen(true);
  }

  function handleOpenEdit(payment: PlannedPayment) {
    setEditingPayment(payment);
    setIsRecordModalOpen(true);
  }

  function handleFormSubmit(
    paymentData: {
      name: string;
      amount: number;
      dueDate: string;
      type: TransactionType;
      accountId?: string;
      isRecurring?: boolean;
    },
    paymentIdToUpdate?: string
  ) {
    if (paymentIdToUpdate) {
      onEditPlannedPayment(paymentIdToUpdate, paymentData);
    } else {
      onAddPlannedPayment(paymentData);
    }
    setIsRecordModalOpen(false);
    setEditingPayment(null);
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
            height: "75vh",
            maxHeight: "75vh",
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
                fontSize: "16px",
                fontWeight: 700,
                color: TOKENS.colors.textPrimary,
              }}
            >
              {t("planned.tabPlanned")}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: TOKENS.spacing.xs }}>
              <button
                type="button"
                onClick={handleOpenCreate}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  backgroundColor: TOKENS.colors.primary,
                  border: "none",
                  padding: `6px ${TOKENS.spacing.sm}`,
                  borderRadius: TOKENS.radii.pill,
                  color: TOKENS.colors.textOnPrimary,
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                <Plus size={14} />
                <span>{t("planned.newPlanned")}</span>
              </button>

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
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: TOKENS.spacing.sm,
              paddingBottom: TOKENS.spacing.lg,
            }}
          >
            {plannedPayments.length === 0 ? (
              <div
                style={{
                  padding: `${TOKENS.spacing.xl} 0`,
                  textAlign: "center",
                  color: TOKENS.colors.textMuted,
                  fontSize: "13px",
                }}
              >
                {t("planned.emptyPlanned")}
              </div>
            ) : (
              <>
                {activePayments.map((item) => {
                  const isIncome = (item.type ?? "spend") === "income";
                  return (
                    <div
                      key={item.id}
                      style={{
                        backgroundColor: TOKENS.colors.surfaceElevated,
                        border: `1px solid ${TOKENS.colors.borderSubtle}`,
                        borderRadius: TOKENS.radii.md,
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
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "4px",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                padding: "2px 6px",
                                borderRadius: TOKENS.radii.pill,
                                backgroundColor: isIncome
                                  ? "rgba(0, 230, 118, 0.12)"
                                  : "rgba(255, 68, 68, 0.12)",
                              }}
                            >
                              {isIncome ? (
                                <ArrowUpRight size={12} color={TOKENS.colors.success} />
                              ) : (
                                <ArrowDownLeft size={12} color={TOKENS.colors.danger} />
                              )}
                              <span
                                style={{
                                  fontSize: "10px",
                                  fontWeight: 700,
                                  textTransform: "uppercase",
                                  color: isIncome ? TOKENS.colors.success : TOKENS.colors.danger,
                                }}
                              >
                                {isIncome ? t("planned.incomeLabel") : t("planned.billLabel")}
                              </span>
                            </div>
                            {item.isRecurring && (
                              <span
                                style={{
                                  padding: "1px 5px",
                                  borderRadius: "4px",
                                  backgroundColor: TOKENS.colors.surfaceSubtle,
                                  border: `1px solid ${TOKENS.colors.borderSubtle}`,
                                  fontSize: "9px",
                                  fontWeight: 700,
                                  color: TOKENS.colors.primary,
                                }}
                              >
                                {item.recurrenceFrequency === "weekly" ? "W" : "R"}
                              </span>
                            )}
                            <span
                              style={{
                                fontSize: "14px",
                                fontWeight: 700,
                                color: TOKENS.colors.textPrimary,
                              }}
                            >
                              {item.name}
                            </span>
                          </div>
                          <span
                            style={{
                              fontSize: "12px",
                              color: TOKENS.colors.textSecondary,
                            }}
                          >
                            {item.dueDate}
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: "14px",
                            fontWeight: 700,
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
                        <div
                          style={{ display: "flex", alignItems: "center", gap: TOKENS.spacing.sm }}
                        >
                          <span
                            style={{
                              fontSize: "12px",
                              color: TOKENS.colors.textSecondary,
                            }}
                          >
                            {isIncome ? t("planned.typeIncome") : t("planned.activeDebt")}
                          </span>

                          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(item)}
                              style={{
                                padding: "4px",
                                border: "none",
                                borderRadius: TOKENS.radii.sm,
                                backgroundColor: TOKENS.colors.surfaceSubtle,
                                color: TOKENS.colors.textSecondary,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                              }}
                            >
                              <Pencil size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeletePlannedPayment(item.id)}
                              style={{
                                padding: "4px",
                                border: "none",
                                borderRadius: TOKENS.radii.sm,
                                backgroundColor: TOKENS.colors.surfaceSubtle,
                                color: TOKENS.colors.danger,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                              }}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => onMarkPaymentPaid(item.id)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "4px 8px",
                            borderRadius: TOKENS.radii.sm,
                            border: "none",
                            backgroundColor: TOKENS.colors.surfaceSubtle,
                            color: TOKENS.colors.primary,
                            fontSize: "12px",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          <Check size={14} />
                          <span>
                            {isIncome ? t("planned.markReceived") : t("planned.markPaid")}
                          </span>
                        </button>
                      </div>
                    </div>
                  );
                })}

                {settledPayments.length > 0 && (
                  <>
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        color: TOKENS.colors.textMuted,
                        marginTop: TOKENS.spacing.sm,
                        marginBottom: "4px",
                      }}
                    >
                      {t("planned.history")}
                    </div>
                    {settledPayments.map((item) => {
                      const isIncome = (item.type ?? "spend") === "income";
                      return (
                        <div
                          key={item.id}
                          style={{
                            backgroundColor: TOKENS.colors.surfaceElevated,
                            border: `1px solid ${TOKENS.colors.borderSubtle}`,
                            borderRadius: TOKENS.radii.md,
                            padding: TOKENS.spacing.md,
                            display: "flex",
                            flexDirection: "column",
                            gap: TOKENS.spacing.sm,
                            opacity: 0.6,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "4px",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "6px",
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                    padding: "2px 6px",
                                    borderRadius: TOKENS.radii.pill,
                                    backgroundColor: isIncome
                                      ? "rgba(0, 230, 118, 0.12)"
                                      : "rgba(255, 68, 68, 0.12)",
                                  }}
                                >
                                  {isIncome ? (
                                    <ArrowUpRight size={12} color={TOKENS.colors.success} />
                                  ) : (
                                    <ArrowDownLeft size={12} color={TOKENS.colors.danger} />
                                  )}
                                  <span
                                    style={{
                                      fontSize: "10px",
                                      fontWeight: 700,
                                      textTransform: "uppercase",
                                      color: isIncome
                                        ? TOKENS.colors.success
                                        : TOKENS.colors.danger,
                                    }}
                                  >
                                    {isIncome ? t("planned.incomeLabel") : t("planned.billLabel")}
                                  </span>
                                </div>
                                {item.isRecurring && (
                                  <span
                                    style={{
                                      padding: "1px 5px",
                                      borderRadius: "4px",
                                      backgroundColor: TOKENS.colors.surfaceSubtle,
                                      border: `1px solid ${TOKENS.colors.borderSubtle}`,
                                      fontSize: "9px",
                                      fontWeight: 700,
                                      color: TOKENS.colors.primary,
                                    }}
                                  >
                                    {item.recurrenceFrequency === "weekly" ? "W" : "R"}
                                  </span>
                                )}
                                <span
                                  style={{
                                    fontSize: "14px",
                                    fontWeight: 700,
                                    color: TOKENS.colors.textPrimary,
                                  }}
                                >
                                  {item.name}
                                </span>
                              </div>
                              <span
                                style={{
                                  fontSize: "12px",
                                  color: TOKENS.colors.textSecondary,
                                }}
                              >
                                {item.dueDate}
                              </span>
                            </div>
                            <span
                              style={{
                                fontSize: "14px",
                                fontWeight: 700,
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
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: TOKENS.spacing.sm,
                              }}
                            >
                              <span
                                style={{
                                  fontSize: "12px",
                                  color: TOKENS.colors.textSecondary,
                                }}
                              >
                                {isIncome ? t("planned.received") : t("planned.paid")}
                              </span>

                              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                <button
                                  type="button"
                                  onClick={() => onDeletePlannedPayment(item.id)}
                                  style={{
                                    padding: "4px",
                                    border: "none",
                                    borderRadius: TOKENS.radii.sm,
                                    backgroundColor: TOKENS.colors.surfaceSubtle,
                                    color: TOKENS.colors.danger,
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                  }}
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <RecordPlannedPaymentModal
        isOpen={isRecordModalOpen}
        accounts={accounts}
        currency={currency}
        initialPayment={editingPayment}
        onClose={() => {
          setIsRecordModalOpen(false);
          setEditingPayment(null);
        }}
        onSubmit={handleFormSubmit}
      />
    </>
  );
};
