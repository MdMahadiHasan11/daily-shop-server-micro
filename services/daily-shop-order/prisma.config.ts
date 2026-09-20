import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "./prisma/schema",
  migrations: {
    path: "./prisma/schema/migrations",
    seed: "npx tsx src/core/database/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
