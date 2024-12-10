import { z } from "@hono/zod-openapi";

// Base Schema for Mobile
export const MobileSchema = z.object({
  id: z.string(),
  account: z.string().optional(), // record<account> ID
  country_code: z.string().regex(/^\d+$/, {
    message: "Country code must contain only numbers",
  }),
  created_at: z.string().datetime().optional(),
  deleted_at: z.string().datetime().optional(),
  formatted_number: z.string().optional(),
  is_primary: z.boolean().default(false),
  mobile: z.string().regex(/^\d+$/, {
    message: "Mobile number must contain only numbers",
  }),
  updated_at: z.string().datetime().optional(),
  verified_at: z.string().datetime().optional(),
});

// Type for Mobile record
export type Mobile = z.infer<typeof MobileSchema>;

// Schema for creating new mobile number
export const CreateMobileSchema = MobileSchema.omit({
  id: true,
  formatted_number: true,
  created_at: true,
  updated_at: true,
  deleted_at: true,
  verified_at: true,
});

// Type for creating new mobile
export type CreateMobile = z.infer<typeof CreateMobileSchema>;

// Schema for updating mobile number
export const UpdateMobileSchema = CreateMobileSchema.partial();

// Type for updating mobile
export type UpdateMobile = z.infer<typeof UpdateMobileSchema>;

// Response schemas
export const MobileResponseSchema = z.object({
  success: z.boolean(),
  data: MobileSchema.optional(),
  message: z.string(),
});

export const MobileListResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(MobileSchema),
  message: z.string(),
  meta: z.object({
    total: z.number(),
    page: z.number(),
    limit: z.number(),
  }),
});

// Query parameters schema for list endpoint
export const MobileQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  account: z.string().optional(),
  is_primary: z
    .string()
    .optional()
    .transform((val) => val === "true"),
  verified: z
    .string()
    .optional()
    .transform((val) => val === "true"),
});

// Verification schema
export const VerifyMobileSchema = z.object({
  code: z.string().length(6),
});

// Response types
export type MobileResponse = z.infer<typeof MobileResponseSchema>;
export type MobileListResponse = z.infer<typeof MobileListResponseSchema>;
export type MobileQuery = z.infer<typeof MobileQuerySchema>;
