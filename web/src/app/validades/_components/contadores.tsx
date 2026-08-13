type ContadoresProps = {
  vencidos: number;
  vencemHoje: number;
};

export function Contadores({ vencidos, vencemHoje }: ContadoresProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="rounded-lg border border-rule-soft bg-bg-card px-4 py-3">
        <p className={`text-3xl font-medium tabular-nums leading-none ${vencidos > 0 ? "text-brand-rosa" : "text-ink"}`}>
          {vencidos}
        </p>
        <p className="text-xs text-ink-muted mt-1.5">vencidas</p>
      </div>
      <div className="rounded-lg border border-rule-soft bg-bg-card px-4 py-3">
        <p className="text-3xl font-medium text-ink tabular-nums leading-none">{vencemHoje}</p>
        <p className="text-xs text-ink-muted mt-1.5">vencem hoje</p>
      </div>
    </div>
  );
}
