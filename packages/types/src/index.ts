import { z } from "zod";

export const LocaleSchema = z.enum(["en", "id"]);
export type Locale = z.infer<typeof LocaleSchema>;

export const UserRoleSchema = z.enum(["admin", "manager", "employee"]);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const EntityIdSchema = z.string().uuid();

export const RationItemSchema = z.object({
  id: EntityIdSchema,
  name: z.string().min(1).max(128),
  unit: z.string().min(1).max(32),
  quotaPerPeriod: z.number().nonnegative(),
  remainingStock: z.number().nonnegative(),
  isActive: z.boolean().default(true),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type RationItem = z.infer<typeof RationItemSchema>;

export const CreateRationItemSchema = RationItemSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  id: EntityIdSchema.optional(),
});
export type CreateRationItemDto = z.infer<typeof CreateRationItemSchema>;

export const UpdateRationItemSchema = CreateRationItemSchema.partial();
export type UpdateRationItemDto = z.infer<typeof UpdateRationItemSchema>;

export const DistributionRecordSchema = z.object({
  id: EntityIdSchema,
  itemId: EntityIdSchema,
  recipientId: z.string().min(1).max(64),
  quantity: z.number().positive(),
  distributedAt: z.string().datetime(),
  notes: z.string().max(256).optional(),
});
export type DistributionRecord = z.infer<typeof DistributionRecordSchema>;

export const CreateDistributionRecordSchema = DistributionRecordSchema.omit({
  id: true,
  distributedAt: true,
}).extend({
  id: EntityIdSchema.optional(),
});
export type CreateDistributionRecordDto = z.infer<typeof CreateDistributionRecordSchema>;

export const MoneyCycleSchema = z.object({
  id: EntityIdSchema,
  name: z.string().min(1).max(128),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startingBalance: z.number().nonnegative(),
  currency: z.string().min(1).max(8).default("$"),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type MoneyCycle = z.infer<typeof MoneyCycleSchema>;

export const CreateMoneyCycleSchema = MoneyCycleSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  id: EntityIdSchema.optional(),
  currency: z.string().min(1).max(8).default("$"),
});
export type CreateMoneyCycleDto = z.infer<typeof CreateMoneyCycleSchema>;

export const SpendTransactionSchema = z.object({
  id: EntityIdSchema,
  cycleId: EntityIdSchema,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  amount: z.number().positive(),
  notes: z.string().max(256).optional(),
  createdAt: z.string().datetime(),
});
export type SpendTransaction = z.infer<typeof SpendTransactionSchema>;

export const CreateSpendTransactionSchema = SpendTransactionSchema.omit({
  id: true,
  createdAt: true,
}).extend({
  id: EntityIdSchema.optional(),
});
export type CreateSpendTransactionDto = z.infer<typeof CreateSpendTransactionSchema>;

export const DailyAllocationSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dayNumber: z.number().int().min(1).max(31),
  dayOfWeek: z.number().int().min(0).max(6),
  isPast: z.boolean(),
  isToday: z.boolean(),
  isFuture: z.boolean(),
  spentAmount: z.number().nonnegative(),
  projectedQuota: z.number().nonnegative(),
});
export type DailyAllocation = z.infer<typeof DailyAllocationSchema>;
