"use client";

import { useState } from "react";
import { CardMei } from "@/components/CardMei";
import { Icone } from "@/components/Icone";
import { Skeleton } from "@/components/ui";
import { useTaxas } from "@/components/useTaxas";
import { SEGMENTOS } from "@/lib/dados";
import { captado, metaBatida, todosMeis, useEstado, useHidratado } from "@/lib/estado";
import { brl0, pct } from "@/lib/formato";
import s from "./vitrine.module.css";

type Ordem = "meta" | "taxa" | "risco";

export function Vitrine() {
  const e = useEstado();
  const pronto = useHidratado();
  const taxas = useTaxas();
  const [cidade, setCidade] = useState("");
  const [segmento, setSegmento] = useState("");
  const [abertos, setAbertos] = useState(true);
  const [ordem, setOrdem] = useState<Ordem>("meta");

  const meis = todosMeis(e);
  const cidades = Array.from(new Set(meis.map((m) => `${m.cidade} / ${m.uf}`))).sort((a, b) => a.localeCompare(b, "pt-BR"));
  const lista = meis
    .filter((m) => (!cidade || `${m.cidade} / ${m.uf}` === cidade) && (!segmento || m.segmento === segmento) && (!abertos || !metaBatida(e, m)))
    .sort((a, b) => {
      if (ordem === "taxa") return b.taxa - a.taxa;
      if (ordem === "risco") return a.risco.localeCompare(b.risco) || b.taxa - a.taxa;
      return captado(e, b) / b.meta - captado(e, a) / a.meta;
    });
  const emAberto = meis.filter((m) => !metaBatida(e, m));
  const falta = emAberto.reduce((t, m) => t + (m.meta - captado(e, m)), 0);

  return (
    <>
      <section className="cabeca-pagina">
        <p className="sobretitulo">Vitrine</p>
        <h1>Negócios aprovados, captando agora</h1>
        <p className="lead">Todos passaram pela análise e têm avalista. Você empresta direto e recebe em parcelas mensais.</p>
        {pronto && (
          <p className={s.kpis}>
            <span><strong>{emAberto.length}</strong> em captação</span>
            <span><strong>{brl0(falta)}</strong> para fechar as metas</span>
          </p>
        )}
      </section>

      <div className={s.referencia} aria-live="polite">
        <Icone nome="grafico" />
        {taxas.status === "carregando" ? (
          <span>Buscando o CDI de hoje…</span>
        ) : (
          <span>
            CDI {taxas.aoVivo ? "hoje" : "de referência"}: <strong>{pct(taxas.taxas.cdi, 2)} ao ano</strong>
            {taxas.aoVivo ? " (BrasilAPI)" : " (BrasilAPI indisponível; valor fixo da demo)"}. Use para comparar o retorno.
          </span>
        )}
      </div>

      <form className={s.filtros} aria-label="Filtrar negócios" onSubmit={(ev) => ev.preventDefault()}>
        <div className="campo">
          <label htmlFor="f-cidade">Cidade</label>
          <select id="f-cidade" value={cidade} onChange={(ev) => setCidade(ev.target.value)}>
            <option value="">Todas</option>
            {cidades.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="campo">
          <label htmlFor="f-seg">Segmento</label>
          <select id="f-seg" value={segmento} onChange={(ev) => setSegmento(ev.target.value)}>
            <option value="">Todos</option>
            {SEGMENTOS.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className={"campo " + s.largo}>
          <label htmlFor="f-ordem">Ordenar por</label>
          <select id="f-ordem" value={ordem} onChange={(ev) => setOrdem(ev.target.value as Ordem)}>
            <option value="meta">Mais perto de bater a meta</option>
            <option value="taxa">Maior retorno</option>
            <option value="risco">Menor risco</option>
          </select>
        </div>
        <label className={"checa " + s.largo}>
          <input type="checkbox" checked={abertos} onChange={(ev) => setAbertos(ev.target.checked)} /> Só captações abertas
        </label>
        <p className={s.contagem} aria-live="polite">{pronto ? (lista.length === 1 ? "1 negócio" : `${lista.length} negócios`) : ""}</p>
      </form>

      {!pronto ? (
        <Skeleton linhas={3} altura={180} />
      ) : lista.length ? (
        <ul className={s.grade}>
          {lista.map((m) => (
            <li key={m.id}>
              <CardMei e={e} m={m} cdi={taxas.status === "carregando" ? undefined : taxas.taxas.cdi} />
            </li>
          ))}
        </ul>
      ) : (
        <div className={s.vazio}>
          <p>Nenhum negócio com esses filtros.</p>
          <button type="button" className="btn btn-sec" onClick={() => { setCidade(""); setSegmento(""); setAbertos(false); }}>
            Limpar filtros
          </button>
        </div>
      )}

      <section className={"secao " + s.legenda} aria-labelledby="leg-risco">
        <h2 id="leg-risco">Risco e retorno</h2>
        <dl className="linhas">
          {(["A", "B", "C"] as const).map((r) => {
            const tx = meis.filter((m) => m.risco === r).map((m) => m.taxa);
            const faixa = tx.length ? (Math.min(...tx) === Math.max(...tx) ? pct(Math.min(...tx)) : `${pct(Math.min(...tx))} a ${pct(Math.max(...tx))}`) : "–";
            const txt = { A: "parcela até 15% da receita", B: "parcela até 25% da receita", C: "negócio novo ou parcela maior" }[r];
            return (
              <div key={r}>
                <dt><span className={`risco risco-${r}`}>Risco {r}</span></dt>
                <dd>{faixa} a.m. · {txt}</dd>
              </div>
            );
          })}
        </dl>
        <p className="ajuda">Mais retorno vem com mais risco de atraso. Diversifique entre negócios.</p>
      </section>
    </>
  );
}
