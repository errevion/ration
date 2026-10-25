import type { MoneyCycle, SpendTransaction } from "@ration/types";
import { useMemo, useState } from "react";
import { CalendarGrid } from "./components/CalendarGrid.js";
import { CycleHeader } from "./components/CycleHeader.js";
import { KeypadDrawer } from "./components/KeypadDrawer.js";
import { QuickBar } from "./components/QuickBar.js";
import { SettingsDrawer } from "./components/SettingsDrawer.js";
import { I18nProvider } from "./i18n/index.js";
import { TOKENS } from "./theme/tokens.js";
import { computeCycleBudget, formatIsoDate } from "./utils/budgetEngine.js";

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
    startingBalance: 900,
    currency: "$",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function getInitialTransactions(cycleId: string, startDateStr: string): SpendTransaction[] {
  const [year, month, day] = startDateStr.split("-").map(Number);
  const start = new Date(year, month - 1, day, 12, 0, 0);

  const tx1Date = new Date(start);
  tx1Date.setDate(tx1Date.getDate() + 1);

  const tx2Date = new Date(start);
  tx2Date.setDate(tx2Date.getDate() + 3);

  return [
    {
      id: "d0000000-0000-0000-0000-000000000001",
      cycleId,
      date: formatIsoDate(tx1Date),
      amount: 25,
      type: "spend",
      createdAt: new Date().toISOString(),
    },
    {
      id: "d0000000-0000-0000-0000-000000000002",
      cycleId,
      date: formatIsoDate(tx2Date),
      amount: 42,
      type: "spend",
      createdAt: new Date().toISOString(),
    },
  ];
}

function TrackerApp() {
  const [cycle, setCycle] = useState<MoneyCycle>(getInitialCycle);
  const [transactions, setTransactions] = useState<SpendTransaction[]>(() =>
    getInitialTransactions(cycle.id, cycle.startDate)
  );
  const [isKeypadOpen, setIsKeypadOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [keypadMode, setKeypadMode] = useState<"spend" | "income">("spend");

  const todayIso = formatIsoDate(new Date());

  const computation = useMemo(() => {
    return computeCycleBudget(cycle, transactions, todayIso);
  }, [cycle, transactions, todayIso]);

  function handleRecordTransaction(amount: number) {
    const newTx: SpendTransaction = {
      id: crypto.randomUUID(),
      cycleId: cycle.id,
      date: todayIso,
      amount,
      type: keypadMode,
      createdAt: new Date().toISOString(),
    };
    setTransactions((prev) => [...prev, newTx]);
    setIsKeypadOpen(false);
  }

  function handleUpdateCycleSettings(settings: {
    currency: string;
    startDate: string;
    endDate: string;
  }) {
    setCycle((prev) => ({
      ...prev,
      currency: settings.currency,
      startDate: settings.startDate,
      endDate: settings.endDate,
      updatedAt: new Date().toISOString(),
    }));
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
            cycle={cycle}
            remainingBalance={computation.remainingBalance}
            remainingDaysCount={computation.remainingDaysCount}
            dailyAllowance={computation.dailyAllowance}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />

          <CalendarGrid
            days={computation.cycleDays}
            leadingEmptyDays={computation.leadingEmptyDays}
            trailingEmptyDays={computation.trailingEmptyDays}
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
          onClose={() => setIsKeypadOpen(false)}
          onConfirm={handleRecordTransaction}
        />

        <SettingsDrawer
          isOpen={isSettingsOpen}
          cycle={cycle}
          onClose={() => setIsSettingsOpen(false)}
          onSave={handleUpdateCycleSettings}
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
