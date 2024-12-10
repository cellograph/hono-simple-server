import { Context } from "hono";
import { logger } from "hono/logger";
import { csrf } from "hono/csrf";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { requestId } from "hono/request-id";
import { apiReference } from "@scalar/hono-api-reference";
import { basicAuth } from "hono/basic-auth";
import { secureHeaders } from "hono/secure-headers";
import { OpenAPIHono } from "@hono/zod-openapi";
import { zodErrorMiddleware } from "@/middleware/zod-error.middleware";
import { isPathMatch } from "./utils/path";
import { bootstrapFeatures } from "./features/bootstrap";
import { Env } from "./types";
// import { prometheus } from "@hono/prometheus";
import { getCurrentUser } from "./features/authentication/helpers/current-user";

export const app = new OpenAPIHono<Env>({
  defaultHook: zodErrorMiddleware,
});

// const { printMetrics, registerMetrics } = prometheus();

app.use(logger());
app.use(secureHeaders());

// Content Type Guard - allow JSON:API compliant content type only //
app.use(async (c, next) => {
  const excludePaths = ["/", "/docs", "/auth/github*"];
  if (
    !isPathMatch(c.req.path, excludePaths) &&
    !["GET", "OPTIONS", "DELETE"].includes(c.req.method) &&
    c.req.header("Content-Type") !== "application/json"
  ) {
    return c.json({ error: "Unsupported Media Type" }, { status: 415 });
  }
  return next();
});

// CORS //
app.use((c, next) => {
  const corsMiddleware = cors({
    origin: ["http://localhost:3000"], // (origin) => origin,
    allowHeaders: [
      "Content-Type",
      "Accept",
      "X-Auth-Return-Redirect",
      "X-Custom-Header",
      "Upgrade-Insecure-Requests",
    ],
    allowMethods: ["POST", "GET", "DELETE", "PATCH", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true,
  });
  return corsMiddleware(c, next);
});

app.use((c, next) => {
  const csrfMiddleware = csrf({
    origin: ["http://localhost:3000"],
  });
  return csrfMiddleware(c, next);
});

app.use("*", requestId());
// app.use("*", registerMetrics);
app.use("*", async (c, next) => {
  const authHeader = c.req.header("Authorization");

  if (authHeader) {
    const token = authHeader.replace("Bearer ", "");

    // Decode token or validate it and fetch user
    const sessionData: any = await getCurrentUser(c, token);

    c.set("user", sessionData);
  }

  await next();
});

bootstrapFeatures(app);

// app.get("/metrics", printMetrics);

app.doc("/api/v1/doc", (c) => ({
  openapi: "3.0.0",
  info: {
    version: "1.0.0",
    title: "Ecommerce Rest API",
    description: "REST API utilising JSON:API format",
  },
  servers: [
    {
      url: new URL(c.req.url).origin,
      description: "Production environment",
    },
  ],
}));

app.get(
  "/v1",
  apiReference({
    theme: "kepler",
    layout: "classic",
    spec: {
      url: "/api/v1/doc",
    },
    defaultHttpClient: {
      targetKey: "javascript",
      clientKey: "fetch",
    },
  })
);

app.notFound((c: Context, message?: string) => {
  const url = new URL(c.req.url);
  c.status(404);
  return c.json({
    errors: [
      {
        status: 404,
        code: "NOT_FOUND",
        title: "404 Not Found",
        details: message ?? "The resource does not exist",
        links: {
          about: `https://${url.origin}/docs/errors/NOT_FOUND`,
          type: `https://${url.origin}/docs/errors`,
        },
      },
    ],
  });
});

app.onError((err, c) => {
  console.error("app.onError", err);
  if (err instanceof HTTPException) {
    // Get the custom response
    return err.getResponse();
  }
  // TODO: log to logger and return generic error message with error identifier
  return c.json(err, { status: 500 });
});

export default app;
// export default {
//   port: 3000,
//   fetch: app.fetch,
// }
