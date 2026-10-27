import type { Account, LoanRecord, LoanType } from "@ration/types";
import { ArrowDownLeft, ArrowUpRight, Check, Plus, X } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { useI18n } from "../i18n/index.js";
import { TOKENS } from "../theme/tokens.js";
import { formatCurrency } from "../utils/formatters.js";
import { RecordLoanModal } from "./RecordLoanModal.js";

interface LoansDrawerProps {
  isOpen: boolean;
  accounts: Account[];
  loans: LoanRecord[];
  currency: string;
  onClose: () => void;
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

export const LoansDrawer: React.FC<LoansDrawerProps> = ({
  isOpen,
  accounts,
  loans,
  currency,
  onClose,
  onAddLoan,
  onMarkLoanSettled,
}) => {
  const { t } = useI18n();
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);

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
                fontSize: "16px",
                fontWeight: 700,
                color: TOKENS.colors.textPrimary,
              }}
            >
              {t("planned.tabLoans")}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: TOKENS.spacing.xs }}>
              <button
                type="button"
                onClick={() => setIsRecordModalOpen(true)}
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
                <span>{t("planned.newLoan")}</span>
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
            {loans.length === 0 ? (
              <div
                style={{
                  padding: `${TOKENS.spacing.xl} 0`,
                  textAlign: "center",
                  color: TOKENS.colors.textMuted,
                  fontSize: "13px",
                }}
              >
                {t("planned.emptyLoans")}
              </div>
            ) : (
              loans.map((item) => {
                const isBorrow = item.type === "borrow";
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
                              backgroundColor: isBorrow
                                ? "rgba(255, 68, 68, 0.12)"
                                : "rgba(0, 230, 118, 0.12)",
                            }}
                          >
                            {isBorrow ? (
                              <ArrowDownLeft size={12} color={TOKENS.colors.danger} />
                            ) : (
                              <ArrowUpRight size={12} color={TOKENS.colors.success} />
                            )}
                            <span
                              style={{
                                fontSize: "10px",
                                fontWeight: 700,
                                textTransform: "uppercase",
                                color: isBorrow ? TOKENS.colors.danger : TOKENS.colors.success,
                              }}
                            >
                              {isBorrow ? t("planned.borrowLabel") : t("planned.lendLabel")}
                            </span>
                          </div>
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
                      <span
                        style={{
                          fontSize: "12px",
                          color: TOKENS.colors.textSecondary,
                        }}
                      >
                        {item.status === "settled"
                          ? t("planned.settled")
                          : isBorrow
                            ? t("planned.activeDebt")
                            : t("planned.activeReceivable")}
                      </span>

                      {item.status === "active" && (
                        <button
                          type="button"
                          onClick={() => onMarkLoanSettled(item.id)}
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
                          <span>{t("planned.markSettled")}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <RecordLoanModal
        isOpen={isRecordModalOpen}
        accounts={accounts}
        currency={currency}
        onClose={() => setIsRecordModalOpen(false)}
        onSubmit={onAddLoan}
      />
    </>
  );
};
