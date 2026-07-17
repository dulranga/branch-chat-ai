import { describe, expect, it } from "vitest";

describe("db module", () => {
  it("loads successfully when APP_ENCRYPTION_KEY is set", async () => {
    const mod = await import("@/lib/db");
    expect(mod.db).toBeDefined();
  });
});
