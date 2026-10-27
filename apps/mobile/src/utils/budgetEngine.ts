import type {
  Account,
  DailyAllocation,
  LoanRecord,
  MoneyCycle,
  PlannedPayment,
  SpendTransaction,
} from "@ration/types";

export interface BudgetEngineOptions {
  accounts?: Account[];
  plannedPayments?: PlannedPayment[];
  loans?: LoanRecord[];
}

export interface CycleComputation {
  cycleDays: DailyAllocation[];
  leadingEmptyDays: number;
  trailingEmptyDays: number;
  totalSpentPast: number;
  spentToday: number;
  totalSpent: number;
  totalIncome: number;
  incomeToday: number;
  actualBalance: number;
  foreseeableBalance: number;
  quarantinedAmount: number;
  remainingBalance: number;
  remainingDaysCount: number;
  dailyAllowance: number;
}

export function formatIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseIsoDate(isoDate: string): Date {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
}

export function getMondayFirstDayOfWeek(date: Date): number {
  const standardDay = date.getDay();
  return (standardDay + 6) % 7;
}

export function computeCycleBudget(
  cycle: MoneyCycle,
  transactions: SpendTransaction[],
  referenceDateStr?: string,
  options?: BudgetEngineOptions
): CycleComputation {
  const referenceDate = referenceDateStr ?? formatIsoDate(new Date());

  const startDate = parseIsoDate(cycle.startDate);
  const endDate = parseIsoDate(cycle.endDate);

  const spendByDate = new Map<string, number>();
  const incomeByDate = new Map<string, number>();

  for (const tx of transactions) {
    if (tx.cycleId === cycle.id) {
      const type = tx.type ?? "spend";
      if (type === "income") {
        const current = incomeByDate.get(tx.date) ?? 0;
        incomeByDate.set(tx.date, current + tx.amount);
      } else {
        const current = spendByDate.get(tx.date) ?? 0;
        spendByDate.set(tx.date, current + tx.amount);
      }
    }
  }

  const rawDays: {
    date: string;
    dayNumber: number;
    dayOfWeek: number;
    isPast: boolean;
    isToday: boolean;
    isFuture: boolean;
    spentAmount: number;
    incomeAmount: number;
  }[] = [];

  const cursor = new Date(startDate);
  while (cursor <= endDate) {
    const dateStr = formatIsoDate(cursor);
    const dayOfWeek = getMondayFirstDayOfWeek(cursor);
    const dayNumber = cursor.getDate();
    const isPast = dateStr < referenceDate;
    const isToday = dateStr === referenceDate;
    const isFuture = dateStr > referenceDate;
    const spentAmount = spendByDate.get(dateStr) ?? 0;
    const incomeAmount = incomeByDate.get(dateStr) ?? 0;

    rawDays.push({
      date: dateStr,
      dayNumber,
      dayOfWeek,
      isPast,
      isToday,
      isFuture,
      spentAmount,
      incomeAmount,
    });

    cursor.setDate(cursor.getDate() + 1);
  }

  let totalSpentPast = 0;
  let spentToday = 0;
  let totalIncomePast = 0;
  let incomeToday = 0;
  let remainingDaysCount = 0;

  for (const day of rawDays) {
    if (day.isPast) {
      totalSpentPast += day.spentAmount;
      totalIncomePast += day.incomeAmount;
    } else if (day.isToday) {
      spentToday += day.spentAmount;
      incomeToday += day.incomeAmount;
      remainingDaysCount += 1;
    } else if (day.isFuture) {
      remainingDaysCount += 1;
    }
  }

  const totalSpent = totalSpentPast + spentToday;
  const totalIncome = totalIncomePast + incomeToday;

  let actualBalance = Math.max(0, cycle.startingBalance + totalIncome - totalSpent);
  if (options?.accounts && options.accounts.length > 0) {
    actualBalance = options.accounts
      .filter((acc) => acc.includeInCalendar)
      .reduce((sum, acc) => sum + acc.balance, 0);
  }

  let quarantinedAmount = 0;
  const commitmentByDate = new Map<string, number>();

  if (options?.plannedPayments) {
    for (const p of options.plannedPayments) {
      const isBill = (p.type ?? "spend") === "spend";
      if (
        isBill &&
        p.status === "pending" &&
        p.dueDate >= referenceDate &&
        p.dueDate <= cycle.endDate
      ) {
        quarantinedAmount += p.amount;
      }
      if (p.status === "pending") {
        const cur = commitmentByDate.get(p.dueDate) ?? 0;
        commitmentByDate.set(p.dueDate, cur + p.amount);
      }
    }
  }

  if (options?.loans) {
    for (const l of options.loans) {
      if (
        l.type === "borrow" &&
        l.status === "active" &&
        l.dueDate >= referenceDate &&
        l.dueDate <= cycle.endDate
      ) {
        quarantinedAmount += l.amount;
      }
      if (l.type === "borrow" && l.status === "active") {
        const cur = commitmentByDate.get(l.dueDate) ?? 0;
        commitmentByDate.set(l.dueDate, cur + l.amount);
      }
    }
  }

  const foreseeableBalance = Math.max(0, actualBalance - quarantinedAmount);
  const dailyAllowance = remainingDaysCount > 0 ? foreseeableBalance / remainingDaysCount : 0;

  const cycleDays: DailyAllocation[] = rawDays.map((day) => {
    const dayCommitment = commitmentByDate.get(day.date) ?? 0;
    return {
      date: day.date,
      dayNumber: day.dayNumber,
      dayOfWeek: day.dayOfWeek,
      isPast: day.isPast,
      isToday: day.isToday,
      isFuture: day.isFuture,
      spentAmount: day.spentAmount,
      incomeAmount: day.incomeAmount,
      projectedQuota: day.isPast ? day.spentAmount : Math.floor(dailyAllowance),
      hasCommitment: dayCommitment > 0,
      commitmentAmount: dayCommitment,
    };
  });

  const leadingEmptyDays = cycleDays.length > 0 ? cycleDays[0].dayOfWeek : 0;
  const totalSlotsSoFar = leadingEmptyDays + cycleDays.length;
  const remainder = totalSlotsSoFar % 7;
  const trailingEmptyDays = remainder === 0 ? 0 : 7 - remainder;

  return {
    cycleDays,
    leadingEmptyDays,
    trailingEmptyDays,
    totalSpentPast,
    spentToday,
    totalSpent,
    totalIncome,
    incomeToday,
    actualBalance,
    foreseeableBalance,
    quarantinedAmount,
    remainingBalance: foreseeableBalance,
    remainingDaysCount,
    dailyAllowance,
  };
}
