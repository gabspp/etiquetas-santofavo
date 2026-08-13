// Agente de impressão — roda no PC da loja (o que tem a impressora
// térmica no USB). Autentica com a conta de tablet da própria loja (a RLS
// por loja_id vale para ele também), escuta a fila_impressao via Realtime
// e despacha cada ZPL para a impressora do Windows em modo RAW.
//
// Configuração via agente-impressao/.env (ver .env.example).
// Listar impressoras disponíveis:  npm run listar

import { createClient } from "@supabase/supabase-js";
import { execFile } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));

// ── Configuração ─────────────────────────────────────────────────
function carregarEnv() {
  const envPath = path.join(dir, ".env");
  let texto;
  try {
    texto = readFileSync(envPath, "utf-8");
  } catch {
    console.error("Arquivo .env não encontrado — copie o .env.example e preencha.");
    process.exit(1);
  }
  return Object.fromEntries(
    texto
      .split("\n")
      .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
      .map((l) => {
        const i = l.indexOf("=");
        return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
      })
  );
}

function powershell(args) {
  return new Promise((resolve, reject) => {
    execFile(
      "powershell.exe",
      ["-NoProfile", "-ExecutionPolicy", "Bypass", ...args],
      { windowsHide: true, timeout: 60_000 },
      (err, stdout, stderr) => {
        if (err) reject(new Error(stderr?.trim() || err.message));
        else resolve(stdout.trim());
      }
    );
  });
}

// ── --listar: mostra as impressoras do Windows e sai ─────────────
if (process.argv.includes("--listar")) {
  const saida = await powershell(["-Command", "Get-Printer | Select-Object -ExpandProperty Name"]);
  console.log("Impressoras instaladas neste PC:\n");
  console.log(saida || "(nenhuma)");
  process.exit(0);
}

const env = carregarEnv();
for (const chave of ["SUPABASE_URL", "SUPABASE_ANON_KEY", "LOJA_EMAIL", "LOJA_SENHA", "IMPRESSORA"]) {
  if (!env[chave]) {
    console.error(`Falta ${chave} no .env.`);
    process.exit(1);
  }
}

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

const { data: sessao, error: loginError } = await supabase.auth.signInWithPassword({
  email: env.LOJA_EMAIL,
  password: env.LOJA_SENHA,
});
if (loginError) {
  console.error("Falha no login:", loginError.message);
  process.exit(1);
}
console.log(`[agente] logado como ${sessao.user.email}, impressora "${env.IMPRESSORA}"`);

// ── Impressão RAW via spooler do Windows ─────────────────────────
async function imprimirZPL(zpl) {
  const pasta = mkdtempSync(path.join(tmpdir(), "etiqueta-"));
  const arquivo = path.join(pasta, "etiqueta.zpl");
  try {
    // fs.writeFileSync em utf8 não gera BOM — importante: um BOM na
    // frente do ^XA confundiria a impressora.
    writeFileSync(arquivo, zpl, "utf-8");
    await powershell(["-File", path.join(dir, "imprimir-raw.ps1"), "-Printer", env.IMPRESSORA, "-Path", arquivo]);
  } finally {
    rmSync(pasta, { recursive: true, force: true });
  }
}

// ── Processamento da fila ────────────────────────────────────────
let processando = false;

async function processarPendentes() {
  if (processando) return; // uma de cada vez — impressora térmica é serial
  processando = true;
  try {
    for (;;) {
      const { data: itens, error } = await supabase
        .from("fila_impressao")
        .select("id, zpl")
        .eq("status", "pendente")
        .order("criada_em", { ascending: true })
        .limit(1);
      if (error) {
        console.error("[agente] erro lendo a fila:", error.message);
        return;
      }
      if (!itens?.length) return;

      const item = itens[0];
      try {
        await imprimirZPL(item.zpl);
        await supabase
          .from("fila_impressao")
          .update({ status: "impressa", impressa_em: new Date().toISOString(), erro: null })
          .eq("id", item.id);
        console.log(`[agente] impressa ${item.id}`);
      } catch (err) {
        const mensagem = err instanceof Error ? err.message : String(err);
        await supabase
          .from("fila_impressao")
          .update({ status: "erro", erro: mensagem })
          .eq("id", item.id);
        console.error(`[agente] erro em ${item.id}:`, mensagem);
      }
    }
  } finally {
    processando = false;
  }
}

// Realtime avisa na hora; o polling de 20s é rede de segurança para
// quedas de conexão (e também drena o que ficou pendente na largada).
supabase
  .channel("fila-impressao")
  .on(
    "postgres_changes",
    { event: "INSERT", schema: "public", table: "fila_impressao" },
    () => void processarPendentes()
  )
  .subscribe((status) => console.log(`[agente] realtime: ${status}`));

setInterval(() => void processarPendentes(), 20_000);
void processarPendentes();

console.log("[agente] aguardando etiquetas... (Ctrl+C para sair)");
