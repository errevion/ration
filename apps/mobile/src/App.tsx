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
import { registerRootComponent } from "expo";
import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { AccountsModal } from "./components/AccountsModal";
import { CalendarGrid } from "./components/CalendarGrid";
import { CommitmentsModal } from "./components/CommitmentsModal";
import { CycleHeader } from "./components/CycleHeader";
import { DayDetailModal } from "./components/DayDetailModal";
import { KeypadModal } from "./components/KeypadModal";
import { QuickBar } from "./components/QuickBar";
import { SettingsModal } from "./components/SettingsModal";
import { I18nProvider } from "./i18n";
import { TOKENS } from "./theme/tokens";
import { computeCycleBudget, formatIsoDate } from "./utils/budgetEngine";

function generateUuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getInitialCycle(): MoneyCycle {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const currentDay = now.getDate();

  let startYear = year;
  let startMonth = month;
  if (currentDay < 25) {
    startMonth = month - 1;
    if (startMonth < 0) {
      startMonth = 11;
      startYear = year - 1;
    }
  }

  let endYear = startYear;
  let endMonth = startMonth + 1;
  if (endMonth > 11) {
    endMonth = 0;
    endYear = startYear + 1;
  }

  const startDate = `${startYear}-${String(startMonth + 1).padStart(2, "0")}-25`;
  const endDate = `${endYear}-${String(endMonth + 1).padStart(2, "0")}-24`;

  return {
    id: "c0000000-0000-0000-0000-000000000001",
    name: "Monthly Pay Period",
    startDate,
    endDate,
    startingBalance: 0,
    currency: "Rp ",
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
function MainScreen() {
  const [cycle, setCycle] = useState<MoneyCycle>(getInitialCycle);
  const [accounts, setAccounts] = useState<Account[]>(() => getInitialAccounts(cycle.currency));
  const [transactions, setTransactions] = useState<SpendTransaction[]>(getInitialTransactions);
  const [plannedPayments, setPlannedPayments] = useState<PlannedPayment[]>([]);
  const [loans, setLoans] = useState<LoanRecord[]>([]);

  const [referenceDate, setReferenceDate] = useState<string>(() => formatIsoDate(new Date()));
  const [isKeypadOpen, setIsKeypadOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAccountsOpen, setIsAccountsOpen] = useState(false);
  const [isCommitmentsOpen, setIsCommitmentsOpen] = useState(false);

  const [keypadMode, setKeypadMode] = useState<"spend" | "income">("spend");
  const [selectedDay, setSelectedDay] = useState<DailyAllocation | null>(null);

  const computation = useMemo(() => {
    return computeCycleBudget(cycle, transactions, referenceDate, {
      accounts,
      plannedPayments,
      loans,
    });
  }, [cycle, transactions, referenceDate, accounts, plannedPayments, loans]);

  function handleRecordTransaction(amount: number, accountId?: string) {
    const targetAccountId = accountId || accounts.find((a) => a.isPrimary)?.id || accounts[0]?.id;

    const newTx: SpendTransaction = {
      id: generateUuid(),
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
    type: AccountType;
    balance: number;
    includeInCalendar: boolean;
    isPrimary: boolean;
  }) {
    const newAcc: Account = {
      id: generateUuid(),
      name: accData.name,
      type: accData.type,
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
  function handleAddPlannedPayment(paymentData: {
    name: string;
    amount: number;
    dueDate: string;
    accountId?: string;
  }) {
    const newPayment: PlannedPayment = {
      id: generateUuid(),
      name: paymentData.name,
      amount: paymentData.amount,
      dueDate: paymentData.dueDate,
      accountId: paymentData.accountId,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    setPlannedPayments((prev) => [...prev, newPayment]);
  }

  function handleMarkPaymentPaid(paymentId: string) {
    const payment = plannedPayments.find((p) => p.id === paymentId);
    if (!payment) return;

    setPlannedPayments((prev) =>
      prev.map((p) => (p.id === paymentId ? { ...p, status: "completed" } : p))
    );

    const targetAccId =
      payment.accountId || accounts.find((a) => a.isPrimary)?.id || accounts[0]?.id;
    if (targetAccId) {
      setAccounts((prev) =>
        prev.map((acc) =>
          acc.id === targetAccId
            ? { ...acc, balance: acc.balance - payment.amount, updatedAt: new Date().toISOString() }
            : acc
        )
      );
    }

    const newTx: SpendTransaction = {
      id: generateUuid(),
      cycleId: cycle.id,
      date: referenceDate,
      amount: payment.amount,
      type: "spend",
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
      id: generateUuid(),
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
      id: generateUuid(),
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
        id: generateUuid(),
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

  function handleUpdateCycleSettings(settings: {
    currency: string;
    startDate: string;
    endDate: string;
    referenceDate?: string;
  }) {
    setCycle((prev) => ({
      ...prev,
      currency: settings.currency,
      startDate: settings.startDate,
      endDate: settings.endDate,
      updatedAt: new Date().toISOString(),
    }));
    if (settings.referenceDate) {
      setReferenceDate(settings.referenceDate);
    }
  }

  const todayQuota = Math.floor(computation.dailyAllowance);
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          bounces={false}
          showsVerticalScrollIndicator={false}
        >
          <CycleHeader
            cycle={cycle}
            foreseeableBalance={computation.foreseeableBalance}
            actualBalance={computation.actualBalance}
            remainingDaysCount={computation.remainingDaysCount}
            dailyAllowance={computation.dailyAllowance}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenAccounts={() => setIsAccountsOpen(true)}
            onOpenCommitments={() => setIsCommitmentsOpen(true)}
          />

          <CalendarGrid
            days={computation.cycleDays}
            leadingEmptyDays={computation.leadingEmptyDays}
            trailingEmptyDays={computation.trailingEmptyDays}
            onSelectDay={setSelectedDay}
          />
        </ScrollView>

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

        <KeypadModal
          isOpen={isKeypadOpen}
          currency={cycle.currency}
          mode={keypadMode}
          accounts={accounts}
          onClose={() => setIsKeypadOpen(false)}
          onConfirm={handleRecordTransaction}
        />

        <SettingsModal
          isOpen={isSettingsOpen}
          cycle={cycle}
          referenceDate={referenceDate}
          onClose={() => setIsSettingsOpen(false)}
          onSave={handleUpdateCycleSettings}
        />

        <DayDetailModal
          day={selectedDay}
          currency={cycle.currency}
          transactions={transactions}
          plannedPayments={plannedPayments}
          loans={loans}
          onClose={() => setSelectedDay(null)}
          onMarkPaymentPaid={handleMarkPaymentPaid}
          onMarkLoanSettled={handleMarkLoanSettled}
        />

        <AccountsModal
          isOpen={isAccountsOpen}
          accounts={accounts}
          currency={cycle.currency}
          onClose={() => setIsAccountsOpen(false)}
          onAddAccount={handleAddAccount}
          onToggleInclude={handleToggleIncludeAccount}
          onSetPrimary={handleSetPrimaryAccount}
        />

        <CommitmentsModal
          isOpen={isCommitmentsOpen}
          accounts={accounts}
          plannedPayments={plannedPayments}
          loans={loans}
          currency={cycle.currency}
          onClose={() => setIsCommitmentsOpen(false)}
          onAddPlannedPayment={handleAddPlannedPayment}
          onMarkPaymentPaid={handleMarkPaymentPaid}
          onAddLoan={handleAddLoan}
          onMarkLoanSettled={handleMarkLoanSettled}
        />
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <I18nProvider>
        <MainScreen />
      </I18nProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: TOKENS.colors.canvas,
  },
  container: {
    flex: 1,
    backgroundColor: TOKENS.colors.canvas,
    justifyContent: "space-between",
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: TOKENS.spacing.lg,
    paddingTop: TOKENS.spacing.md,
    paddingBottom: TOKENS.spacing.sm,
  },
});

registerRootComponent(App);
