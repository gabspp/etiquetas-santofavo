// Provisiona uma conta de tablet (uma por loja) e o mapeamento em
// usuarios_loja. Uso pontual, feito por um admin — nunca chamado a partir
// de um caminho de request do app.
//
// Uso: node scripts/provisionar-conta-loja.mjs <email> <senha> <codigo-da-loja>
// Lê NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY de .env.local.

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const [, , email, senha, codigoLoja] = process.argv;
if (!email || !senha || !codigoLoja) {
  console.error("Uso: node scripts/provisionar-conta-loja.mjs <email> <senha> <codigo-da-loja>");
  process.exit(1);
}

const dir = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(dir, "..", ".env.local");
const env = Object.fromEntries(
  readFileSync(envPath, "utf-8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const { data: loja, error: lojaError } = await supabase
  .from("stores")
  .select("id, name, code")
  .eq("code", codigoLoja)
  .single();
if (lojaError || !loja) {
  console.error(`Loja com code="${codigoLoja}" não encontrada em stores.`, lojaError);
  process.exit(1);
}

let userId;
const { data: created, error: userError } = await supabase.auth.admin.createUser({
  email,
  password: senha,
  email_confirm: true,
});
if (userError) {
  if (!userError.message.includes("already been registered")) {
    console.error("Falha ao criar usuário:", userError.message);
    process.exit(1);
  }
  // Já existe (ex: usada em outro app deste mesmo projeto Supabase) —
  // reaproveita a conta, só adiciona o mapeamento de loja.
  let found = null;
  for (let page = 1; !found; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) {
      console.error("Falha ao buscar usuário existente:", error.message);
      process.exit(1);
    }
    found = data.users.find((u) => u.email === email);
    if (data.users.length < 200) break;
  }
  if (!found) {
    console.error(`Usuário ${email} já registrado, mas não encontrado via listUsers.`);
    process.exit(1);
  }
  userId = found.id;
  console.log(`Conta ${email} já existia (user_id=${userId}) — reaproveitando.`);
} else {
  userId = created.user.id;
}

const { error: mapError } = await supabase
  .from("usuarios_loja")
  .upsert({ user_id: userId, loja_id: loja.id });
if (mapError) {
  console.error("Usuário criado, mas falha ao mapear para a loja:", mapError.message);
  process.exit(1);
}

console.log(`OK: ${email} -> ${loja.name} (${loja.code}), user_id=${userId}`);
