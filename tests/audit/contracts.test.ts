import {
  AccountSchema,
  AccountTypeSchema,
  BackupDataSchema,
  CreateAccountSchema,
  CreateDistributionRecordSchema,
  CreateLoanRecordSchema,
  CreateMoneyCycleSchema,
  CreatePlannedPaymentSchema,
  CreateRationItemSchema,
  CreateSpendTransactionSchema,
  DailyAllocationSchema,
  DistributionRecordSchema,
  LoanRecordSchema,
  LoanStatusSchema,
  LoanTypeSchema,
  LocaleSchema,
  MoneyCycleSchema,
  PlannedPaymentSchema,
  PlannedPaymentStatusSchema,
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
      startDay: 25,
    };
    expect(UpdateCycleSettingsSchema.safeParse(validUpdateSettings).success).toBe(true);

    const invalidStartDay = {
      ...validUpdateSettings,
      startDay: 32,
    };
    expect(UpdateCycleSettingsSchema.safeParse(invalidStartDay).success).toBe(false);

    const negativeStartDay = {
      ...validUpdateSettings,
      startDay: 0,
    };
    expect(UpdateCycleSettingsSchema.safeParse(negativeStartDay).success).toBe(false);

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
  it("validates account schema and type restrictions", () => {
    const validAccount = {
      id: "a0000000-0000-0000-0000-000000000001",
      name: "Main Checking",
      type: "bank",
      balance: 5000000,
      currency: "Rp ",
      includeInCalendar: true,
      isPrimary: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    expect(AccountSchema.safeParse(validAccount).success).toBe(true);

    const validCreate = {
      name: "Cash Wallet",
      type: "cash",
      balance: 200000,
      currency: "Rp ",
      includeInCalendar: true,
      isPrimary: false,
    };
    expect(CreateAccountSchema.safeParse(validCreate).success).toBe(true);
    expect(AccountTypeSchema.safeParse("crypto").success).toBe(false);
  });

  it("validates planned payment schema", () => {
    const validPayment = {
      id: "b0000000-0000-0000-0000-000000000001",
      name: "Apartment Rent",
      amount: 3000000,
      dueDate: "2025-11-01",
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    expect(PlannedPaymentSchema.safeParse(validPayment).success).toBe(true);

    const validCreate = {
      name: "Gym Subscription",
      amount: 250000,
      dueDate: "2025-11-05",
    };
    expect(CreatePlannedPaymentSchema.safeParse(validCreate).success).toBe(true);
    expect(PlannedPaymentStatusSchema.safeParse("unknown").success).toBe(false);
  });

  it("validates loan record schema for borrow and lend", () => {
    const validBorrow = {
      id: "c0000000-0000-0000-0000-000000000001",
      counterparty: "Budi",
      type: "borrow",
      amount: 1000000,
      dueDate: "2025-11-10",
      status: "active",
      createdAt: new Date().toISOString(),
    };
    expect(LoanRecordSchema.safeParse(validBorrow).success).toBe(true);

    const validLend = {
      id: "c0000000-0000-0000-0000-000000000002",
      counterparty: "Sarah",
      type: "lend",
      amount: 500000,
      dueDate: "2025-11-05",
      status: "active",
      createdAt: new Date().toISOString(),
    };
    expect(LoanRecordSchema.safeParse(validLend).success).toBe(true);

    const validCreate = {
      counterparty: "Sarah",
      type: "lend",
      amount: 500000,
      dueDate: "2025-11-05",
    };
    expect(CreateLoanRecordSchema.safeParse(validCreate).success).toBe(true);
    expect(LoanTypeSchema.safeParse("invest").success).toBe(false);
    expect(LoanStatusSchema.safeParse("closed").success).toBe(false);
  });
  it("validates backup data schema", () => {
    const validBackup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      cycle: {
        id: "c0000000-0000-0000-0000-000000000001",
        name: "Cycle",
        startDate: "2025-10-01",
        endDate: "2025-10-31",
        startingBalance: 0,
        currency: "$",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      accounts: [],
      transactions: [],
      plannedPayments: [
        {
          id: "b0000000-0000-0000-0000-000000000001",
          name: "Payday Salary",
          amount: 5000000,
          dueDate: "2025-10-25",
          type: "income",
          status: "pending",
          createdAt: new Date().toISOString(),
        },
      ],
      loans: [],
    };
    expect(BackupDataSchema.safeParse(validBackup).success).toBe(true);
  });
});
