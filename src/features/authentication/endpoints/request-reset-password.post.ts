import { ErrorResponseSchema } from "@/features/shared/models/error-respone.schema";
import { NotFoundResponseSchema } from "@/features/shared/responses/not-found.response";
import { Env } from "@/types";
import { initDb } from "@/utils/surreal";
import { createRoute, z } from "@hono/zod-openapi";
import { Context } from "hono";
import { generateOTP } from "@/utils/generate-otp";
import { MobileSchema } from "@/types/mobile.types";

const entityType = "request-reset-password";

const RequestSchema = z.object({
  countryCode: z.string(),
  mobile: z.string(),
});

const ResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.any(),
});

export const requestResetPasswordRoute = createRoute({
  method: "post",
  path: `/authentication/${entityType}`,
  description: "Request Password Reset Token",
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
      description: "Reset Token Sent Successfully",
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
      description: "User Not Found",
    },
  },
  tags: ["Authentication"],
});

export const requestResetPasswordHandler = async (c: Context<Env>) => {
  try {
    const { countryCode, mobile } = await c.req.json();
    const db = await initDb(c, c.env.NS, c.env.DB);
    console.log(db);
    // Find user by email
    const [mobileExist]: any = await db.query(
      `SELECT * FROM mobile WHERE country_code = $countryCode AND mobile = $mobile FETCH account;`,
      { countryCode, mobile }
    );

    console.log(mobileExist);

    if (!mobileExist) {
      const requestUrl = new URL(c.req.url);
      return c.json<z.infer<typeof NotFoundResponseSchema>, 404>({
        errors: [
          {
            status: 404,
            code: "NOT_FOUND",
            title: "404 Not Found",
            details: "The resource does not exist",
            links: {
              about: `https://${requestUrl.host}/docs/errors/NOT_FOUND`,
              type: `https://${requestUrl.host}/docs/errors`,
            },
          },
        ],
      });
    }

    if (mobileExist?.[0]?.account?.status !== "ACTIVE") {
      throw new Error("Something went wrong.");
    }

    // Generate reset token
    const resetToken = generateOTP();

    // Store reset token
    const [result] = await db.query(
      `CREATE password_reset SET 
        account = $account,
        code = $code,
        expires_at = time::now() + 10m,
        used = false,
        mobile = $mobile`,
      {
        account: mobileExist?.[0].account?.id,
        code: resetToken,
        mobile: mobileExist[0].id,
      }
    );

    // TODO: Send email with reset token
    // This should be implemented based on your email service
    // await sendResetPasswordEmail(email, resetToken);
    console.log(mobileExist, resetToken, result);
    return c.json<z.infer<typeof ResponseSchema>, 200>({
      success: true,
      message: "We've sent you an OTP to reset your password",
      data: result?.[0]?.id,
    });
  } catch (error) {
    console.error("Request reset password error:", error);
    return c.json(
      {
        errors: [
          {
            status: 400,
            success: false,
            code: "BAD_REQUEST",
            title: "Failed to process reset password request",
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
