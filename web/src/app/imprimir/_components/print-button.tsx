"use client";

type PrintButtonProps = {
  disabled: boolean;
  carregando: boolean;
  copias: number;
  onClick: () => void;
};

// Botão dominante único do fluxo — grande, colado na base da tela no
// celular, sempre visível.
export function PrintButton({ disabled, carregando, copias, onClick }: PrintButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || carregando}
      onClick={onClick}
      className="w-full min-h-[64px] rounded-lg bg-ink text-bg text-lg font-medium transition-[transform,opacity] hover:opacity-90 focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2 active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100"
    >
      {carregando
        ? "Imprimindo..."
        : copias > 1
          ? `Imprimir ${copias} etiquetas`
          : "Imprimir etiqueta"}
    </button>
  );
}
