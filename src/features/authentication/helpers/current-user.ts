import { initDb } from "@/utils/surreal";
import { getCookie } from "hono/cookie";
import { decode, verify } from "hono/jwt";
import { RecordId } from "surrealdb";

export const getCurrentUser = async (c, token: string) => {
  try {
    const data: any = await verify(
      token,
      "sjdfhskjdhsrkjghskjgfhddkjrfghedrkjgherijkhdgkjhdf",
      "HS512"
    );

    console.log(data);

    // const db = await initDb(c, c.env.NS, c.env.DB);
    // const account = await db.select(new RecordId("account", data?.sub));
    // if (account) {
    //   delete account.account_hash;
    // }
    // const session = await db.select(new RecordId("auth_session", data?.sid));
    // return { account, session };
    return data;
  } catch (error) {
    // console.log({ error });
    // if (error?.name == "JwtTokenExpired") {
    //   const decoded = await decode(token);
    //   console.log({ decoded });

    //   return decoded;
    //   // TODO: CHECK SESSION AND REGENERATE ACESS TOKEN
    // }
    // const decoded = await decode(token);
    // console.log({ decoded });

    return null;
  }
};
