import { Env } from "@/types";
import { generateOTP } from "@/utils/generate-otp";
import { initDb } from "@/utils/surreal";
import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";

import { Context } from "hono";
import jsonContent from "stoker/openapi/helpers/json-content";
import { sendSms } from "@/utils/sms";

const entityType = "signup";

const SignupSchema = z
  .object({
    countryCode: z.string().openapi({ example: "880" }),
    mobile: z.string().openapi({ example: "1955898711" }),
    firstName: z.string().openapi({ example: "John" }),
    lastName: z.string().openapi({ example: "Doe" }),
    password: z.string().min(6, "Too short password."),
    confirmPassword: z.string().min(6),
  })
  .superRefine(({ confirmPassword, password }, ctx) => {
    if (confirmPassword !== password) {
      ctx.addIssue({
        code: "custom",
        message: "The passwords did not match",
        path: ["confirmPassword"],
      });
    }
  })
  .openapi({
    example: {
      mobile: "1955898711",
      countryCode: "880",
      firstName: "John",
      lastName: "Doe",
      password: "myVery#ardPassword",
      confirmPassword: "myVery#ardPassword",
    },
  });

const ResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  message: z.string(),
});

interface RequestValidationTargets {
  out: {
    json: z.infer<typeof SignupSchema>;
  };
}

export const signupRoute = createRoute({
  method: "post",
  path: "/authentication/" + entityType,
  description: "Signup",
  request: {
    body: jsonContent(SignupSchema, "Signup Request body"),
  },
  responses: {
    [HttpStatusCodes.OK]: {
      content: {
        "application/vnd.api+json": {
          schema: ResponseSchema,
        },
      },
      description: "Signup Successful",
    },
    // [HttpStatusCodes.UNAUTHORIZED]: {
    //   content: {
    //     "application/vnd.api+json": {
    //       schema: z.any(),
    //     },
    //   },
    //   description: "Bad Request",
    // },
    [HttpStatusCodes.FORBIDDEN]: {
      content: {
        "application/vnd.api+json": {
          schema: ResponseSchema,
        },
      },
      description: "Forbidden Request(User Exist or Signedin).",
    },
    // [HttpStatusCodes.NOT_FOUND]: {
    //   content: {
    //     "application/vnd.api+json": {
    //       schema: NotFoundResponseSchema,
    //     },
    //   },
    //   description: "Not Found",
    // },
  },
  tags: ["Authentication"],
});

export const signupHandler = async (
  c: Context<Env, typeof entityType, RequestValidationTargets>
) => {
  try {
    const {
      countryCode,
      mobile,
      firstName,
      lastName,
      password,
      confirmPassword,
    } = c.req.valid("json");

    // * Check if mobile exist
    const db = await initDb(c, c.env.NS, c.env.DB);
    const [exist] = await db.query(
      `SELECT * FROM mobile WHERE country_code = $countryCode && mobile = $mobile;`,
      { countryCode, mobile }
    );

    if (exist?.[0]?.id) {
      return c.json(
        {
          success: false,
          message: "Something went wrong.",
        },
        403
      );
    }

    const OTP: string = generateOTP();

    const [account]: any = await db.query(
      `RETURN fn::signup_mobile($countryCode, $mobile, $password, $otp, $firstName, $lastName);`,
      {
        countryCode,
        mobile,
        otp: OTP,
        firstName,
        lastName,
        password,
      }
    );

    return c.json<z.infer<typeof ResponseSchema>, 200>({
      data: { ...account, otpResponse: OTP },
      success: true,
      message: "Signup Successfull",
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        message: error?.message,
        data: null,
      },
      403
    );
  }
};
