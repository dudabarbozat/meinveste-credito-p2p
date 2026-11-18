"use client";

import Link from "next/link";
import { CardMei } from "@/components/CardMei";
import { Icone, type NomeIcone } from "@/components/Icone";
import { Barra, Skeleton } from "@/components/ui";
import { atualizar, captado, todosMeis, useEstado, useHidratado } from "@/lib/estado";
import { brl0, pct } from "@/lib/formato";
import s from "./inicio.module.css";

function Blob() {
  return (
    <svg className={s.blob} viewBox="0 0 120 120" aria-hidden="true" focusable="false">
      <path className={s.blobSombra} d="M66 14c22 0 40 22 42 46 2 26-20 46-48 50-26 4-50-8-50-34 0-18 12-30 24-42 10-12 18-20 32-20z" transform="translate(4 6)" />
      <path d="M66 14c22 0 40 22 42 46 2 26-20 46-48 50-26 4-50-8-50-34 0-18 12-30 24-42 10-12 18-20 32-20z" />
    </svg>
  );
}

const PASSOS: { ic: NomeIcone; t: string; d: React.ReactNode }[] = [
  { ic: "baixar", t: "Baixe o app", d: "Ou acesse pelo navegador, como nesta demo." },
  { ic: "usuarios", t: "Faça seu cadastro e login", d: "Comece pelo CNPJ: os dados da empresa vêm da Receita." },
  { ic: "arquivo", t: "Anexe seus documentos financeiros", d: "Certificado do MEI, declaração anual e extratos." },
  { ic: "escudo", t: "Aguarde a análise do nosso time", d: <>Só pedimos um <strong>avalista</strong>: nada de imóvel ou carro como garantia.</> },
];

export function Inicio() {
  const e = useEstado();
  const pronto = useHidratado();
  const abertos = todosMeis(e).filter((m) => captado(e, m) < m.meta)
    .sort((a, b) => captado(e, b) / b.meta - captado(e, a) / a.meta);
  const destaque = abertos[0];

  return (
    <>
      {pronto && !e.guiaVisto && (
        <aside className={s.guia} aria-labelledby="guia-titulo">
          <div className={s.guiaTopo}>
            <h2 id="guia-titulo">Primeira vez aqui?</h2>
            <button type="button" className="icone-btn" aria-label="Dispensar orientação" onClick={() => atualizar((x) => ({ ...x, guiaVisto: true }))}>
              <Icone nome="x" />
            </button>
          </div>
          <ol>
            <li><strong>Investidor:</strong> escolha um negócio na Vitrine e empreste a partir de R$ 50.</li>
            <li><strong>MEI:</strong> simule a parcela e peça crédito em Sou MEI.</li>
            <li>Tudo aqui é fictício e fica salvo só no seu navegador.</li>
          </ol>
        </aside>
      )}

      <section className={s.hero}>
        <p className={s.slogan}>Investindo em Sonhos</p>
        <h1>
          Crédito para quem faz o bairro <em>funcionar</em>.
        </h1>
        <p className="lead">
          Um <strong>marketplace lending</strong> no modelo <strong>P2P</strong>: quem investe empresta direto para o negócio do MEI, sem banco no meio.
        </p>
        <div className="acoes-col">
          <Link className="btn btn-pri btn-largo" href="/vitrine/">
            Quero investir <Icone nome="seta" />
          </Link>
          <Link className="btn btn-sec btn-largo" href="/simulador/">
            Sou MEI: simular meu crédito
          </Link>
        </div>

        {!pronto ? (
          <div className={s.heroCard}><Skeleton linhas={3} /></div>
        ) : destaque ? (
          <Link className={s.heroCard} href={`/negocio/?id=${destaque.id}`} aria-label={`Em destaque: ${destaque.negocio}`}>
            <p className={s.hcRotulo}>
              <Icone nome="pin" />
              {destaque.cidade} / {destaque.uf} · perto da meta
            </p>
            <p className={s.hcNome}>{destaque.negocio}</p>
            <p className={s.hcFin}>{destaque.finalidade}</p>
            <Barra valor={captado(e, destaque)} total={destaque.meta} rotulo={`Captação de ${destaque.negocio}`} />
            <div className={s.hcLinha}>
              <span>
                <strong>{brl0(captado(e, destaque))}</strong> de {brl0(destaque.meta)}
              </span>
              <span>{pct(destaque.taxa)} a.m.</span>
            </div>
          </Link>
        ) : null}
      </section>

      <section className={s.como}>
        <h2>Como funciona?</h2>
        <ol className={s.passos}>
          {PASSOS.map((p, i) => (
            <li key={p.t}>
              <span className={s.passoIc + (i % 2 === 0 ? " " + s.passoVinho : "")}>
                <Blob />
                <Icone nome={p.ic} />
              </span>
              <div>
                <h3>{p.t}</h3>
                <p>{p.d}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="secao">
        <div className="cabeca-acoes">
          <h2>Perto de bater a meta</h2>
          <Link className="link-seta" href="/vitrine/">
            Ver todos <Icone nome="seta" />
          </Link>
        </div>
        {!pronto ? (
          <div style={{ marginTop: 14 }}><Skeleton linhas={3} altura={120} /></div>
        ) : (
          <ul className={s.grade}>
            {abertos.slice(0, 3).map((m) => (
              <li key={m.id}>
                <CardMei e={e} m={m} compacto />
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
