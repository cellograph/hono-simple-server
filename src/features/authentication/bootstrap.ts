import type { Env } from "@/types";
import type { OpenAPIHono } from "@hono/zod-openapi";
import { signinHandler, signinRoute } from "./endpoints/signin.post";
import { signupHandler, signupRoute } from "./endpoints/signup.post";
import { verifyOtpHandler, verifyOtpRoute } from "./endpoints/verify-otp.post";
import {
  currentSessionHandler,
  currentSessionRoute,
} from "./endpoints/current-session.get";

import {
  requestResetPasswordHandler,
  requestResetPasswordRoute,
} from "./endpoints/request-reset-password.post";
import {
  verifyResetCodeHandler,
  verifyResetCodeRoute,
} from "./endpoints/verify-reset-code.post";
import {
  resetPasswordHandler,
  resetPasswordRoute,
} from "./endpoints/reset-password.post";

export default function (app: OpenAPIHono<Env>) {
  app.openAPIRegistry.registerComponent(
    "securitySchemes",
    "AuthorizationBearer", // <- Add security name
    {
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT",
    }
  );

  app.openapi(signinRoute, signinHandler);
  app.openapi(signupRoute, signupHandler);
  app.openapi(verifyOtpRoute, verifyOtpHandler);
  app.openapi(currentSessionRoute, currentSessionHandler);
  app.openapi(requestResetPasswordRoute, requestResetPasswordHandler);
  app.openapi(verifyResetCodeRoute, verifyResetCodeHandler);
  app.openapi(resetPasswordRoute, resetPasswordHandler);
}
