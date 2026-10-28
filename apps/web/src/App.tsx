import type {
  Account,
  AccountType,
  DailyAllocation,
  LoanRecord,
  LoanType,
  MoneyCycle,
  PlannedPayment,
  SpendTransaction,
} from "@ration/types";
import { useEffect, useMemo, useState } from "react";
import { AccountsDrawer } from "./components/AccountsDrawer.js";
import { CalendarGrid } from "./components/CalendarGrid.js";
import { CycleHeader } from "./components/CycleHeader.js";
import { DayDetailDrawer } from "./components/DayDetailDrawer.js";
import { KeypadDrawer } from "./components/KeypadDrawer.js";
import { LoansDrawer } from "./components/LoansDrawer.js";
import { PlannedDrawer } from "./components/PlannedDrawer.js";
import { QuickBar } from "./components/QuickBar.js";
import { SettingsDrawer } from "./components/SettingsDrawer.js";
import { I18nProvider } from "./i18n/index.js";
import { TOKENS } from "./theme/tokens.js";
import { computeCycleBudget, computeCycleRange, formatIsoDate } from "./utils/budgetEngine.js";
import {
  exportBackupFile,
  importBackupFile,
  loadPersistedState,
  savePersistedState,
} from "./utils/storage.js";

function getInitialCycle(): MoneyCycle {
  const startDay = 1;
  const range = computeCycleRange(startDay);

  return {
    id: "c0000000-0000-0000-0000-000000000001",
    name: "Monthly Cycle",
    startDate: range.startDate,
    endDate: range.endDate,
    startDay,
    startingBalance: 0,
    currency: "$",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function getInitialAccounts(currency: string): Account[] {
  return [
    {
      id: "a0000000-0000-0000-0000-000000000001",
      name: "Main Account",
      type: "bank",
      balance: 0,
      currency,
      includeInCalendar: true,
      isPrimary: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
}

function getInitialTransactions(): SpendTransaction[] {
  return [];
}
function TrackerApp() {
  const [cycle, setCycle] = useState<MoneyCycle>(getInitialCycle);
  const [accounts, setAccounts] = useState<Account[]>(() => getInitialAccounts(cycle.currency));
  const [transactions, setTransactions] = useState<SpendTransaction[]>(getInitialTransactions);
  const [plannedPayments, setPlannedPayments] = useState<PlannedPayment[]>([]);
  const [loans, setLoans] = useState<LoanRecord[]>([]);

  const [referenceDate] = useState<string>(() => formatIsoDate(new Date()));
  const [isHydrated, setIsHydrated] = useState(false);

  const [cycleOffset, setCycleOffset] = useState(0);
  const [showProjection, setShowProjection] = useState(false);

  const [isKeypadOpen, setIsKeypadOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAccountsOpen, setIsAccountsOpen] = useState(false);
  const [isPlannedOpen, setIsPlannedOpen] = useState(false);
  const [isLoansOpen, setIsLoansOpen] = useState(false);

  const [keypadMode, setKeypadMode] = useState<"spend" | "income">("spend");
  const [selectedDay, setSelectedDay] = useState<DailyAllocation | null>(null);

  useEffect(() => {
    const saved = loadPersistedState();
    if (saved) {
      const startDay = saved.cycle.startDay ?? 1;
      const currentRange = computeCycleRange(startDay);
      setCycle({
        ...saved.cycle,
        startDay,
        startDate: currentRange.startDate,
        endDate: currentRange.endDate,
      });
      setAccounts(saved.accounts);
      setTransactions(saved.transactions);
      setPlannedPayments(saved.plannedPayments);
      setLoans(saved.loans);
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    savePersistedState({
      version: 1,
      cycle,
      accounts,
      transactions,
      plannedPayments,
      loans,
      referenceDate,
    });
  }, [isHydrated, cycle, accounts, transactions, plannedPayments, loans, referenceDate]);

  const displayedCycle = useMemo(() => {
    const startDay = cycle.startDay ?? 1;
    const range = computeCycleRange(startDay, new Date(), cycleOffset);
    return {
      ...cycle,
      startDate: range.startDate,
      endDate: range.endDate,
    };
  }, [cycle, cycleOffset]);

  const computation = useMemo(() => {
    return computeCycleBudget(displayedCycle, transactions, referenceDate, {
      accounts,
      plannedPayments,
      loans,
    });
  }, [displayedCycle, transactions, referenceDate, accounts, plannedPayments, loans]);

  function handleRecordTransaction(amount: number, accountId?: string) {
    const targetAccountId = accountId || accounts.find((a) => a.isPrimary)?.id || accounts[0]?.id;

    const newTx: SpendTransaction = {
      id: crypto.randomUUID(),
      cycleId: cycle.id,
      date: referenceDate,
      amount,
      type: keypadMode,
      accountId: targetAccountId,
      createdAt: new Date().toISOString(),
    };

    setTransactions((prev) => [...prev, newTx]);

    if (targetAccountId) {
      setAccounts((prev) =>
        prev.map((acc) => {
          if (acc.id === targetAccountId) {
            const updated = keypadMode === "spend" ? acc.balance - amount : acc.balance + amount;
            return { ...acc, balance: updated, updatedAt: new Date().toISOString() };
          }
          return acc;
        })
      );
    }

    setIsKeypadOpen(false);
  }

  function handleAddAccount(accData: {
    name: string;
    type?: AccountType;
    balance: number;
    includeInCalendar: boolean;
    isPrimary: boolean;
  }) {
    const newAcc: Account = {
      id: crypto.randomUUID(),
      name: accData.name,
      type: accData.type ?? "bank",
      balance: accData.balance,
      currency: cycle.currency,
      includeInCalendar: accData.includeInCalendar,
      isPrimary: accData.isPrimary || accounts.length === 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setAccounts((prev) => {
      if (newAcc.isPrimary) {
        return [...prev.map((a) => ({ ...a, isPrimary: false })), newAcc];
      }
      return [...prev, newAcc];
    });
  }

  function handleToggleIncludeAccount(accountId: string) {
    setAccounts((prev) =>
      prev.map((a) => (a.id === accountId ? { ...a, includeInCalendar: !a.includeInCalendar } : a))
    );
  }

  function handleSetPrimaryAccount(accountId: string) {
    setAccounts((prev) => prev.map((a) => ({ ...a, isPrimary: a.id === accountId })));
  }

  function handleDeleteAccount(accountId: string) {
    if (accounts.length <= 1) return;
    const accountToDelete = accounts.find((a) => a.id === accountId);
    const remaining = accounts.filter((a) => a.id !== accountId);
    if (accountToDelete?.isPrimary && remaining.length > 0) {
      remaining[0].isPrimary = true;
    }
    setAccounts(remaining);
    setTransactions((prev) =>
      prev.map((t) => (t.accountId === accountId ? { ...t, accountId: undefined } : t))
    );
  }
  function handleAddPlannedPayment(paymentData: {
    name: string;
    amount: number;
    dueDate: string;
    type: "spend" | "income";
    accountId?: string;
    isRecurring?: boolean;
  }) {
    if (paymentData.isRecurring) {
      const [startYear, startMonth, startDay] = paymentData.dueDate.split("-").map(Number);
      const newItems: PlannedPayment[] = [];
      for (let i = 0; i < 12; i++) {
        const targetDate = new Date(startYear, startMonth - 1 + i, 1);
        const yr = targetDate.getFullYear();
        const mo = targetDate.getMonth() + 1;
        const maxDays = new Date(yr, mo, 0).getDate();
        const dy = Math.min(startDay, maxDays);
        const occurrenceDueDate = `${yr}-${String(mo).padStart(2, "0")}-${String(dy).padStart(2, "0")}`;

        newItems.push({
          id: crypto.randomUUID(),
          name: paymentData.name,
          amount: paymentData.amount,
          dueDate: occurrenceDueDate,
          type: paymentData.type,
          accountId: paymentData.accountId,
          status: "pending",
          isRecurring: true,
          createdAt: new Date().toISOString(),
        });
      }
      setPlannedPayments((prev) => [...prev, ...newItems]);
    } else {
      const newPayment: PlannedPayment = {
        id: crypto.randomUUID(),
        name: paymentData.name,
        amount: paymentData.amount,
        dueDate: paymentData.dueDate,
        type: paymentData.type,
        accountId: paymentData.accountId,
        status: "pending",
        isRecurring: false,
        createdAt: new Date().toISOString(),
      };
      setPlannedPayments((prev) => [...prev, newPayment]);
    }
  }

  function handleEditPlannedPayment(
    id: string,
    data: {
      name: string;
      amount: number;
      dueDate: string;
      type: "spend" | "income";
      accountId?: string;
      isRecurring?: boolean;
    }
  ) {
    setPlannedPayments((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)));
  }

  function handleDeletePlannedPayment(id: string) {
    setPlannedPayments((prev) => prev.filter((p) => p.id !== id));
  }

  function handleMarkPaymentPaid(paymentId: string) {
    const payment = plannedPayments.find((p) => p.id === paymentId);
    if (!payment) return;

    setPlannedPayments((prev) =>
      prev.map((p) => (p.id === paymentId ? { ...p, status: "completed" } : p))
    );

    const targetAccId =
      payment.accountId || accounts.find((a) => a.isPrimary)?.id || accounts[0]?.id;
    const isIncome = payment.type === "income";

    if (targetAccId) {
      setAccounts((prev) =>
        prev.map((acc) => {
          if (acc.id === targetAccId) {
            const updated = isIncome ? acc.balance + payment.amount : acc.balance - payment.amount;
            return { ...acc, balance: updated, updatedAt: new Date().toISOString() };
          }
          return acc;
        })
      );
    }

    const newTx: SpendTransaction = {
      id: crypto.randomUUID(),
      cycleId: cycle.id,
      date: referenceDate,
      amount: payment.amount,
      type: isIncome ? "income" : "spend",
      accountId: targetAccId,
      notes: payment.name,
      createdAt: new Date().toISOString(),
    };
    setTransactions((prev) => [...prev, newTx]);
  }

  function handleAddLoan(loanData: {
    counterparty: string;
    type: LoanType;
    amount: number;
    dueDate: string;
    accountId?: string;
    notes?: string;
  }) {
    const newLoan: LoanRecord = {
      id: crypto.randomUUID(),
      counterparty: loanData.counterparty,
      type: loanData.type,
      amount: loanData.amount,
      dueDate: loanData.dueDate,
      accountId: loanData.accountId,
      status: "active",
      notes: loanData.notes,
      createdAt: new Date().toISOString(),
    };
    setLoans((prev) => [...prev, newLoan]);

    const targetAccId =
      loanData.accountId || accounts.find((a) => a.isPrimary)?.id || accounts[0]?.id;
    if (targetAccId) {
      setAccounts((prev) =>
        prev.map((acc) => {
          if (acc.id === targetAccId) {
            const updated =
              loanData.type === "borrow"
                ? acc.balance + loanData.amount
                : acc.balance - loanData.amount;
            return { ...acc, balance: updated, updatedAt: new Date().toISOString() };
          }
          return acc;
        })
      );
    }

    const newTx: SpendTransaction = {
      id: crypto.randomUUID(),
      cycleId: cycle.id,
      date: referenceDate,
      amount: loanData.amount,
      type: loanData.type === "borrow" ? "income" : "spend",
      accountId: targetAccId,
      notes: loanData.counterparty,
      createdAt: new Date().toISOString(),
    };
    setTransactions((prev) => [...prev, newTx]);
  }

  function handleEditLoan(
    id: string,
    data: {
      counterparty: string;
      type: LoanType;
      amount: number;
      dueDate: string;
      accountId?: string;
      notes?: string;
    }
  ) {
    setLoans((prev) => prev.map((l) => (l.id === id ? { ...l, ...data } : l)));
  }

  function handleDeleteLoan(id: string) {
    setLoans((prev) => prev.filter((l) => l.id !== id));
  }

  function handleMarkLoanSettled(loanId: string) {
    const loan = loans.find((l) => l.id === loanId);
    if (!loan) return;

    setLoans((prev) =>
      prev.map((l) =>
        l.id === loanId ? { ...l, status: "settled", settledDate: referenceDate } : l
      )
    );

    if (loan.type === "lend") {
      const targetAccId =
        loan.accountId || accounts.find((a) => a.isPrimary)?.id || accounts[0]?.id;
      if (targetAccId) {
        setAccounts((prev) =>
          prev.map((acc) =>
            acc.id === targetAccId
              ? { ...acc, balance: acc.balance + loan.amount, updatedAt: new Date().toISOString() }
              : acc
          )
        );
      }

      const newTx: SpendTransaction = {
        id: crypto.randomUUID(),
        cycleId: cycle.id,
        date: referenceDate,
        amount: loan.amount,
        type: "income",
        accountId: targetAccId,
        notes: loan.counterparty,
        createdAt: new Date().toISOString(),
      };
      setTransactions((prev) => [...prev, newTx]);
    }
  }

  function handleUpdateCycleSettings(settings: { currency: string; startDay: number }) {
    const range = computeCycleRange(settings.startDay);
    setCycle((prev) => ({
      ...prev,
      currency: settings.currency,
      startDay: settings.startDay,
      startDate: range.startDate,
      endDate: range.endDate,
      updatedAt: new Date().toISOString(),
    }));
  }

  function handleExportBackup() {
    exportBackupFile({
      version: 1,
      exportedAt: new Date().toISOString(),
      cycle,
      accounts,
      transactions,
      plannedPayments,
      loans,
      referenceDate,
    });
  }

  async function handleImportBackup(file: File) {
    const data = await importBackupFile(file);
    if (data) {
      const startDay = data.cycle.startDay ?? 1;
      const range = computeCycleRange(startDay);
      setCycle({
        ...data.cycle,
        startDay,
        startDate: range.startDate,
        endDate: range.endDate,
      });
      setAccounts(data.accounts);
      setTransactions(data.transactions);
      setPlannedPayments(data.plannedPayments);
      setLoans(data.loans);
    }
  }

  const todayQuota = Math.floor(computation.dailyAllowance);
  return (
    <div
      style={{
        height: "100dvh",
        maxHeight: "100dvh",
        backgroundColor: "#000000",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        overflow: "hidden",
        touchAction: "manipulation",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "430px",
          height: "100%",
          maxHeight: "100dvh",
          backgroundColor: TOKENS.colors.canvas,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          boxShadow: "0 0 40px rgba(0, 0, 0, 0.9)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: `${TOKENS.spacing.lg} ${TOKENS.spacing.lg} ${TOKENS.spacing.sm}`,
            display: "flex",
            flexDirection: "column",
            gap: TOKENS.spacing.sm,
            flex: 1,
            overflowY: "auto",
            overscrollBehavior: "contain",
          }}
        >
          <CycleHeader
            cycle={displayedCycle}
            foreseeableBalance={computation.foreseeableBalance}
            actualBalance={computation.actualBalance}
            remainingDaysCount={computation.remainingDaysCount}
            dailyAllowance={computation.dailyAllowance}
            projectedDailyAllowance={computation.projectedDailyAllowance}
            showProjection={showProjection}
            cycleOffset={cycleOffset}
            onToggleProjection={() => setShowProjection((prev) => !prev)}
            onPrevCycle={() => setCycleOffset((prev) => prev - 1)}
            onNextCycle={() => setCycleOffset((prev) => prev + 1)}
            onResetCycle={() => setCycleOffset(0)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenAccounts={() => setIsAccountsOpen(true)}
            onOpenPlanned={() => setIsPlannedOpen(true)}
            onOpenLoans={() => setIsLoansOpen(true)}
          />

          <CalendarGrid
            days={computation.cycleDays}
            leadingEmptyDays={computation.leadingEmptyDays}
            trailingEmptyDays={computation.trailingEmptyDays}
            onSelectDay={setSelectedDay}
          />
        </div>

        <QuickBar
          currency={cycle.currency}
          todayQuota={todayQuota}
          spentToday={computation.spentToday}
          onOpenAdd={() => {
            setKeypadMode("income");
            setIsKeypadOpen(true);
          }}
          onOpenSpend={() => {
            setKeypadMode("spend");
            setIsKeypadOpen(true);
          }}
        />

        <KeypadDrawer
          isOpen={isKeypadOpen}
          currency={cycle.currency}
          mode={keypadMode}
          accounts={accounts}
          foreseeableBalance={computation.foreseeableBalance}
          remainingDaysCount={computation.remainingDaysCount}
          onClose={() => setIsKeypadOpen(false)}
          onConfirm={handleRecordTransaction}
        />

        <SettingsDrawer
          isOpen={isSettingsOpen}
          cycle={cycle}
          onClose={() => setIsSettingsOpen(false)}
          onSave={handleUpdateCycleSettings}
          onExportBackup={handleExportBackup}
          onImportBackup={handleImportBackup}
        />

        <DayDetailDrawer
          day={selectedDay}
          currency={cycle.currency}
          transactions={transactions}
          plannedPayments={plannedPayments}
          loans={loans}
          onClose={() => setSelectedDay(null)}
          onMarkPaymentPaid={handleMarkPaymentPaid}
          onMarkLoanSettled={handleMarkLoanSettled}
        />

        <AccountsDrawer
          isOpen={isAccountsOpen}
          accounts={accounts}
          currency={cycle.currency}
          onClose={() => setIsAccountsOpen(false)}
          onAddAccount={handleAddAccount}
          onToggleInclude={handleToggleIncludeAccount}
          onSetPrimary={handleSetPrimaryAccount}
          onDeleteAccount={handleDeleteAccount}
        />

        <PlannedDrawer
          isOpen={isPlannedOpen}
          accounts={accounts}
          plannedPayments={plannedPayments}
          currency={cycle.currency}
          onClose={() => setIsPlannedOpen(false)}
          onAddPlannedPayment={handleAddPlannedPayment}
          onEditPlannedPayment={handleEditPlannedPayment}
          onDeletePlannedPayment={handleDeletePlannedPayment}
          onMarkPaymentPaid={handleMarkPaymentPaid}
        />

        <LoansDrawer
          isOpen={isLoansOpen}
          accounts={accounts}
          loans={loans}
          currency={cycle.currency}
          onClose={() => setIsLoansOpen(false)}
          onAddLoan={handleAddLoan}
          onEditLoan={handleEditLoan}
          onDeleteLoan={handleDeleteLoan}
          onMarkLoanSettled={handleMarkLoanSettled}
        />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <TrackerApp />
    </I18nProvider>
  );
}
