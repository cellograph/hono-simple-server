import { ErrorResponseSchema } from "@/features/shared/models/error-respone.schema";
import { NotFoundResponseSchema } from "@/features/shared/responses/not-found.response";
import { Env } from "@/types";
import { createRoute, z } from "@hono/zod-openapi";
import { Context } from "hono";

const entityType = "current-session";

const ResponseSchema = z.object({
  success: z.boolean(),
  data: z.any(),
  message: z.string(),
});

export const currentSessionRoute = createRoute({
  method: "get",
  path: `/authentication/${entityType}`,
  description: "Current Session",
  security: [
    {
      AuthorizationBearer: [],
    },
  ],
  request: {
    headers: z.object({
      authorization: z.string().optional(),
    }),
  },
  responses: {
    200: {
      content: {
        "application/vnd.api+json": {
          schema: z.object({}),
        },
      },
      description: "Signin Successful",
    },
    400: {
      content: {
        "application/vnd.api+json": {
          schema: z.any(),
        },
      },
      description: "Bad Request",
    },
    401: {
      content: {
        "application/vnd.api+json": {
          schema: z.any(),
        },
      },
      description: "Unauthorized",
    },
    404: {
      content: {
        "application/vnd.api+json": {
          schema: NotFoundResponseSchema,
        },
      },
      description: "Not Found",
    },
  },
  tags: ["Authentication"],
});

export const currentSessionHandler = async (
  c: Context<Env, typeof entityType>
) => {
  const session = c.get("session");
  const account = c.get("user");
  console.log(account);
  if (account) {
    return c.json<z.infer<typeof ResponseSchema>, 200>({
      data: { account, session },
      success: true,
      message: "Successfull",
    });
  } else {
    return c.json<z.infer<typeof ResponseSchema>, 400>({
      data: null,
      success: true,
      message: "Unauthorized",
    });
  }
};
