// Cria/atualiza as tabelas no banco de DATABASE_URL. Uso: npx vercel env pull .env.local && npm run db:setup
import { readFileSync, existsSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

if (existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
  }
}
const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL não definido.");
  process.exit(1);
}
const sql = neon(url);
const statements = readFileSync("db/schema.sql", "utf8")
  .split("\n").filter((l) => !l.trim().startsWith("--")).join("\n")
  .split(";").map((s) => s.trim()).filter(Boolean);
for (const st of statements) {
  await sql.query(st);
  console.log("ok:", st.split("\n")[0].slice(0, 70));
}
console.log("Banco pronto.");
