import type {
  Account,
  LoanRecord,
  MoneyCycle,
  PlannedPayment,
  SpendTransaction,
} from "@ration/types";
import { describe, expect, it } from "vitest";
import {
  computeCycleBudget,
  computeCycleRange,
  getMondayFirstDayOfWeek,
  getNextRecurrenceDate,
  parseIsoDate,
} from "../../apps/web/src/utils/budgetEngine.js";
import { formatCurrency, formatMetricAmount } from "../../apps/web/src/utils/formatters.js";

describe("Domain Audit: Budget Engine Calculation", () => {
  const mockCycle: MoneyCycle = {
    id: "e0000000-0000-0000-0000-000000000001",
    name: "Standard October",
    startDate: "2025-10-01",
    endDate: "2025-10-31",
    startingBalance: 310,
    currency: "$",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it("calculates even daily spend with no transactions", () => {
    const result = computeCycleBudget(mockCycle, [], "2025-10-01");
    expect(result.remainingDaysCount).toBe(31);
    expect(result.remainingBalance).toBe(310);
    expect(result.dailyAllowance).toBe(10);
    expect(result.totalSpent).toBe(0);
    expect(result.cycleDays).toHaveLength(31);
    expect(result.cycleDays[0].isToday).toBe(true);
    expect(result.cycleDays[0].projectedQuota).toBe(10);
  });

  it("recalibrates quota when user spends money", () => {
    const tx: SpendTransaction = {
      id: "f0000000-0000-0000-0000-000000000001",
      cycleId: mockCycle.id,
      date: "2025-10-01",
      amount: 40,
      createdAt: new Date().toISOString(),
    };

    const result = computeCycleBudget(mockCycle, [tx], "2025-10-02");
    expect(result.totalSpentPast).toBe(40);
    expect(result.remainingBalance).toBe(270);
    expect(result.remainingDaysCount).toBe(30);
    expect(result.dailyAllowance).toBe(9);
    expect(result.cycleDays[0].isPast).toBe(true);
    expect(result.cycleDays[0].spentAmount).toBe(40);
    expect(result.cycleDays[1].isToday).toBe(true);
    expect(result.cycleDays[1].projectedQuota).toBe(9);
  });

  it("recalibrates quota upwards when user adds income", () => {
    const incomeTx: SpendTransaction = {
      id: "f0000000-0000-0000-0000-000000000002",
      cycleId: mockCycle.id,
      date: "2025-10-01",
      amount: 90,
      type: "income",
      createdAt: new Date().toISOString(),
    };

    const result = computeCycleBudget(mockCycle, [incomeTx], "2025-10-02");
    expect(result.totalIncome).toBe(90);
    expect(result.totalSpent).toBe(0);
    expect(result.remainingBalance).toBe(400);
    expect(result.remainingDaysCount).toBe(30);
    expect(result.dailyAllowance).toBeCloseTo(13.33, 2);
    expect(result.cycleDays[0].incomeAmount).toBe(90);
    expect(result.cycleDays[1].projectedQuota).toBe(13);
  });

  it("handles empty days before Monday", () => {
    const wednesdayDate = parseIsoDate("2025-10-01");
    expect(getMondayFirstDayOfWeek(wednesdayDate)).toBe(2);
    const result = computeCycleBudget(mockCycle, [], "2025-10-01");
    expect(result.leadingEmptyDays).toBe(2);
  });

  it("formats metric amounts into compact k, m, and b notation", () => {
    expect(formatMetricAmount(0)).toBe("0");
    expect(formatMetricAmount(500)).toBe("500");
    expect(formatMetricAmount(1000)).toBe("1k");
    expect(formatMetricAmount(1500)).toBe("1.5k");
    expect(formatMetricAmount(250000)).toBe("250k");
    expect(formatMetricAmount(2000000)).toBe("2m");
    expect(formatMetricAmount(2500000)).toBe("2.5m");
    expect(formatMetricAmount(15000000)).toBe("15m");
    expect(formatMetricAmount(1000000000)).toBe("1b");
  });

  it("formats full currency strings with locale separators", () => {
    expect(formatCurrency(2000000, "Rp ")).toBe("Rp 2,000,000");
    expect(formatCurrency(900, "$")).toBe("$900");
  });
  it("calculates safe disposable balance by quarantining planned payments and debts", () => {
    const accounts: Account[] = [
      {
        id: "a0000000-0000-0000-0000-000000000001",
        name: "Checking",
        type: "bank",
        balance: 6000000,
        currency: "Rp ",
        includeInCalendar: true,
        isPrimary: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "a0000000-0000-0000-0000-000000000002",
        name: "Emergency Vault",
        type: "savings",
        balance: 20000000,
        currency: "Rp ",
        includeInCalendar: false,
        isPrimary: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const plannedPayments: PlannedPayment[] = [
      {
        id: "b0000000-0000-0000-0000-000000000001",
        name: "Apartment Rent",
        amount: 3000000,
        dueDate: "2025-10-15",
        status: "pending",
        createdAt: new Date().toISOString(),
      },
    ];

    const loans: LoanRecord[] = [
      {
        id: "c0000000-0000-0000-0000-000000000001",
        counterparty: "Budi",
        type: "borrow",
        amount: 500000,
        dueDate: "2025-10-20",
        status: "active",
        createdAt: new Date().toISOString(),
      },
    ];

    const result = computeCycleBudget(mockCycle, [], "2025-10-01", {
      accounts,
      plannedPayments,
      loans,
    });

    expect(result.actualBalance).toBe(6000000);
    expect(result.quarantinedAmount).toBe(3500000);
    expect(result.foreseeableBalance).toBe(2500000);
    expect(result.dailyAllowance).toBeCloseTo(2500000 / 31, 2);

    const rentDay = result.cycleDays.find((d) => d.date === "2025-10-15");
    expect(rentDay?.hasCommitment).toBe(true);
    expect(rentDay?.commitmentAmount).toBe(3000000);

    const normalDay = result.cycleDays.find((d) => d.date === "2025-10-02");
    expect(normalDay?.hasCommitment).toBe(false);
  });
  it("does not quarantine planned income but flags visual milestone on calendar", () => {
    const plannedPayments: PlannedPayment[] = [
      {
        id: "b0000000-0000-0000-0000-000000000002",
        name: "Payday Salary",
        amount: 5000000,
        dueDate: "2025-10-25",
        type: "income",
        status: "pending",
        createdAt: new Date().toISOString(),
      },
    ];

    const result = computeCycleBudget(mockCycle, [], "2025-10-01", {
      plannedPayments,
    });

    expect(result.quarantinedAmount).toBe(0);
    expect(result.foreseeableBalance).toBe(310);
    expect(result.projectedIncome).toBe(5000000);
    expect(result.projectedDailyAllowance).toBeCloseTo((310 + 5000000) / 31, 2);
    const payday = result.cycleDays.find((d) => d.date === "2025-10-25");
    expect(payday?.hasCommitment).toBe(true);
  });

  it("computes standard calendar month cycle range with cycleOffset", () => {
    const fromDate = new Date(2026, 9, 15);
    const rangeCurrent = computeCycleRange(1, fromDate, 0);
    expect(rangeCurrent.startDate).toBe("2026-10-01");
    expect(rangeCurrent.endDate).toBe("2026-10-31");

    const rangeNext = computeCycleRange(1, fromDate, 1);
    expect(rangeNext.startDate).toBe("2026-11-01");
    expect(rangeNext.endDate).toBe("2026-11-30");

    const rangePrev = computeCycleRange(1, fromDate, -1);
    expect(rangePrev.startDate).toBe("2026-09-01");
    expect(rangePrev.endDate).toBe("2026-09-30");
  });

  it("computes payday cycle range when startDay is 25 with cycleOffset", () => {
    const beforePayday = new Date(2026, 9, 10);
    const rangeBefore = computeCycleRange(25, beforePayday, 0);
    expect(rangeBefore.startDate).toBe("2026-09-25");
    expect(rangeBefore.endDate).toBe("2026-10-24");

    const rangeNext = computeCycleRange(25, beforePayday, 1);
    expect(rangeNext.startDate).toBe("2026-10-25");
    expect(rangeNext.endDate).toBe("2026-11-24");

    const rangePrev = computeCycleRange(25, beforePayday, -1);
    expect(rangePrev.startDate).toBe("2026-08-25");
    expect(rangePrev.endDate).toBe("2026-09-24");
  });

  it("clamps start and end days for shorter months correctly", () => {
    const febDate = new Date(2026, 1, 15);
    const range = computeCycleRange(31, febDate);
    expect(range.startDate).toBe("2026-01-31");
    expect(range.endDate).toBe("2026-02-28");
  });

  it("calculates next recurrence dates correctly for weekly and monthly", () => {
    expect(getNextRecurrenceDate("2026-10-05", "weekly")).toBe("2026-10-12");
    expect(getNextRecurrenceDate("2026-10-28", "weekly")).toBe("2026-11-04");
    expect(getNextRecurrenceDate("2026-10-15", "monthly")).toBe("2026-11-15");
    expect(getNextRecurrenceDate("2026-01-31", "monthly")).toBe("2026-02-28");
  });

  it("calculates timeline-aware projected quotas without inflating landed today", () => {
    const plannedPayments: PlannedPayment[] = [
      {
        id: "b0000000-0000-0000-0000-000000000003",
        name: "Freelance Payment",
        amount: 300,
        dueDate: "2025-10-20",
        type: "income",
        status: "pending",
        createdAt: new Date().toISOString(),
      },
    ];

    // Reference date is 2025-10-10 (22 days remaining: 10th to 31st)
    // Starting balance 220 -> baseline quota = 220 / 22 = 10 / day
    // On 2025-10-20, income of 300 arrives. Remaining days from 20th to 31st = 12 days.
    // Boost = 300 / 12 = 25 / day.
    const customCycle: MoneyCycle = {
      ...mockCycle,
      startingBalance: 220,
    };
    const result = computeCycleBudget(customCycle, [], "2025-10-10", { plannedPayments });

    const dayBefore = result.cycleDays.find((d) => d.date === "2025-10-15");
    expect(dayBefore?.actualQuota).toBe(10);
    expect(dayBefore?.projectedQuota).toBe(10);

    const dayAfter = result.cycleDays.find((d) => d.date === "2025-10-25");
    expect(dayAfter?.actualQuota).toBe(10);
    expect(dayAfter?.projectedQuota).toBe(35); // 10 + 25

    // If landed on the day (referenceDate === "2025-10-20") but payment is still pending:
    const landedResult = computeCycleBudget(customCycle, [], "2025-10-20", { plannedPayments });
    const landedDay = landedResult.cycleDays.find((d) => d.date === "2025-10-20");
    // Landed unsettled day must display normal unsettled calculation (not inflated)
    expect(landedDay?.projectedQuota).toBe(Math.floor(customCycle.startingBalance / 12));
  });
});
