import type { EmitterEvents } from "@/events";
import type { Emitter } from "@hono/event-emitter";
import { AuthAccessTokenPayload } from "@/utils/jwt";

export type Env = {
  Bindings: {
    BASE_URL: string;
    DB_ENDPOINT: string;
    DB_USERNAME: string;
    DB_PASSWORD: string;
    NS: string;
    DB: string;
    CF_ACCOUNT_ID: string;
    CF_ACCESS_KEY_ID: string;
    CF_SECRET_ACCESS_KEY: string;
    CF_ACCESS_KEY_TOKEN: string;
    R2_BASE_PATH: string;
    R2_PUBLIC_BUCKET_NAME: string;
  };
  Variables: {
    emitter: Emitter<EmitterEvents>;
    user: any;
    session: AuthAccessTokenPayload | null;
  };
};
