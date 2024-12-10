import { z } from "zod";

export const AccountSchema = z.object({
  created_at: z.string().optional(),
  username: z.string().optional(),
  groups: z.array(z.string()).optional(),
  id: z.any(),
  profile: z
    .array(
      z.object({
        account: z.any(),
        age: z.number(),
        created_at: z.string(),
        date_of_birth: z.string(),
        first_name: z.string(),
        full_name: z.string(),
        gender: z.string(),
        id: z.any(),
        last_name: z.string(),
        updated_at: z.string(),
      })
    )
    .optional(),
  updated_at: z.string().optional(),
});

export const ProfileSchema = z.object({
  account: z.any().optional(),
  age: z.number().optional(),
  created_at: z.string().optional(),
  date_of_birth: z.string().optional(),
  first_name: z.string().optional(),
  full_name: z.string().optional(),
  gender: z.string().optional(),
  id: z.any().optional(),
  last_name: z.string().optional(),
  updated_at: z.string().optional(),
  badges: z.array(z.any()).optional(),
  connect_reasons: z.array(z.any()).optional(),
  usage_purposes: z.array(z.any()).optional(),
  onboarding_status: z.enum(["PENDING", "COMPLETE"]).optional(),
});

export const SpaceCategorySchema = z.object({
  space_type: z.any(),
  child_categories: z.array(z.any()).optional(),
  created_at: z.coerce.date().optional(),
  deleted_at: z.coerce.date().optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  name: z.string(),
  parent_category: z.any().optional(),
  slug: z.string(),
  updated_at: z.coerce.date().optional(),
});

export const SpaceSchema = z.object({
  space_type: z.any(),
  about: z.string().optional(),
  avatar: z.any().optional(),
  category: z.any(),
  created_at: z.coerce.date(),
  deleted_at: z.coerce.date().optional(),
  handler: z.string().optional(),
  languages: z.array(z.string()).optional(),
  locations: z.array(z.string()).optional(),
  name: z.string(),
  native_about: z.object({}).optional(),
  native_name: z.object({ bn: z.string().optional() }).optional(),
  ownership: z.enum(["Public", "Private"]),
  status: z.enum(["Active", "Deactive", "Archieve", "Banned"]),
  updated_at: z.coerce.date(),
  verification: z.enum([
    "Pending",
    "Verified",
    "Listed",
    "Processing",
    "Rejected",
    "Neutral",
  ]),
  visibility: z.enum(["Draft", "Private", "Public"]),
});

export const CreateSpaceSchema = z.object({
  name: z.string(),
  type: z.enum(["individual", "business"]),
  manager: z.string(),
  purpose: z.array(z.string()).optional(),
  category: z.string().optional(),
  interests: z.array(z.string()),
});
