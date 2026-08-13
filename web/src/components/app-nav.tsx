"use client";

// NOVO: navegação mínima entre as telas do tablet — só existe porque agora
// há mais de uma tela (Imprimir + Validades). Fora do orçamento de toques
// da impressão em si.

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITENS = [
  { href: "/imprimir", label: "Imprimir" },
  { href: "/validades", label: "Validades" },
  { href: "/produtos", label: "Cadastro" },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-2">
      {ITENS.map((item) => {
        const ativo = pathname?.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex-1 text-center min-h-[44px] rounded-pill px-3 py-2.5 text-sm font-medium border transition-[transform,border-color,background-color] focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2 active:scale-[0.96] ${
              ativo
                ? "bg-ink text-bg border-ink"
                : "bg-bg-card text-ink-soft border-rule-soft hover:border-ink"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
