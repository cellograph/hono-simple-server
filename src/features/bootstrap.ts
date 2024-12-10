import type { Env } from "@/types";
import type { OpenAPIHono } from "@hono/zod-openapi";
import authentication from "./authentication/bootstrap";

export const bootstrapFeatures = (app: OpenAPIHono<Env>) => {
  authentication(app);
};
