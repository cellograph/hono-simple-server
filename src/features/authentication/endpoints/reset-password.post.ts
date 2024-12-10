import { ErrorResponseSchema } from "@/features/shared/models/error-respone.schema";
import { NotFoundResponseSchema } from "@/features/shared/responses/not-found.response";
import { Env } from "@/types";
import { initDb } from "@/utils/surreal";
import { createRoute, z } from "@hono/zod-openapi";
import { Context } from "hono";
import { RecordId } from "surrealdb";

const entityType = "reset-password";

const RequestSchema = z
  .object({
    token: z.string(),
    password: z.string().min(8),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

const ResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export const resetPasswordRoute = createRoute({
  method: "post",
  path: `/authentication/${entityType}`,
  description: "Reset Password with Token",
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
      description: "Password Reset Successfully",
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
      description: "Invalid Token",
    },
  },
  tags: ["Authentication"],
});

export const resetPasswordHandler = async (c: Context<Env>) => {
  try {
    const { token, password } = await c.req.json();
    const db = await initDb(c, c.env.NS, c.env.DB);

    // Find reset token record
    const [resetRecord]: any = await db.query(`SELECT * FROM $id;`, {
      id: new RecordId("password_reset", token),
    });

    console.log(resetRecord);

    if (resetRecord?.[0]?.used) {
      throw new Error("Reset token already used");
    }

    if (!resetRecord?.[0]) {
      const requestUrl = new URL(c.req.url);
      return c.json<z.infer<typeof NotFoundResponseSchema>, 404>({
        errors: [
          {
            status: 404,
            code: "NOT_FOUND",
            title: "404 Not Found",
            details: "The reset token is invalid or expired",
            links: {
              about: `https://${requestUrl.host}/docs/errors/NOT_FOUND`,
              type: `https://${requestUrl.host}/docs/errors`,
            },
          },
        ],
      });
    }

    // Update the user's password
    const updatedUser = await db.query(
      `UPDATE $account SET 
        account_hash = crypto::argon2::generate($password),
        updated_at = time::now()`,
      {
        account: resetRecord[0].account,
        password,
      }
    );

    console.log(updatedUser);

    // Invalidate the reset token
    await db.query(
      `UPDATE $id SET 
        used = true,
        updated_at = time::now()`,
      {
        id: new RecordId("password_reset", token),
      }
    );

    return c.json<z.infer<typeof ResponseSchema>, 200>({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return c.json(
      {
        errors: [
          {
            status: 400,
            code: "BAD_REQUEST",
            title: "Failed to reset password",
            details: error.message,
            source: {
              pointer: "/data/attributes/reset-password",
            },
          },
        ],
      },
      400
    );
  }
};
