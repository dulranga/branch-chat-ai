import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ...(process.env.APP_ENCRYPTION_KEY
    ? {
        statement_timeout: 30000,
      }
    : {}),
});

pool.on("connect", async (client) => {
  if (process.env.APP_ENCRYPTION_KEY) {
    await client.query("SET SESSION app.encryption_key = $1", [
      process.env.APP_ENCRYPTION_KEY,
    ]);
  }
});

export const db = drizzle(pool, { schema });
