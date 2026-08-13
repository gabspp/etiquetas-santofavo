"use client";

// Réplica visual (HTML/CSS) do layout gerado em gerar-zpl.ts, 1:1 nos
// campos e nas proporções — alimentada pelo mesmo objeto snapshot que vai
// para gerarZPL, para preview e impressão nunca divergirem em conteúdo.
// A etiqueta física é térmica monocromática: o preview é sempre
// preto-sobre-branco de propósito, independente do tema do app.

import type { EtiquetaSnapshot } from "@/lib/zpl/gerar-zpl";
import { formatarDataBR, splitDataValidade } from "@/lib/zpl/gerar-zpl";

type LabelPreviewProps = {
  snapshot: EtiquetaSnapshot;
};

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="leading-tight">
      <div className="text-[0.5rem] tracking-wider text-[#777]">{rotulo}</div>
      <div className="text-[0.8rem] font-bold text-[#111] truncate">{valor}</div>
    </div>
  );
}

export function LabelPreview({ snapshot }: LabelPreviewProps) {
  const { diaMes, ano } = splitDataValidade(snapshot.dataValidade);

  return (
    <div className="relative w-full aspect-[3/2] rounded-lg border border-rule bg-white overflow-hidden select-none">
      {/* Zona esquerda — mesma ordem/proporção do ZPL */}
      <div className="absolute inset-y-0 left-0 right-[32.5%] flex flex-col px-3 py-2">
        <span className="text-[0.5rem] tracking-wider text-[#777]">
          SANTO FAVO {snapshot.lojaCodigo}
        </span>
        <span className="text-[1.05rem] font-bold uppercase leading-tight text-[#111] mt-0.5 line-clamp-2">
          {snapshot.produtoNome}
        </span>
        <div className="border-t-2 border-[#111] mt-auto" style={{ marginTop: "0.4rem" }} />
        <div className="flex-1 flex flex-col justify-evenly">
          <Linha rotulo="CONSERVAÇÃO" valor={snapshot.conservacao} />
          <Linha rotulo="MANIPULAÇÃO" valor={formatarDataBR(snapshot.dataManipulacao)} />
          <Linha rotulo="RESPONSÁVEL" valor={snapshot.responsavelNome || "—"} />
        </div>
      </div>

      {/* Bloco invertido da validade — lateral direita inteira */}
      <div className="absolute inset-y-0 right-0 w-[32.5%] bg-black text-white flex flex-col items-center py-3">
        <span className="text-[0.55rem] tracking-widest">VALIDADE</span>
        <div className="flex-1 flex flex-col items-center justify-center gap-1">
          <span className="text-[1.5rem] font-bold leading-none tabular-nums">{diaMes}</span>
          <span className="text-[1.1rem] font-bold leading-none tabular-nums">{ano}</span>
        </div>
      </div>
    </div>
  );
}
