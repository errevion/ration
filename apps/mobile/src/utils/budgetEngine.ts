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
  projectedIncome: number;
  projectedForeseeableBalance: number;
  projectedDailyAllowance: number;
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

export function getNextRecurrenceDate(
  dueDate: string,
  frequency: "weekly" | "monthly" = "monthly"
): string {
  const [year, month, day] = dueDate.split("-").map(Number);
  if (frequency === "weekly") {
    const current = new Date(year, month - 1, day);
    current.setDate(current.getDate() + 7);
    const yr = current.getFullYear();
    const mo = current.getMonth() + 1;
    const dy = current.getDate();
    return `${yr}-${String(mo).padStart(2, "0")}-${String(dy).padStart(2, "0")}`;
  }
  const targetDate = new Date(year, month, 1);
  const yr = targetDate.getFullYear();
  const mo = targetDate.getMonth() + 1;
  const maxDays = new Date(yr, mo, 0).getDate();
  const dy = Math.min(day, maxDays);
  return `${yr}-${String(mo).padStart(2, "0")}-${String(dy).padStart(2, "0")}`;
}

export function getMondayFirstDayOfWeek(date: Date): number {
  const standardDay = date.getDay();
  return (standardDay + 6) % 7;
}

export function computeCycleRange(
  startDay = 1,
  fromDate: Date = new Date(),
  cycleOffset = 0
): { startDate: string; endDate: string } {
  const clampedStartDay = Math.max(1, Math.min(31, Math.floor(startDay)));
  const year = fromDate.getFullYear();
  const month = fromDate.getMonth();
  const day = fromDate.getDate();

  let baseStartMonth = month;
  const baseStartYear = year;

  if (clampedStartDay === 1) {
    baseStartMonth += cycleOffset;
    const startNorm = new Date(baseStartYear, baseStartMonth, 1);
    const effYear = startNorm.getFullYear();
    const effMonth = startNorm.getMonth();
    const lastDay = new Date(effYear, effMonth + 1, 0).getDate();
    return {
      startDate: `${effYear}-${String(effMonth + 1).padStart(2, "0")}-01`,
      endDate: `${effYear}-${String(effMonth + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`,
    };
  }

  if (day < clampedStartDay) {
    baseStartMonth -= 1;
  }
  baseStartMonth += cycleOffset;

  const startNorm = new Date(baseStartYear, baseStartMonth, 1);
  const startYear = startNorm.getFullYear();
  const startMonth = startNorm.getMonth();

  const endNorm = new Date(startYear, startMonth + 1, 1);
  const endYear = endNorm.getFullYear();
  const endMonth = endNorm.getMonth();

  const maxDaysStart = new Date(startYear, startMonth + 1, 0).getDate();
  const actualStartDay = Math.min(clampedStartDay, maxDaysStart);

  const maxDaysEnd = new Date(endYear, endMonth + 1, 0).getDate();
  let targetEndDay = clampedStartDay - 1;
  if (targetEndDay < 1) targetEndDay = 1;
  const actualEndDay = Math.min(targetEndDay, maxDaysEnd);

  const startDate = `${startYear}-${String(startMonth + 1).padStart(2, "0")}-${String(actualStartDay).padStart(2, "0")}`;
  const endDate = `${endYear}-${String(endMonth + 1).padStart(2, "0")}-${String(actualEndDay).padStart(2, "0")}`;

  return { startDate, endDate };
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
  let projectedIncome = 0;
  const commitmentByDate = new Map<string, number>();
  const futureIncomeByDate = new Map<string, number>();

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
      if (
        !isBill &&
        p.status === "pending" &&
        p.dueDate >= referenceDate &&
        p.dueDate <= cycle.endDate
      ) {
        projectedIncome += p.amount;
        if (p.dueDate > referenceDate) {
          const cur = futureIncomeByDate.get(p.dueDate) ?? 0;
          futureIncomeByDate.set(p.dueDate, cur + p.amount);
        }
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
      if (
        l.type === "lend" &&
        l.status === "active" &&
        l.dueDate >= referenceDate &&
        l.dueDate <= cycle.endDate
      ) {
        projectedIncome += l.amount;
        if (l.dueDate > referenceDate) {
          const cur = futureIncomeByDate.get(l.dueDate) ?? 0;
          futureIncomeByDate.set(l.dueDate, cur + l.amount);
        }
      }
      if (l.type === "borrow" && l.status === "active") {
        const cur = commitmentByDate.get(l.dueDate) ?? 0;
        commitmentByDate.set(l.dueDate, cur + l.amount);
      }
    }
  }

  const foreseeableBalance = Math.max(0, actualBalance - quarantinedAmount);
  const dailyAllowance = remainingDaysCount > 0 ? foreseeableBalance / remainingDaysCount : 0;
  const projectedForeseeableBalance = foreseeableBalance + projectedIncome;
  const projectedDailyAllowance =
    remainingDaysCount > 0 ? projectedForeseeableBalance / remainingDaysCount : 0;

  const daysRemainingFromDate = new Map<string, number>();
  for (let i = 0; i < rawDays.length; i++) {
    const d = rawDays[i];
    if (d.date >= referenceDate) {
      daysRemainingFromDate.set(d.date, rawDays.length - i);
    }
  }

  const futureIncomeDailyBoosts: Array<{ date: string; dailyBoost: number }> = [];
  futureIncomeByDate.forEach((amount, date) => {
    const daysRemaining = daysRemainingFromDate.get(date) ?? 1;
    const dailyBoost = daysRemaining > 0 ? amount / daysRemaining : 0;
    futureIncomeDailyBoosts.push({ date, dailyBoost });
  });

  const cycleDays: DailyAllocation[] = rawDays.map((day) => {
    const dayCommitment = commitmentByDate.get(day.date) ?? 0;
    const baseActualQuota = day.isPast ? day.spentAmount : Math.floor(dailyAllowance);

    let projectedQuota = baseActualQuota;
    if (day.isFuture) {
      let totalBoost = 0;
      for (const boost of futureIncomeDailyBoosts) {
        if (day.date >= boost.date) {
          totalBoost += boost.dailyBoost;
        }
      }
      projectedQuota = Math.floor(dailyAllowance + totalBoost);
    }

    return {
      date: day.date,
      dayNumber: day.dayNumber,
      dayOfWeek: day.dayOfWeek,
      isPast: day.isPast,
      isToday: day.isToday,
      isFuture: day.isFuture,
      spentAmount: day.spentAmount,
      incomeAmount: day.incomeAmount,
      actualQuota: baseActualQuota,
      projectedQuota,
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
    projectedIncome,
    projectedForeseeableBalance,
    projectedDailyAllowance,
  };
}
