import type { Account, AccountType } from "@ration/types";
import { Plus, Star, X } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { useI18n } from "../i18n/index.js";
import { TOKENS } from "../theme/tokens.js";
import { formatCurrency } from "../utils/formatters.js";

interface AccountsDrawerProps {
  isOpen: boolean;
  accounts: Account[];
  currency: string;
  onClose: () => void;
  onAddAccount: (account: {
    name: string;
    type: AccountType;
    balance: number;
    includeInCalendar: boolean;
    isPrimary: boolean;
  }) => void;
  onToggleInclude: (accountId: string) => void;
  onSetPrimary: (accountId: string) => void;
}

const ACCOUNT_TYPES: AccountType[] = ["bank", "cash", "wallet", "savings", "other"];

export const AccountsDrawer: React.FC<AccountsDrawerProps> = ({
  isOpen,
  accounts,
  currency,
  onClose,
  onAddAccount,
  onToggleInclude,
  onSetPrimary,
}) => {
  const { t } = useI18n();
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("bank");
  const [balanceStr, setBalanceStr] = useState("0");
  const [includeInCalendar, setIncludeInCalendar] = useState(true);

  function handleCreateAccount() {
    if (!name.trim()) return;
    const parsedBalance = Number.parseFloat(balanceStr) || 0;
    onAddAccount({
      name: name.trim(),
      type,
      balance: parsedBalance,
      includeInCalendar,
      isPrimary: accounts.length === 0,
    });
    setName("");
    setBalanceStr("0");
    setIsAdding(false);
  }

  function getTypeLabel(accType: AccountType): string {
    switch (accType) {
      case "bank":
        return t("accounts.typeBank");
      case "cash":
        return t("accounts.typeCash");
      case "wallet":
        return t("accounts.typeWallet");
      case "savings":
        return t("accounts.typeSavings");
      default:
        return t("accounts.typeOther");
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
            {t("accounts.title")}
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
          {accounts.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                color: TOKENS.colors.textMuted,
                padding: "16px 0",
                fontSize: "13px",
              }}
            >
              {t("accounts.noAccounts")}
            </div>
          ) : (
            accounts.map((acc) => (
              <div
                key={acc.id}
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
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <span
                      style={{
                        fontSize: "15px",
                        fontWeight: 700,
                        color: TOKENS.colors.textPrimary,
                      }}
                    >
                      {acc.name}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span
                        style={{
                          backgroundColor: TOKENS.colors.surfaceSubtle,
                          borderRadius: TOKENS.radii.pill,
                          padding: "2px 8px",
                          fontSize: "10px",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          color: TOKENS.colors.textSecondary,
                        }}
                      >
                        {getTypeLabel(acc.type)}
                      </span>
                      {acc.isPrimary && (
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "3px",
                            backgroundColor: TOKENS.colors.primary,
                            color: TOKENS.colors.textOnPrimary,
                            borderRadius: TOKENS.radii.pill,
                            padding: "2px 7px",
                            fontSize: "10px",
                            fontWeight: 700,
                          }}
                        >
                          <Star size={10} fill={TOKENS.colors.textOnPrimary} />
                          {t("accounts.primaryBadge")}
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    style={{ fontSize: "16px", fontWeight: 800, color: TOKENS.colors.textPrimary }}
                  >
                    {formatCurrency(acc.balance, currency)}
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
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      cursor: "pointer",
                      fontSize: "12px",
                      color: TOKENS.colors.textSecondary,
                      fontWeight: 600,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={acc.includeInCalendar}
                      onChange={() => onToggleInclude(acc.id)}
                      style={{ cursor: "pointer" }}
                    />
                    {t("accounts.includeInCalendar")}
                  </label>

                  {!acc.isPrimary && (
                    <button
                      type="button"
                      onClick={() => onSetPrimary(acc.id)}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: TOKENS.colors.primary,
                        fontSize: "11px",
                        fontWeight: 700,
                        cursor: "pointer",
                        padding: "4px 8px",
                      }}
                    >
                      {t("accounts.isPrimary")}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        {isAdding ? (
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
              {t("accounts.addAccount")}
            </span>

            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <span style={{ fontSize: "11px", fontWeight: 600, color: TOKENS.colors.textMuted }}>
                {t("accounts.accountName")}
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("accounts.namePlaceholder")}
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
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <span style={{ fontSize: "11px", fontWeight: 600, color: TOKENS.colors.textMuted }}>
                {t("accounts.accountType")}
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {ACCOUNT_TYPES.map((tItem) => {
                  const isSel = type === tItem;
                  return (
                    <button
                      key={tItem}
                      type="button"
                      onClick={() => setType(tItem)}
                      style={{
                        backgroundColor: isSel ? TOKENS.colors.primary : TOKENS.colors.surface,
                        color: isSel ? TOKENS.colors.textOnPrimary : TOKENS.colors.textSecondary,
                        border: `1px solid ${isSel ? TOKENS.colors.primary : TOKENS.colors.borderSubtle}`,
                        borderRadius: TOKENS.radii.pill,
                        padding: "4px 10px",
                        fontSize: "12px",
                        fontWeight: isSel ? 700 : 600,
                        cursor: "pointer",
                      }}
                    >
                      {getTypeLabel(tItem)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <span style={{ fontSize: "11px", fontWeight: 600, color: TOKENS.colors.textMuted }}>
                {t("accounts.initialBalance")}
              </span>
              <input
                type="number"
                value={balanceStr}
                onChange={(e) => setBalanceStr(e.target.value)}
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
            </div>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
                fontSize: "12px",
                color: TOKENS.colors.textSecondary,
                fontWeight: 600,
              }}
            >
              <input
                type="checkbox"
                checked={includeInCalendar}
                onChange={(e) => setIncludeInCalendar(e.target.checked)}
                style={{ cursor: "pointer" }}
              />
              {t("accounts.includeInCalendar")}
            </label>

            <div style={{ display: "flex", gap: TOKENS.spacing.sm, marginTop: TOKENS.spacing.xs }}>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
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
                onClick={handleCreateAccount}
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
            onClick={() => setIsAdding(true)}
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
            <span>{t("accounts.addAccount")}</span>
          </button>
        )}
      </div>
    </div>
  );
};
