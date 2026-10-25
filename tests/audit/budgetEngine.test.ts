import type { MoneyCycle, SpendTransaction } from "@ration/types";
import { describe, expect, it } from "vitest";
import {
  computeCycleBudget,
  getMondayFirstDayOfWeek,
  parseIsoDate,
} from "../../apps/web/src/utils/budgetEngine.js";

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

  it("handles empty days before Monday", () => {
    const wednesdayDate = parseIsoDate("2025-10-01");
    expect(getMondayFirstDayOfWeek(wednesdayDate)).toBe(2);
    const result = computeCycleBudget(mockCycle, [], "2025-10-01");
    expect(result.leadingEmptyDays).toBe(2);
  });
});
