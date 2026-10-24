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
