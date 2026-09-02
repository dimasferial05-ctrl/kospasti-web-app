import { execSync } from "child_process";

export default function setup() {
  process.env.DATABASE_URL = "file:./test.db";
  execSync("npx prisma db push --skip-generate", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: "file:./test.db" },
  });
}
