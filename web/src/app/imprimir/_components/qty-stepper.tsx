"use client";

// NOVO: stepper de botões grandes em vez de campo digitável — usado para o
// número de cópias. Alvos de 56px, sem teclado.

type QtyStepperProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
};

export function QtyStepper({ value, onChange, min = 1, max = 50 }: QtyStepperProps) {
  const btn =
    "w-14 h-14 rounded-lg border border-rule-soft bg-bg-card text-ink text-2xl font-medium transition-[transform,border-color] hover:border-ink focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2 active:scale-[0.94] disabled:opacity-35 disabled:active:scale-100";

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        className={btn}
        aria-label="Menos cópias"
      >
        −
      </button>
      <span className="min-w-[3rem] text-center text-2xl font-medium text-ink tabular-nums">
        {value}
      </span>
      <button
        type="button"
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        className={btn}
        aria-label="Mais cópias"
      >
        +
      </button>
    </div>
  );
}
