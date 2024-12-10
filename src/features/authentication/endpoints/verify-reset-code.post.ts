import { ErrorResponseSchema } from "@/features/shared/models/error-respone.schema";
import { NotFoundResponseSchema } from "@/features/shared/responses/not-found.response";
import { Env } from "@/types";
import { initDb } from "@/utils/surreal";
import { createRoute, z } from "@hono/zod-openapi";
import { Context } from "hono";
import { RecordId } from "surrealdb";

const entityType = "verify-reset-code";

const RequestSchema = z.object({
  code: z.string(),
  token: z.string(),
});

const ResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  token: z.string(), // We'll return a token to be used in the password change step
});

export const verifyResetCodeRoute = createRoute({
  method: "post",
  path: `/authentication/${entityType}`,
  description: "Verify Reset Password Code",
  request: {
    body: {
      content: {
        "application/json": {
          schema: RequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/vnd.api+json": {
          schema: ResponseSchema,
        },
      },
      description: "Code Verified Successfully",
    },
    400: {
      content: {
        "application/vnd.api+json": {
          schema: ErrorResponseSchema,
        },
      },
      description: "Bad Request",
    },
    404: {
      content: {
        "application/vnd.api+json": {
          schema: NotFoundResponseSchema,
        },
      },
      description: "Invalid Code",
    },
  },
  tags: ["Authentication"],
});

export const verifyResetCodeHandler = async (c: Context<Env>) => {
  try {
    const { code, token } = await c.req.json();
    const db = await initDb(c, c.env.NS, c.env.DB);

    // Find reset token record
    const [resetRecord]: any = await db.query(`SELECT * FROM $id;`, {
      id: new RecordId("password_reset", token),
    });

    console.log("resetRecord", resetRecord);

    if (!resetRecord?.[0]) {
      const requestUrl = new URL(c.req.url);
      return c.json<z.infer<typeof NotFoundResponseSchema>, 404>({
        errors: [
          {
            status: 404,
            code: "NOT_FOUND",
            title: "404 Not Found",
            details: "The reset code is invalid or expired",
            links: {
              about: `https://${requestUrl.host}/docs/errors/NOT_FOUND`,
              type: `https://${requestUrl.host}/docs/errors`,
            },
          },
        ],
      });
    }

    const isValidCode = resetRecord[0].code === code;

    if (!isValidCode) {
      return c.json<z.infer<typeof ErrorResponseSchema>, 400>({
        errors: [
          {
            status: 400,
            code: "INVALID_CODE",
            title: "Invalid Code",
            details: "The code is invalid",
          },
        ],
      });
    }

    return c.json<z.infer<typeof ResponseSchema>, 200>({
      success: true,
      message: "Code verified successfully",
      token,
    });
  } catch (error) {
    console.error("Verify reset code error:", error);
    return c.json(
      {
        errors: [
          {
            status: 400,
            success: false,
            code: "BAD_REQUEST",
            title: "Failed to verify code",
            details: error.message,
            source: {
              pointer: "/data/attributes/verify-reset-code",
            },
          },
        ],
      },
      400
    );
  }
};
