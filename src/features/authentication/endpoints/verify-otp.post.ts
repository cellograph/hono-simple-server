import { ErrorResponseSchema } from "@/features/shared/models/error-respone.schema";
import { NotFoundResponseSchema } from "@/features/shared/responses/not-found.response";
import { Env } from "@/types";
import { generateOTP } from "@/utils/generate-otp";
import { initDb } from "@/utils/surreal";
import { createRoute, z } from "@hono/zod-openapi";
import { Context } from "hono";
import { RecordId, surql } from "surrealdb";
import { addMinutes, isAfter, subMinutes } from "date-fns";
import { createAccessToken } from "@/utils/jwt";

const entityType = "signin";

const VerifyOTPSchema = z.object({
  code: z.string().openapi({ example: "880125" }),
  token: z.string().openapi({ example: "jhsdfhkjsdfhs" }),
});

const ResponseSchema = z.object({
  success: z.boolean(),
  data: z.any(),
  message: z.string(),
});

interface RequestValidationTargets {
  out: {
    json: z.infer<typeof VerifyOTPSchema>;
  };
}

export const verifyOtpRoute = createRoute({
  method: "post",
  path: "/authentication/verify-account",
  description: "Verify OTP",
  request: {
    body: {
      content: {
        "application/vnd.api+json": {
          schema: VerifyOTPSchema,
        },
      },
    },
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

export const verifyOtpHandler = async (
  c: Context<Env, typeof entityType, RequestValidationTargets>
) => {
  const { code, token } = c.req.valid("json");

  // * Check if mobile exist
  const db = await initDb(c, c.env.NS, c.env.DB);

  const ID = new RecordId("account_verification", token);
  const auth: any = await db.select(ID);

  if (!auth) {
    return c.json(
      {
        success: false,
        message: "Invalid code.",
        data: null,
      },
      400
    );
  }

  if (!isAfter(new Date(auth?.valid_till), new Date())) {
    return c.json(
      {
        success: false,
        message: "Invalid or expired code.",
        data: null,
      },
      400
    );
  }

  const [verifyOTP] = await db.query(
    `RETURN crypto::argon2::compare($hash, $password)`,
    { password: code, hash: auth?.verification_hash }
  );

  if (!verifyOTP) {
    return c.json(
      {
        success: false,
        message: "Invalid or expired code.",
        data: null,
      },
      400
    );
  }

  const updateOTP = await db.query(
    `RETURN fn::post_account_verification($verifiactionId, $accountId, $mobile);`,
    {
      verifiactionId: ID,
      accountId: auth?.account,
      mobile: auth?.identifier,
    }
  );

  const account: any = await db.select(auth?.account);

  if (!account || account?.status !== "ACTIVE") {
    return c.json(
      {
        success: false,
        message: "Something went wrong. Please contact support.",
        data: null,
      },
      400
    );
  }

  const session = await db.create("auth_session", {
    account: auth?.account,
  });

  const accessToken = await createAccessToken({
    sub: auth?.account?.id,
    iss: "ecommerce-v1.0.0",
    aud: "api-v1.0.0",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60,
    auth_time: Math.floor(Date.now() / 1000),
    // jti: "unique-jwt-id-123",
    roles: account?.groups?.map((i) => i?.id),
    sid: session?.[0]?.id?.id as string,
    device_id: "",
    status: account?.status,
    actype: "",
  });

  return c.json<z.infer<typeof ResponseSchema>, 200>({
    data: { accessToken, account: auth?.account, updateData: updateOTP, auth },
    success: true,
    message: "Successfull",
  });
};
