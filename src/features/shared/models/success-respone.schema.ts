import { z } from "@hono/zod-openapi";

export const SuccessResponseSchema = z.object({
  meta: z.object({}).optional().openapi({}), // https://jsonapi.org/format/#document-meta
  included: z.object({}).optional().openapi({}),
});

export const CollectionSuccessResponseSchema = z.object({
  data: z.any(),
  success: z.boolean(),
  message: z.string(),
  status: z.number().optional(),
  meta: z
    .object({
      timestamp: z.coerce.date().optional().default(new Date()).openapi({
        example: "2024-10-10T12:00:00Z",
      }),
      apiVersion: z.string().optional().openapi({
        example: "1.0.0",
      }),
    })
    .optional()
    .openapi({}),
});
