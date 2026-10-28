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
  startDay: z.number().int().min(1).max(31).default(1),
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

export const UpdateCycleSettingsSchema = z.object({
  currency: z.string().min(1).max(8),
  startDay: z.number().int().min(1).max(31),
});
export type UpdateCycleSettingsDto = z.infer<typeof UpdateCycleSettingsSchema>;

export const AccountTypeSchema = z.enum(["cash", "bank", "wallet", "savings", "other"]);
export type AccountType = z.infer<typeof AccountTypeSchema>;

export const AccountSchema = z.object({
  id: EntityIdSchema,
  name: z.string().min(1).max(64),
  type: AccountTypeSchema.default("bank"),
  balance: z.number().default(0),
  currency: z.string().min(1).max(8).default("$"),
  includeInCalendar: z.boolean().default(true),
  isPrimary: z.boolean().default(false),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Account = z.infer<typeof AccountSchema>;

export const CreateAccountSchema = AccountSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  id: EntityIdSchema.optional(),
  currency: z.string().min(1).max(8).default("$"),
});
export type CreateAccountDto = z.infer<typeof CreateAccountSchema>;

export const UpdateAccountSchema = CreateAccountSchema.partial();
export type UpdateAccountDto = z.infer<typeof UpdateAccountSchema>;

export const TransactionTypeSchema = z.enum(["spend", "income"]);
export type TransactionType = z.infer<typeof TransactionTypeSchema>;

export const PlannedPaymentStatusSchema = z.enum(["pending", "completed", "cancelled"]);
export type PlannedPaymentStatus = z.infer<typeof PlannedPaymentStatusSchema>;

export const PlannedPaymentSchema = z.object({
  id: EntityIdSchema,
  name: z.string().min(1).max(128),
  amount: z.number().positive(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  type: TransactionTypeSchema.default("spend"),
  accountId: EntityIdSchema.optional(),
  status: PlannedPaymentStatusSchema.default("pending"),
  createdAt: z.string().datetime(),
});
export type PlannedPayment = z.infer<typeof PlannedPaymentSchema>;

export const CreatePlannedPaymentSchema = PlannedPaymentSchema.omit({
  id: true,
  createdAt: true,
}).extend({
  id: EntityIdSchema.optional(),
  type: TransactionTypeSchema.default("spend"),
  status: PlannedPaymentStatusSchema.default("pending"),
});
export type CreatePlannedPaymentDto = z.infer<typeof CreatePlannedPaymentSchema>;

export const LoanTypeSchema = z.enum(["borrow", "lend"]);
export type LoanType = z.infer<typeof LoanTypeSchema>;

export const LoanStatusSchema = z.enum(["active", "settled"]);
export type LoanStatus = z.infer<typeof LoanStatusSchema>;

export const LoanRecordSchema = z.object({
  id: EntityIdSchema,
  counterparty: z.string().min(1).max(128),
  type: LoanTypeSchema,
  amount: z.number().positive(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  accountId: EntityIdSchema.optional(),
  settledDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  status: LoanStatusSchema.default("active"),
  notes: z.string().max(256).optional(),
  createdAt: z.string().datetime(),
});
export type LoanRecord = z.infer<typeof LoanRecordSchema>;

export const CreateLoanRecordSchema = LoanRecordSchema.omit({
  id: true,
  createdAt: true,
}).extend({
  id: EntityIdSchema.optional(),
  status: LoanStatusSchema.default("active"),
});
export type CreateLoanRecordDto = z.infer<typeof CreateLoanRecordSchema>;

export const SpendTransactionSchema = z.object({
  id: EntityIdSchema,
  cycleId: EntityIdSchema,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  amount: z.number().positive(),
  type: TransactionTypeSchema.default("spend"),
  accountId: EntityIdSchema.optional(),
  notes: z.string().max(256).optional(),
  createdAt: z.string().datetime(),
});
export type SpendTransaction = z.infer<typeof SpendTransactionSchema>;

export const CreateSpendTransactionSchema = SpendTransactionSchema.omit({
  id: true,
  createdAt: true,
}).extend({
  id: EntityIdSchema.optional(),
  type: TransactionTypeSchema.default("spend"),
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
  incomeAmount: z.number().nonnegative().default(0),
  projectedQuota: z.number().nonnegative(),
  hasCommitment: z.boolean().default(false),
  commitmentAmount: z.number().nonnegative().default(0),
});
export type DailyAllocation = z.infer<typeof DailyAllocationSchema>;

export const BackupDataSchema = z.object({
  version: z.number().int(),
  exportedAt: z.string().datetime(),
  cycle: MoneyCycleSchema,
  accounts: z.array(AccountSchema),
  transactions: z.array(SpendTransactionSchema),
  plannedPayments: z.array(PlannedPaymentSchema),
  loans: z.array(LoanRecordSchema),
  referenceDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});
export type BackupData = z.infer<typeof BackupDataSchema>;
