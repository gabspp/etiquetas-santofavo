import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const dir = path.dirname(fileURLToPath(import.meta.url));
const env = Object.fromEntries(
  readFileSync(path.join(dir, ".env"), "utf-8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
await supabase.auth.signInWithPassword({
  email: env.LOJA_EMAIL,
  password: env.LOJA_SENHA,
});

const { data: fila, error } = await supabase
  .from("fila_impressao")
  .select("id, status, erro, criada_em, impressa_em, loja_id")
  .order("criada_em", { ascending: false })
  .limit(5);

if (error) {
  console.error("Erro:", error);
} else {
  console.log("Ultimos 5 itens da fila:");
  for (const item of fila) {
    console.log(JSON.stringify(item, null, 2));
  }
}
