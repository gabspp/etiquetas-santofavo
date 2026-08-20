"use client";

// Réplica visual (HTML/CSS) do layout gerado em gerar-zpl.ts, 1:1 nos
// campos e nas proporções — alimentada pelo mesmo objeto snapshot que vai
// para gerarZPL, para preview e impressão nunca divergirem em conteúdo.
// A etiqueta física é térmica monocromática: o preview é sempre
// preto-sobre-branco de propósito, independente do tema do app.
//
// As posições e corpos de fonte não são reescritos à mão aqui: saem do
// mesmo perfil FORMATO que o ZPL usa, convertidos de dots para % da
// etiqueta (eixo horizontal) e cqh (vertical). Trocar de rolo em
// gerar-zpl.ts reposiciona este preview junto, sem tocar neste arquivo.

import type { EtiquetaSnapshot } from "@/lib/zpl/gerar-zpl";
import {
  FORMATO,
  conteudoLargura,
  formatarDataBR,
  quebrarNome,
  splitDataValidade,
} from "@/lib/zpl/gerar-zpl";

type LabelPreviewProps = {
  snapshot: EtiquetaSnapshot;
};

const f = FORMATO;
const LARGURA_CONTEUDO = conteudoLargura(f);
const BOX_X = f.pw - f.boxLargura;

/** dots → % da largura da etiqueta */
const px = (dots: number) => `${(dots / f.pw) * 100}%`;
/** dots → % da altura da etiqueta */
const py = (dots: number) => `${(dots / f.ll) * 100}%`;
/** dots → cqh, para o corpo da fonte acompanhar a altura da etiqueta */
const fonte = (dots: number) => `${(dots / f.ll) * 100}cqh`;

/** Linha "rótulo pequeno em cima, valor forte embaixo" — mesmo ritmo do ZPL. */
function Linha({ y, rotulo, valor }: { y: number; rotulo: string; valor: string }) {
  return (
    <>
      <span
        className="absolute tracking-wider text-[#777] leading-none whitespace-nowrap"
        style={{ left: px(f.margem), top: py(y), fontSize: fonte(f.linhas.rotuloFonte) }}
      >
        {rotulo}
      </span>
      <span
        className="absolute font-bold text-[#111] leading-none whitespace-nowrap overflow-hidden"
        style={{
          left: px(f.margem),
          top: py(y + f.linhas.valorOffset),
          width: px(LARGURA_CONTEUDO),
          fontSize: fonte(f.linhas.valorFonte),
        }}
      >
        {valor}
      </span>
    </>
  );
}

export function LabelPreview({ snapshot }: LabelPreviewProps) {
  const { diaMes, ano } = splitDataValidade(snapshot.dataValidade);
  const { validade } = f;

  return (
    <div
      className="relative w-full rounded-lg border border-rule bg-white overflow-hidden select-none"
      style={{ aspectRatio: `${f.pw} / ${f.ll}`, containerType: "size" }}
    >
      {/* Cabeçalho da loja */}
      <span
        className="absolute tracking-wider text-[#777] leading-none whitespace-nowrap"
        style={{ left: px(f.margem), top: py(f.header.y), fontSize: fonte(f.header.fonte) }}
      >
        SANTO FAVO
      </span>

      {/* Nome do produto — quebrado pela mesma função que o ZPL usa, uma
          linha posicionada por vez (inclui as reticências do truncamento) */}
      {quebrarNome(snapshot.produtoNome.toUpperCase(), f).map((linha, i) => (
        <span
          key={i}
          className="absolute font-bold uppercase text-[#111] leading-none whitespace-nowrap"
          style={{
            left: px(f.margem),
            top: py(f.produto.y + i * (f.produto.fonte + f.produto.espacoLinhas)),
            width: px(LARGURA_CONTEUDO),
            fontSize: fonte(f.produto.fonte),
          }}
        >
          {linha}
        </span>
      ))}

      {/* Linha divisória */}
      <div
        className="absolute bg-[#111]"
        style={{
          left: px(f.margem),
          top: py(f.divisor.y),
          width: px(LARGURA_CONTEUDO),
          height: py(2),
        }}
      />

      <Linha y={f.linhas.ys[0]} rotulo="CONSERVAÇÃO" valor={snapshot.conservacao} />
      <Linha
        y={f.linhas.ys[1]}
        rotulo={snapshot.tipoEvento.toUpperCase()}
        valor={formatarDataBR(snapshot.dataEvento)}
      />
      <Linha y={f.linhas.ys[2]} rotulo="RESPONSÁVEL" valor={snapshot.responsavelNome || "—"} />

      {/* Bloco invertido da validade — lateral direita inteira */}
      <div
        className="absolute inset-y-0 bg-black text-white"
        style={{ left: px(BOX_X), width: px(f.boxLargura) }}
      >
        <span
          className="absolute w-full text-center tracking-widest leading-none"
          style={{ top: py(validade.rotuloY), fontSize: fonte(validade.rotuloFonte) }}
        >
          VALIDADE
        </span>
        <span
          className="absolute w-full text-center font-bold leading-none tabular-nums"
          style={{ top: py(validade.diaMesY), fontSize: fonte(validade.diaMesAltura) }}
        >
          {diaMes}
        </span>
        <span
          className="absolute w-full text-center font-bold leading-none tabular-nums"
          style={{ top: py(validade.anoY), fontSize: fonte(validade.anoAltura) }}
        >
          {ano}
        </span>
      </div>
    </div>
  );
}
