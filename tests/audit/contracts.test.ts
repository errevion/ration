import {
  CreateDistributionRecordSchema,
  CreateRationItemSchema,
  DistributionRecordSchema,
  LocaleSchema,
  RationItemSchema,
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
});
