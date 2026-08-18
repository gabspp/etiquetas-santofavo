"use client";

// NOVO: alternador "Novo/Aberto" — embalagem já guardada que foi aberta
// hoje passa a contar pelo prazo de abertura em vez do prazo do modo de
// conservação (que continua impresso normalmente).

type AberturaToggleProps = {
  aberto: boolean;
  onChange: (aberto: boolean) => void;
};

export function AberturaToggle({ aberto, onChange }: AberturaToggleProps) {
  const btn = (ativo: boolean) =>
    `flex-1 min-h-[52px] rounded-lg border px-4 py-2.5 text-base font-medium transition-[transform,border-color,background-color] focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2 active:scale-[0.98] ${
      ativo ? "bg-ink text-bg border-ink" : "bg-bg-card text-ink border-rule-soft hover:border-ink"
    }`;

  return (
    <div className="flex gap-2">
      <button type="button" onClick={() => onChange(false)} className={btn(!aberto)}>
        Novo
      </button>
      <button type="button" onClick={() => onChange(true)} className={btn(aberto)}>
        Embalagem aberta
      </button>
    </div>
  );
}
