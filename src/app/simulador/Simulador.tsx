"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icone } from "@/components/Icone";
import { TAXA_POR_RISCO, RISCO_TXT, type Risco } from "@/lib/dados";
import { atualizar, useEstado } from "@/lib/estado";
import { classePelaRegra, cronograma, mensalParaAnual, parcela } from "@/lib/financas";
import { brl, brl0, pct } from "@/lib/formato";
import s from "./simulador.module.css";

const PRAZOS = [6, 12, 18, 24];
const MIN = 2000;
const MAX = 30000;

export function Simulador() {
  const router = useRouter();
  const e = useEstado();
  const [valor, setValor] = useState(10000);
  const [prazo, setPrazo] = useState(12);
  const [classe, setClasse] = useState<Risco>("B");
  const [fat, setFat] = useState("");

  const v = Math.min(MAX, Math.max(MIN, valor || MIN));
  const taxa = TAXA_POR_RISCO[classe];
  const p = parcela(v, taxa, prazo);
  const total = p * prazo;
  const faturamento = Number(fat) || 0;
  const comp = faturamento > 0 ? p / faturamento : null;
  const sugerida = faturamento > 0 ? classePelaRegra({ faturamento, meta: v, prazo, desde: 2026 - 3 }) : null;
  const linhas = cronograma(v, taxa, prazo);

  function pedir() {
    atualizar((x) =>
      x.cadastro.status === "rascunho"
        ? { ...x, cadastro: { ...x.cadastro, campos: { ...x.cadastro.campos, meta: String(v), prazo: String(prazo), ...(faturamento ? { faturamento: String(faturamento) } : {}) } } }
        : x,
    );
    router.push("/cadastro/");
  }

  return (
    <>
      <section className="cabeca-pagina">
        <p className="sobretitulo">Sou MEI</p>
        <h1>Quanto fica a parcela?</h1>
        <p className="lead">Simule antes de pedir. A taxa depende da classe de risco que o time define na análise.</p>
      </section>

      <div className={"cartao " + s.form}>
        <div className="campo">
          <label htmlFor="sim-valor">Valor do crédito</label>
          <div className="entrada-moeda">
            <span aria-hidden="true">R$</span>
            <input
              id="sim-valor" type="number" inputMode="numeric" min={MIN} max={MAX} step={500} value={valor || ""}
              onChange={(ev) => setValor(Number(ev.target.value))}
              onBlur={() => setValor(v)}
              aria-describedby="sim-valor-dica"
            />
          </div>
          <input type="range" min={MIN} max={MAX} step={500} value={v} onChange={(ev) => setValor(Number(ev.target.value))} aria-label="Ajustar valor do crédito" />
          <p className="ajuda" id="sim-valor-dica">Entre {brl0(MIN)} e {brl0(MAX)}.</p>
        </div>

        <fieldset className="campo">
          <legend>Prazo</legend>
          <div className="segmentos">
            {PRAZOS.map((n) => (
              <label key={n}>
                <input type="radio" name="prazo" value={n} checked={prazo === n} onChange={() => setPrazo(n)} />
                <span>{n} meses</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="campo">
          <legend>Classe de risco</legend>
          <div className="segmentos">
            {(["A", "B", "C"] as Risco[]).map((c) => (
              <label key={c}>
                <input type="radio" name="classe" value={c} checked={classe === c} onChange={() => setClasse(c)} />
                <span>{c} · {pct(TAXA_POR_RISCO[c])}</span>
              </label>
            ))}
          </div>
          <p className="ajuda">{RISCO_TXT[classe]}</p>
        </fieldset>

        <div className="campo">
          <label htmlFor="sim-fat">
            Faturamento médio por mês <span className="opcional">(opcional)</span>
          </label>
          <div className="entrada-moeda">
            <span aria-hidden="true">R$</span>
            <input id="sim-fat" type="number" inputMode="numeric" min={0} value={fat} onChange={(ev) => setFat(ev.target.value)} placeholder="Ex.: 6000" />
          </div>
          <p className="ajuda">Ajuda a ver quanto a parcela pesa no seu caixa.</p>
        </div>
      </div>

      <section className={s.resultado} aria-live="polite" aria-labelledby="res-titulo">
        <h2 id="res-titulo" className="sr">Resultado da simulação</h2>
        <p className={s.rotuloParcela}>Parcela mensal</p>
        <p className={s.parcela}>{brl(p)}</p>
        <dl className="linhas">
          <div><dt>Total a pagar</dt><dd>{brl(total)}</dd></div>
          <div><dt>Juros no período</dt><dd>{brl(total - v)}</dd></div>
          <div><dt>Taxa</dt><dd>{pct(taxa)} a.m. · {pct(mensalParaAnual(taxa))} a.a.</dd></div>
          {comp !== null && (
            <div>
              <dt>Peso no faturamento</dt>
              <dd className={comp > 0.35 ? s.alto : comp > 0.25 ? s.medio : s.baixo}>{pct(comp * 100, 0)}</dd>
            </div>
          )}
        </dl>
        {comp !== null && comp > 0.35 && (
          <p className={"caixa-info caixa-alerta " + s.aviso}>
            <Icone nome="alerta" />
            <span>A parcela passa de 35% do faturamento. Na análise, a meta seria reduzida. Tente um valor menor ou um prazo maior.</span>
          </p>
        )}
        {sugerida && comp !== null && comp <= 0.35 && (
          <p className={"caixa-info " + s.aviso}>
            <Icone nome="info" />
            <span>
              Com esse faturamento e ao menos 3 anos de CNPJ, seu pedido tende à <strong>classe {sugerida}</strong>.
            </span>
          </p>
        )}

        <details className={s.cronograma}>
          <summary>Ver as {prazo} parcelas</summary>
          <div className="tabela-rolagem" tabIndex={0} role="region" aria-label="Cronograma de parcelas">
            <table className="tabela">
              <thead>
                <tr><th scope="col">Nº</th><th scope="col">Parcela</th><th scope="col">Juros</th><th scope="col">Amortiza</th><th scope="col">Saldo</th></tr>
              </thead>
              <tbody>
                {linhas.map((l) => (
                  <tr key={l.n}>
                    <td>{l.n}</td><td>{brl(l.parcela)}</td><td>{brl(l.juros)}</td><td>{brl(l.amortizacao)}</td><td>{brl(l.saldo)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>

        <button type="button" className="btn btn-pri btn-largo" onClick={pedir} disabled={e.cadastro.status !== "rascunho"}>
          Pedir {brl0(v)} em {prazo} meses <Icone nome="seta" />
        </button>
        {e.cadastro.status !== "rascunho" && (
          <p className="ajuda" style={{ textAlign: "center" }}>Você já tem um pedido enviado. Veja o andamento em Sou MEI.</p>
        )}
        <p className="ajuda" style={{ textAlign: "center" }}>Tabela Price. Simulação sem IOF e sem tarifas.</p>
      </section>
    </>
  );
}
