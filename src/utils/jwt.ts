import { sign } from "hono/jwt";

export type AuthAccessTokenPayload = {
  iss: string;
  sub: string;
  aud: string;
  iat: number;
  exp: number;
  auth_time: number;
  jti?: string;
  roles: string[];
  sid: string;
  device_id?: string;
  status: string;
  actype: string;
};

export const createAccessToken = async (payload: AuthAccessTokenPayload) => {
  return await sign(
    payload,
    "sjdfhskjdhsrkjghskjgfhddkjrfghedrkjgherijkhdgkjhdf",
    "HS512"
  );
};
