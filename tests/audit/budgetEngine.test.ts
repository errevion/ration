import type { MoneyCycle, SpendTransaction } from "@ration/types";
import { describe, expect, it } from "vitest";
import {
  computeCycleBudget,
  getMondayFirstDayOfWeek,
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
});
