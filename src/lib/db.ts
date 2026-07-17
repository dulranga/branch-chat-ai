import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

export const encryptionKey = process.env.APP_ENCRYPTION_KEY;
if (!encryptionKey) {
  throw new Error(
    "APP_ENCRYPTION_KEY environment variable is required for encrypting API keys. " +
    "Generate one with: openssl rand -base64 32",
  );
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  statement_timeout: 30000,
});

export const db = drizzle(pool, { schema });
