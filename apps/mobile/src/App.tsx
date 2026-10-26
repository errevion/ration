import type { DailyAllocation, MoneyCycle, SpendTransaction } from "@ration/types";
import { registerRootComponent } from "expo";
import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { CalendarGrid } from "./components/CalendarGrid";
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

function getInitialTransactions(): SpendTransaction[] {
  return [];
}

function MainScreen() {
  const [cycle, setCycle] = useState<MoneyCycle>(getInitialCycle);
  const [transactions, setTransactions] = useState<SpendTransaction[]>(getInitialTransactions);
  const [referenceDate, setReferenceDate] = useState<string>(() => formatIsoDate(new Date()));
  const [isKeypadOpen, setIsKeypadOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [keypadMode, setKeypadMode] = useState<"spend" | "income">("spend");
  const [selectedDay, setSelectedDay] = useState<DailyAllocation | null>(null);

  const computation = useMemo(() => {
    return computeCycleBudget(cycle, transactions, referenceDate);
  }, [cycle, transactions, referenceDate]);

  function handleRecordTransaction(amount: number) {
    const newTx: SpendTransaction = {
      id: generateUuid(),
      cycleId: cycle.id,
      date: referenceDate,
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
            remainingBalance={computation.remainingBalance}
            remainingDaysCount={computation.remainingDaysCount}
            dailyAllowance={computation.dailyAllowance}
            onOpenSettings={() => setIsSettingsOpen(true)}
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
          onClose={() => setSelectedDay(null)}
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
