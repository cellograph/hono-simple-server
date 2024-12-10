import { NotFoundResponseSchema } from "@/features/shared/responses/not-found.response";
import { Env } from "@/types";
import { createAccessToken } from "@/utils/jwt";
import { initDb } from "@/utils/surreal";
import { createRoute, z } from "@hono/zod-openapi";
import { addMonths } from "date-fns";
import { Context } from "hono";
import { setCookie } from "hono/cookie";

const entityType = "signin";

const SigninSchema = z.object({
  identifier: z.string().openapi({ example: "8801955898711" }),
  password: z.string().optional().openapi({ example: "myStrongPassword" }),
});

const ResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    token: z.string(),
    tokenType: z.enum(["access", "otp"]),
  }),
  message: z.string(),
});

interface RequestValidationTargets {
  out: {
    json: z.infer<typeof SigninSchema>;
  };
}

export const signinRoute = createRoute({
  method: "post",
  path: "/authentication/signin",
  description: "Signin",
  request: {
    body: {
      content: {
        "application/vnd.api+json": {
          schema: SigninSchema,
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

export const signinHandler = async (
  c: Context<Env, typeof entityType, RequestValidationTargets>
) => {
  const { identifier, password } = c.req.valid("json");
  const db = await initDb(c, c.env.NS, c.env.DB);
  // console.log({ db });
  const [exist] = await db.query(
    `SELECT * FROM mobile WHERE formatted_number = $identifier && is_primary = true;`,
    { identifier }
  );

  if (!exist?.[0]?.id) {
    return c.json(
      {
        success: false,
        message: "Invalid Credentials.",
        data: null,
      },
      400
    );
  }

  const account: any = await db.select(exist?.[0]?.account);

  if (!account) {
    return c.json(
      {
        success: false,
        message: "Something went wrong.",
        data: null,
      },
      400
    );
  }

  if (account && account?.status !== "ACTIVE") {
    return c.json(
      {
        success: false,
        message: "Please verify your account.",
        data: null,
      },
      400
    );
  }

  const [valid] = await db.query(
    `RETURN crypto::argon2::compare($hash, $pass)`,
    {
      hash: account.account_hash,
      pass: password,
    }
  );

  if (!valid) {
    return c.json(
      {
        success: false,
        message: "Invalid Credentials.",
        data: null,
      },
      400
    );
  }

  const session = await db.create("auth_session", {
    account: account?.id,
    expires_at: addMonths(new Date(), 12),
  });

  const accessToken = await createAccessToken({
    sub: account?.id?.id as string,
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
    actype: account?.type,
  });

  setCookie(c, "sid", session?.[0]?.id?.id as string, {
    httpOnly: true,
    secure: true,
    sameSite: "Strict",
    maxAge: 60 * 60 * 24 * 7, // 1 week
  });

  return c.json<z.infer<typeof ResponseSchema>, 200>({
    data: { token: accessToken, tokenType: "access" },
    success: true,
    message: "",
  });
};
