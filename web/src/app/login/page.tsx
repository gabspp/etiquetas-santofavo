"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCarregando(true);
    setErro("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setErro("Email ou senha da loja incorretos.");
      setCarregando(false);
    } else {
      router.push("/imprimir");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="w-full max-w-sm px-6">
        <div className="mb-8">
          <h1 className="font-serif text-2xl text-ink">Santo Favo</h1>
          <p className="text-ink-soft text-sm mt-1">Etiquetas de validade</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink-soft mb-1.5">
              Email da loja
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-rule-soft bg-bg px-3 py-2.5 text-base text-ink focus:outline-none focus:border-ink transition-colors"
              required
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-soft mb-1.5">
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-rule-soft bg-bg px-3 py-2.5 text-base text-ink focus:outline-none focus:border-ink transition-colors"
              required
            />
          </div>
          {erro && <p className="text-brand-rosa text-sm">{erro}</p>}
          <button
            type="submit"
            disabled={carregando}
            className="w-full bg-ink text-bg rounded-md px-4 py-3 text-base font-medium hover:opacity-90 disabled:opacity-50 transition-opacity mt-2"
          >
            {carregando ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
