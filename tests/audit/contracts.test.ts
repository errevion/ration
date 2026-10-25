import {
  CreateDistributionRecordSchema,
  CreateMoneyCycleSchema,
  CreateRationItemSchema,
  CreateSpendTransactionSchema,
  DailyAllocationSchema,
  DistributionRecordSchema,
  LocaleSchema,
  MoneyCycleSchema,
  RationItemSchema,
  SpendTransactionSchema,
  UpdateCycleSettingsSchema,
  UserRoleSchema,
} from "@ration/types";
import { describe, expect, it } from "vitest";

describe("Domain Audit: Contract & Schema Parity", () => {
  it("restricts locale strictly to en and id", () => {
    expect(LocaleSchema.safeParse("en").success).toBe(true);
    expect(LocaleSchema.safeParse("id").success).toBe(true);
    expect(LocaleSchema.safeParse("fr").success).toBe(false);
    expect(LocaleSchema.safeParse("").success).toBe(false);
  });

  it("restricts user roles strictly to admin, manager, employee", () => {
    expect(UserRoleSchema.safeParse("admin").success).toBe(true);
    expect(UserRoleSchema.safeParse("manager").success).toBe(true);
    expect(UserRoleSchema.safeParse("employee").success).toBe(true);
    expect(UserRoleSchema.safeParse("superadmin").success).toBe(false);
    expect(UserRoleSchema.safeParse("guest").success).toBe(false);
  });

  it("validates valid ration items and rejects negative quantities", () => {
    const validItem = {
      id: "a0000000-0000-0000-0000-000000000001",
      name: "Rice 5kg",
      unit: "pack",
      quotaPerPeriod: 2,
      remainingStock: 50,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    expect(RationItemSchema.safeParse(validItem).success).toBe(true);

    const validCreateDto = {
      name: "Rice 5kg",
      unit: "pack",
      quotaPerPeriod: 2,
      remainingStock: 50,
      isActive: true,
    };
    expect(CreateRationItemSchema.safeParse(validCreateDto).success).toBe(true);

    const negativeStock = {
      ...validItem,
      remainingStock: -1,
    };
    expect(RationItemSchema.safeParse(negativeStock).success).toBe(false);

    const emptyName = {
      ...validItem,
      name: "",
    };
    expect(RationItemSchema.safeParse(emptyName).success).toBe(false);
  });

  it("validates distribution creation dto", () => {
    const validDto = {
      itemId: "a0000000-0000-0000-0000-000000000001",
      recipientId: "RCP-10023",
      quantity: 1,
      notes: "Standard monthly quota",
    };
    expect(CreateDistributionRecordSchema.safeParse(validDto).success).toBe(true);

    const fullRecord = {
      id: "b0000000-0000-0000-0000-000000000001",
      itemId: "a0000000-0000-0000-0000-000000000001",
      recipientId: "RCP-10023",
      quantity: 1,
      distributedAt: new Date().toISOString(),
      notes: "Standard monthly quota",
    };
    expect(DistributionRecordSchema.safeParse(fullRecord).success).toBe(true);

    const zeroQuantity = {
      ...validDto,
      quantity: 0,
    };
    expect(CreateDistributionRecordSchema.safeParse(zeroQuantity).success).toBe(false);

    const invalidUuid = {
      ...validDto,
      itemId: "not-a-uuid",
    };
    expect(CreateDistributionRecordSchema.safeParse(invalidUuid).success).toBe(false);
  });

  it("validates money cycle schema and rejects invalid dates or balances", () => {
    const validCycle = {
      id: "c0000000-0000-0000-0000-000000000001",
      name: "October Pay Period",
      startDate: "2025-10-25",
      endDate: "2025-11-24",
      startingBalance: 1200,
      currency: "$",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    expect(MoneyCycleSchema.safeParse(validCycle).success).toBe(true);

    const validCreate = {
      name: "October Pay Period",
      startDate: "2025-10-25",
      endDate: "2025-11-24",
      startingBalance: 1200,
      currency: "$",
    };
    expect(CreateMoneyCycleSchema.safeParse(validCreate).success).toBe(true);

    const invalidDate = {
      ...validCycle,
      startDate: "25-10-2025",
    };
    expect(MoneyCycleSchema.safeParse(invalidDate).success).toBe(false);

    const negativeBalance = {
      ...validCycle,
      startingBalance: -50,
    };
    expect(MoneyCycleSchema.safeParse(negativeBalance).success).toBe(false);

    const validUpdateSettings = {
      currency: "Rp ",
      startDate: "2025-10-25",
      endDate: "2025-11-24",
    };
    expect(UpdateCycleSettingsSchema.safeParse(validUpdateSettings).success).toBe(true);

    const invalidSettingsDate = {
      ...validUpdateSettings,
      startDate: "invalid-date",
    };
    expect(UpdateCycleSettingsSchema.safeParse(invalidSettingsDate).success).toBe(false);

    const emptyCurrency = {
      ...validUpdateSettings,
      currency: "",
    };
    expect(UpdateCycleSettingsSchema.safeParse(emptyCurrency).success).toBe(false);
  });

  it("validates spend transaction schema and rejects non-positive amounts", () => {
    const validSpend = {
      id: "d0000000-0000-0000-0000-000000000001",
      cycleId: "c0000000-0000-0000-0000-000000000001",
      date: "2025-10-26",
      amount: 42.5,
      notes: "Groceries",
      createdAt: new Date().toISOString(),
    };
    expect(SpendTransactionSchema.safeParse(validSpend).success).toBe(true);

    const validCreate = {
      cycleId: "c0000000-0000-0000-0000-000000000001",
      date: "2025-10-26",
      amount: 42.5,
    };
    expect(CreateSpendTransactionSchema.safeParse(validCreate).success).toBe(true);

    const validIncome = {
      ...validSpend,
      type: "income",
      notes: "Freelance top up",
    };
    const parsedIncome = SpendTransactionSchema.safeParse(validIncome);
    expect(parsedIncome.success).toBe(true);
    if (parsedIncome.success) {
      expect(parsedIncome.data.type).toBe("income");
    }

    const invalidType = {
      ...validSpend,
      type: "transfer",
    };
    expect(SpendTransactionSchema.safeParse(invalidType).success).toBe(false);

    const zeroSpend = {
      ...validSpend,
      amount: 0,
    };
    expect(SpendTransactionSchema.safeParse(zeroSpend).success).toBe(false);
  });

  it("validates daily allocation schema", () => {
    const validDay = {
      date: "2025-10-28",
      dayNumber: 28,
      dayOfWeek: 1,
      isPast: false,
      isToday: true,
      isFuture: false,
      spentAmount: 0,
      projectedQuota: 35.5,
    };
    expect(DailyAllocationSchema.safeParse(validDay).success).toBe(true);
  });
});
